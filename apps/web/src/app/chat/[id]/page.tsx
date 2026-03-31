"use client"

// Mock library imports — imported but not wired up yet
import { mockGenXuiContext } from "@beta-epic/ui"
void mockGenXuiContext

import html2canvas from "html2canvas"
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Bot, ChevronRight, Eye, Paperclip, Send, User, X } from "lucide-react"
import {
  Button,
  defaultComponentRegistry,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  GuiComponent,
  GuiProvider,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  JsonViewer,
} from "@beta-epic/ui"
import { isComponentNode, type ComponentNode } from "@beta-epic/ui"
import { type ToolInteraction } from "@/lib/tools"
import { validateDslComponentTree } from "@/lib/dsl-validation"
import { cn } from "@/lib/utils"

function parseJsonValue(content: string): unknown {
  if (!content.trim()) return {}
  try {
    return JSON.parse(content) as unknown
  } catch {
    return content
  }
}

function tryParseEmbeddedJson(value: string): unknown | null {
  const trimmed = value.trim()
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return null
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return null
  }
}

function isImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/")
}

function transformToolViewerValue(value: unknown): unknown {
  if (isImageDataUrl(value)) {
    return "[image data url]"
  }

  if (Array.isArray(value)) {
    return value.map(transformToolViewerValue)
  }

  if (!value || typeof value !== "object") {
    return value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, entryValue]) => {
      if (isImageDataUrl(entryValue)) {
        return [[key, "[image data url]"]]
      }

      if (typeof entryValue === "string") {
        const parsed = tryParseEmbeddedJson(entryValue)
        if (parsed !== null) {
          return [[`${key}.parsed`, transformToolViewerValue(parsed)]]
        }
      }

      return [[key, transformToolViewerValue(entryValue)]]
    }),
  )
}

function resolveAssistantMessage(content: string): string {
  const parsed = parseJsonValue(content)
  if (typeof parsed === "string") return normalizeAssistantMessage(parsed)
  if (parsed && typeof parsed === "object") {
    const message = (parsed as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) return normalizeAssistantMessage(message)
  }
  return normalizeAssistantMessage(content)
}

function normalizeAssistantMessage(content: string): string {
  return content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*-\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function collectImageDataUrls(value: unknown, seen = new Set<string>()): string[] {
  if (isImageDataUrl(value)) {
    if (seen.has(value)) return []
    seen.add(value)
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectImageDataUrls(entry, seen))
  }

  if (!value || typeof value !== "object") {
    return []
  }

  return Object.values(value as Record<string, unknown>).flatMap((entry) =>
    collectImageDataUrls(entry, seen),
  )
}

interface ModelCaps {
  reasoning: boolean
  structuredOutput: boolean
}

const MODEL_CAPS: Record<string, ModelCaps> = {
  "gpt-5.4":      { reasoning: false, structuredOutput: true },
  "gpt-5.2":      { reasoning: false, structuredOutput: true },
  "gpt-5.1":      { reasoning: false, structuredOutput: true },
  "gpt-5":        { reasoning: false, structuredOutput: true },
  "gpt-5-mini":   { reasoning: false, structuredOutput: true },
  "gpt-4.1":      { reasoning: false, structuredOutput: true },
  "gpt-4.1-mini": { reasoning: false, structuredOutput: true },
  "gpt-4o":       { reasoning: false, structuredOutput: true },
  "gpt-4o-mini":  { reasoning: false, structuredOutput: true },
  "o3":           { reasoning: true,  structuredOutput: true },
  "o4-mini":      { reasoning: true,  structuredOutput: true },
}

const MODEL_GROUPS = [
  {
    label: "GPT-5 Series",
    models: [
      { value: "gpt-5.4", label: "GPT-5.4", desc: "Latest flagship" },
      { value: "gpt-5.2", label: "GPT-5.2", desc: "Previous frontier" },
      { value: "gpt-5.1", label: "GPT-5.1", desc: "Best quality · 400k ctx" },
      { value: "gpt-5", label: "GPT-5", desc: "Flagship" },
      { value: "gpt-5-mini", label: "GPT-5 mini", desc: "Fast + efficient" },
    ],
  },
  {
    label: "GPT-4 Series",
    models: [
      { value: "gpt-4.1", label: "GPT-4.1", desc: "1M context" },
      { value: "gpt-4.1-mini", label: "GPT-4.1 mini", desc: "1M context · low cost" },
      { value: "gpt-4o", label: "GPT-4o", desc: "Multimodal general purpose" },
      { value: "gpt-4o-mini", label: "GPT-4o mini", desc: "Low cost" },
    ],
  },
  {
    label: "Reasoning",
    models: [
      { value: "o3", label: "o3", desc: "Advanced reasoning" },
      { value: "o4-mini", label: "o4-mini", desc: "Reasoning · speed" },
    ],
  },
]

const ALL_MODELS = MODEL_GROUPS.flatMap((g) => g.models)

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  attachments?: ImageAttachment[]
  toolInteractions?: ToolInteraction[]
}

interface ImageAttachment {
  id: string
  name: string
  mimeType: string
  dataUrl: string
  width?: number
  height?: number
}

interface ChatData {
  id: string
  title: string
  model: string
  reasoningEffort: string
  messages: Message[]
}

interface FigmaOAuthStatus {
  configured: boolean
  connected: boolean
  hasStoredToken: boolean
  expiresAt: string | null
  scopes: string[]
  error?: string | null
}

interface WorkspaceFile {
  id: string
  chatId: string
  name: string
  type: "initial_state" | "theme_tokens" | "root_config" | "subconfig"
  content: string
  order: number
}

interface PendingToolCall {
  name: string
  args: Record<string, unknown>
}

interface PreviewWorkspaceData {
  initialState: Record<string, unknown>
  theme?: { light: Record<string, string>; dark?: Partial<Record<string, string>> }
  rootConfig: ComponentNode | null
  subConfigs: Record<string, ComponentNode>
}

interface PreviewCapture {
  index: number
  scrollTop: number
  width: number
  height: number
  dataUrl: string
}

function parseJsonRecord(content: string): Record<string, unknown> | null {
  const parsed = parseJsonValue(content)
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>
  }
  return null
}

function toStringRecord(value: Record<string, unknown> | null | undefined): Record<string, string> {
  if (!value) return {}
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => typeof entryValue === "string"),
  ) as Record<string, string>
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error ?? new Error(`Could not read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error("Could not read image dimensions"))
    image.src = dataUrl
  })
}

function getClipboardImageFiles(clipboardData: DataTransfer | null): File[] {
  if (!clipboardData) return []

  const items = Array.from(clipboardData.items ?? [])
  const imageFiles = items.flatMap((item, index) => {
    if (item.kind !== "file" || !item.type.startsWith("image/")) return []

    const file = item.getAsFile()
    if (!file) return []

    const extension = item.type.split("/")[1] || "png"
    const normalizedName = file.name || `pasted-image-${Date.now()}-${index}.${extension}`

    return [
      file.name
        ? file
        : new File([file], normalizedName, {
            type: file.type || item.type || "image/png",
          }),
    ]
  })

  if (imageFiles.length > 0) return imageFiles

  return Array.from(clipboardData.files ?? []).filter(isImageFile)
}

function buildPreviewIssuesContext(
  issues: Array<{ path: string; message: string }>,
): string {
  return [
    "Workspace preview context:",
    "The current workspace preview has DSL issues. If you update config, fix these issues as part of your answer.",
    ...issues.map((issue) => `- ${issue.path}: ${issue.message}`),
  ].join("\n")
}

function ToolInteractionAccordion({
  interaction,
  expanded,
  isLast,
  onToggle,
  onPreviewImage,
}: {
  interaction: ToolInteraction
  expanded: boolean
  isLast: boolean
  onToggle: () => void
  onPreviewImage: (src: string, alt: string) => void
}) {
  const argumentImages = collectImageDataUrls(interaction.arguments)
  const outputImages = interaction.output ? collectImageDataUrls(interaction.output) : []
  const isPending = interaction.output === null

  return (
    <div className="relative pl-4">
      {!isLast && <span className="absolute top-2.5 left-1.5 bottom-[-14px] w-px bg-foreground/20" />}
      <span
        className={cn(
          "absolute top-2.5 left-0.5 size-2 rounded-full",
          isPending ? "animate-pulse bg-amber-500" : "bg-emerald-500",
        )}
      />
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 py-1 text-left text-[11px] transition-colors hover:text-foreground"
        aria-expanded={expanded}
      >
        <span className="min-w-0 flex-1 truncate font-mono font-semibold text-foreground">
          {interaction.name}
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground/90">
          {isPending ? "Running" : "Done"}
        </span>
        <ChevronRight
          className={cn("size-3 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")}
        />
      </button>

      {expanded && (
        <div className="ml-1 py-1 pl-3 text-[11px]">
          <div className="space-y-2">
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Args
              </p>
              {argumentImages.length > 0 && (
                <div className="mb-2 grid grid-cols-2 gap-2">
                  {argumentImages.map((dataUrl, index) => (
                    <img
                      key={`${interaction.callId}-arg-image-${index}`}
                      src={dataUrl}
                      alt={`Tool arg image ${index + 1}`}
                      className="max-h-36 w-full cursor-zoom-in rounded-md border bg-background object-contain"
                      onClick={() => onPreviewImage(dataUrl, `Tool arg image ${index + 1}`)}
                    />
                  ))}
                </div>
              )}
              <JsonViewer
                src={
                  Object.keys(interaction.arguments).length === 0
                    ? { "(none)": true }
                    : transformToolViewerValue(interaction.arguments)
                }
                name={undefined}
                collapsed={false}
                compact
                className="max-h-48"
              />
            </div>

            <div className="pt-1">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Output
              </p>
              {interaction.output === null ? (
                <span className="flex items-center gap-1 py-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
                </span>
              ) : (
                <>
                  {outputImages.length > 0 && (
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      {outputImages.map((dataUrl, index) => (
                        <img
                          key={`${interaction.callId}-output-image-${index}`}
                          src={dataUrl}
                          alt={`Tool output image ${index + 1}`}
                          className="max-h-36 w-full cursor-zoom-in rounded-md border bg-background object-contain"
                          onClick={() => onPreviewImage(dataUrl, `Tool output image ${index + 1}`)}
                        />
                      ))}
                    </div>
                  )}
                  <JsonViewer
                    src={transformToolViewerValue(interaction.output)}
                    name={undefined}
                    collapsed={false}
                    compact
                    className="max-h-56"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [chatTitle, setChatTitle] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [model, setModel] = useState("gpt-5.4")
  const [reasoningEffort, setReasoningEffort] = useState("medium")
  const [input, setInput] = useState("")
  const [pendingAttachments, setPendingAttachments] = useState<ImageAttachment[]>([])
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filesLoading, setFilesLoading] = useState(true)

  const [files, setFiles] = useState<WorkspaceFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [activeRightPane, setActiveRightPane] = useState<"preview" | "file">("preview")
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [previewReady, setPreviewReady] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)
  const [expandedToolCalls, setExpandedToolCalls] = useState<Record<string, boolean>>({})
  const [figmaStatus, setFigmaStatus] = useState<FigmaOAuthStatus | null>(null)
  const [figmaStatusLoading, setFigmaStatusLoading] = useState(true)
  // Track pending tool_call args so tool_output can apply optimistic updates
  const pendingToolCalls = useRef<Map<string, PendingToolCall>>(new Map())
  const pendingFocusedFileId = useRef<string | null>(null)
  const shouldOfferPreviewFixRef = useRef(true)
  const previousRightPaneRef = useRef<"preview" | "file">("preview")

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const previewSurfaceRef = useRef<HTMLDivElement>(null)

  async function refreshFigmaStatus() {
    setFigmaStatusLoading(true)
    try {
      const response = await fetch("/api/figma/oauth/status", { cache: "no-store" })
      const data = (await response.json()) as FigmaOAuthStatus
      setFigmaStatus(data)
    } catch {
      setFigmaStatus(null)
    } finally {
      setFigmaStatusLoading(false)
    }
  }

  function handleConnectFigma() {
    if (typeof window === "undefined") return
    const returnTo = `${window.location.pathname}${window.location.search}`
    window.location.href = `/api/figma/oauth/start?return_to=${encodeURIComponent(returnTo)}`
  }

  useEffect(() => {
    setLoading(true)
    setFilesLoading(true)

    fetch(`/api/chats/${id}`)
      .then((r) => r.json())
      .then((data: ChatData) => {
        setChatTitle(data.title)
        setModel(data.model)
        setReasoningEffort(data.reasoningEffort ?? "medium")
        setMessages(data.messages ?? [])
      })
      .finally(() => setLoading(false))

    fetch(`/api/chats/${id}/files`)
      .then((r) => r.json())
      .then((data: WorkspaceFile[]) => {
        setFiles(data)
        if (data.length > 0) {
          setActiveFileId(data[0].id)
          setActiveRightPane("preview")
        }
      })
      .finally(() => setFilesLoading(false))

    void refreshFigmaStatus()
  }, [id])

  useEffect(() => {
    if (typeof window === "undefined") return

    const url = new URL(window.location.href)
    const oauthStatus = url.searchParams.get("figma_oauth")
    const oauthMessage = url.searchParams.get("figma_message")

    if (!oauthStatus) return

    void refreshFigmaStatus()

    if (oauthStatus === "error") {
      const message = oauthMessage || "Could not connect to Figma."
      setMessages((prev) => [
        ...prev,
        {
          id: `figma-oauth-error-${Date.now()}`,
          role: "system",
          content: message,
        },
      ])
    }

    url.searchParams.delete("figma_oauth")
    url.searchParams.delete("figma_message")
    window.history.replaceState({}, "", url.toString())
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [input])

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.altKey || e.shiftKey) return
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key.toLowerCase() !== "i") return

      e.preventDefault()

      setPreviewExpanded((prev) => {
        if (prev) {
          setActiveRightPane(previousRightPaneRef.current)
          return false
        }

        previousRightPaneRef.current = activeRightPane
        setActiveRightPane("preview")
        return true
      })
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [activeRightPane])

  const activeFile = files.find((f) => f.id === activeFileId) ?? null
  const previewData = useMemo<PreviewWorkspaceData>(() => {
    const initialStateFile = files.find((file) => file.type === "initial_state")
    const themeFile = files.find((file) => file.type === "theme_tokens")
    const rootConfigFile = files.find((file) => file.type === "root_config")

    const initialState = parseJsonRecord(initialStateFile?.content ?? "") ?? {}
    const themeRecord = parseJsonRecord(themeFile?.content ?? "")
    const lightTheme = toStringRecord(asRecord(themeRecord?.light))
    const darkTheme = toStringRecord(asRecord(themeRecord?.dark))

    const rawRootConfig = parseJsonValue(rootConfigFile?.content ?? "")
    const rootConfig = isComponentNode(rawRootConfig) ? rawRootConfig : null

    const subConfigs = Object.fromEntries(
      files
        .filter((file) => file.type === "subconfig")
        .flatMap((file) => {
          const parsed = parseJsonValue(file.content)
          return isComponentNode(parsed) ? [[file.name, parsed]] : []
        }),
    ) as Record<string, ComponentNode>

    return {
      initialState,
      theme: Object.keys(lightTheme).length > 0
        ? {
            light: lightTheme,
            ...(Object.keys(darkTheme).length > 0 ? { dark: darkTheme } : {}),
          }
        : undefined,
      rootConfig,
      subConfigs,
    }
  }, [files])
  const previewIssues = useMemo(() => {
    if (filesLoading) return []

    const knownComponents = new Set(Object.keys(defaultComponentRegistry))

    const issues = previewData.rootConfig
      ? validateDslComponentTree(previewData.rootConfig, { path: "rootConfig", knownComponents })
      : [{ path: "rootConfig", message: "Root config is missing or invalid." }]

    for (const [name, subConfig] of Object.entries(previewData.subConfigs)) {
      issues.push(
        ...validateDslComponentTree(subConfig, {
          path: `subConfigs.${name}`,
          knownComponents,
        }),
      )
    }

    return issues
  }, [filesLoading, previewData])

  useEffect(() => {
    if (loading || streaming || !shouldOfferPreviewFixRef.current) return
    if (files.length === 0) return
    if (previewIssues.length === 0) return
    if (typeof window === "undefined") return

    shouldOfferPreviewFixRef.current = false

    const summary = previewIssues
      .slice(0, 5)
      .map((issue) => `- ${issue.path}: ${issue.message}`)
      .join("\n")
    const extra =
      previewIssues.length > 5 ? `\n- ...and ${previewIssues.length - 5} more issue(s)` : ""

    const confirmed = window.confirm(
      [
        "The current workspace preview has DSL issues.",
        "",
        "Ask AI to fix them now?",
        "",
        summary + extra,
      ].join("\n"),
    )

    if (confirmed) {
      void sendMessage("Please fix the remaining workspace preview DSL issues.")
    }
  }, [files.length, loading, previewIssues, streaming])

  useEffect(() => {
    if (previewIssues.length === 0) {
      shouldOfferPreviewFixRef.current = false
    }
  }, [previewIssues])

  useEffect(() => {
    const shouldWaitForPreview =
      activeRightPane === "preview" &&
      !filesLoading &&
      previewIssues.length === 0 &&
      Boolean(previewData.rootConfig)

    if (!shouldWaitForPreview) {
      setPreviewReady(false)
      return
    }

    let cancelled = false
    let animationFrameId = 0
    let settleTimeoutId = 0

    const waitForPreview = async () => {
      const surface = previewSurfaceRef.current
      const scrollContainer = previewScrollRef.current

      const hasRenderedContent =
        Boolean(surface) &&
        Boolean(scrollContainer) &&
        surface!.getBoundingClientRect().width > 80 &&
        surface!.getBoundingClientRect().height > 80 &&
        scrollContainer!.scrollHeight > 40 &&
        (
          Boolean(
            surface!.querySelector(
              "[data-slot], input, textarea, button, select, svg, img, [role='button'], [role='textbox']",
            ),
          ) ||
          Boolean(surface!.textContent?.trim())
        )

      if (!hasRenderedContent) {
        animationFrameId = window.requestAnimationFrame(() => {
          void waitForPreview()
        })
        return
      }

      try {
        if ("fonts" in document) {
          await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready
        }
      } catch {
        // ignore font readiness failures and continue with the preview capture flow
      }

      if (cancelled) return

      settleTimeoutId = window.setTimeout(() => {
        if (!cancelled) {
          setPreviewReady(true)
        }
      }, 180)
    }

    setPreviewReady(false)
    void waitForPreview()

    return () => {
      cancelled = true
      window.cancelAnimationFrame(animationFrameId)
      window.clearTimeout(settleTimeoutId)
    }
  }, [activeRightPane, filesLoading, previewData.rootConfig, previewIssues.length, files])

  async function appendImageFiles(selectedFiles: File[]) {
    const imageFiles = selectedFiles.filter(isImageFile)
    if (imageFiles.length === 0) return

    const remainingSlots = Math.max(8 - pendingAttachments.length, 0)
    if (remainingSlots === 0) return

    const nextAttachments = await Promise.all(
      imageFiles.slice(0, remainingSlots).map(async (file) => {
        const dataUrl = await readFileAsDataUrl(file)
        const dimensions = await getImageDimensions(dataUrl).catch(() => null)

        return {
          id: typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${file.name}-${Date.now()}`,
          name: file.name,
          mimeType: file.type || "image/*",
          dataUrl,
          ...(dimensions ?? {}),
        } satisfies ImageAttachment
      }),
    )

    setPendingAttachments((prev) => [...prev, ...nextAttachments].slice(0, 8))
  }

  useEffect(() => {
    function handleWindowPaste(event: ClipboardEvent) {
      if (streaming) return

      const clipboardImageFiles = getClipboardImageFiles(event.clipboardData)
      if (clipboardImageFiles.length === 0) return

      event.preventDefault()
      void appendImageFiles(clipboardImageFiles)
    }

    window.addEventListener("paste", handleWindowPaste)
    return () => window.removeEventListener("paste", handleWindowPaste)
  }, [pendingAttachments.length, streaming])

  useEffect(() => {
    if (filesLoading || activeRightPane !== "preview" || !previewReady) return

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      const container = previewScrollRef.current
      const surface = previewSurfaceRef.current
      if (!container || !surface || cancelled) return

      const viewportHeight = Math.max(container.clientHeight, 1)
      const captures: PreviewCapture[] = []

      try {
        const fullWidth = Math.max(
          Math.ceil(surface.scrollWidth),
          Math.ceil(surface.getBoundingClientRect().width),
          1,
        )
        const fullHeight = Math.max(
          Math.ceil(surface.scrollHeight),
          Math.ceil(surface.getBoundingClientRect().height),
          1,
        )
        const backgroundColor = getComputedStyle(container).backgroundColor || "#ffffff"

        const fullCanvas = await html2canvas(surface, {
          backgroundColor,
          logging: false,
          scale: 1,
          useCORS: true,
          width: fullWidth,
          height: fullHeight,
          windowWidth: window.innerWidth,
          windowHeight: fullHeight,
          scrollX: 0,
          scrollY: 0,
        })

        const segmentCount = Math.min(Math.max(Math.ceil(fullCanvas.height / viewportHeight), 1), 6)

        for (let index = 0; index < segmentCount; index++) {
          if (cancelled) return

          const sourceY = index * viewportHeight
          const sliceHeight = Math.min(viewportHeight, fullCanvas.height - sourceY)
          if (sliceHeight <= 0) break

          const sliceCanvas = document.createElement("canvas")
          sliceCanvas.width = fullCanvas.width
          sliceCanvas.height = sliceHeight
          const context = sliceCanvas.getContext("2d")
          if (!context) continue

          context.drawImage(
            fullCanvas,
            0,
            sourceY,
            fullCanvas.width,
            sliceHeight,
            0,
            0,
            sliceCanvas.width,
            sliceCanvas.height,
          )

          captures.push({
            index,
            scrollTop: sourceY,
            width: sliceCanvas.width,
            height: sliceCanvas.height,
            dataUrl: sliceCanvas.toDataURL("image/jpeg", 0.9),
          })
        }
      } catch (error) {
        console.error("Preview snapshot capture failed:", error)
        return
      }

      if (cancelled || captures.length === 0) return

      await fetch(`/api/chats/${id}/preview-snapshots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captures }),
      }).catch(() => {})
    }, 700)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [activeRightPane, files, filesLoading, id, previewExpanded, previewIssues.length, previewReady])

  async function handleAttachImages(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? [])
    await appendImageFiles(selectedFiles)
    event.target.value = ""
  }

  function removePendingAttachment(idToRemove: string) {
    setPendingAttachments((prev) => prev.filter((attachment) => attachment.id !== idToRemove))
  }

  async function sendMessage(contentOverride?: string) {
    const content = (contentOverride ?? input).trim()
    const attachments = contentOverride ? [] : pendingAttachments
    if ((!content && attachments.length === 0) || streaming) return
    const previewIssuePayload = previewIssues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    }))
    const previewSystemContent =
      previewIssuePayload.length > 0 ? buildPreviewIssuesContext(previewIssuePayload) : null

    if (!contentOverride) {
      setInput("")
      setPendingAttachments([])
    }
    setMessages((prev) => [
      ...prev,
      ...(previewSystemContent
        ? [{ id: `s-${Date.now()}`, role: "system" as const, content: previewSystemContent }]
        : []),
      { id: `u-${Date.now()}`, role: "user", content, attachments },
    ])
    setStreaming(true)

    const placeholderId = `a-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: placeholderId, role: "assistant", content: "" },
    ])

    try {
      const res = await fetch(`/api/chats/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          attachments,
          model,
          reasoningEffort,
          previewIssues: previewIssuePayload,
        }),
      })

      if (!res.ok || !res.body) {
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event = JSON.parse(line) as Record<string, unknown>

            if (event.type === "tool_call") {
              // Stash args so tool_output can apply optimistic file updates
              pendingToolCalls.current.set(
                event.callId as string,
                {
                  name: event.name as string,
                  args: event.arguments as Record<string, unknown>,
                },
              )
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === placeholderId
                    ? {
                        ...m,
                        toolInteractions: [
                          ...(m.toolInteractions ?? []),
                          {
                            callId: event.callId as string,
                            name: event.name as string,
                            arguments: event.arguments as Record<string, unknown>,
                            output: null,
                          },
                        ],
                      }
                    : m,
                ),
              )
            } else if (event.type === "tool_output") {
              // Optimistic file update — patch local state immediately on successful writes
              const callId = event.callId as string
              const output = event.output as Record<string, unknown>
              const pendingToolCall = pendingToolCalls.current.get(callId)
              if (pendingToolCall) {
                const { name, args } = pendingToolCall

                if (name === "create_file" && typeof output.id === "string") {
                  const createdFile: WorkspaceFile = {
                    id: output.id,
                    chatId: String(id),
                    name: typeof output.name === "string"
                      ? output.name
                      : (typeof args.name === "string" ? args.name : "Untitled"),
                    type: "subconfig",
                    content: typeof args.content === "string" ? args.content : "",
                    order: files.length,
                  }
                  setFiles((prev) => {
                    if (prev.some((f) => f.id === createdFile.id)) return prev
                    return [...prev, { ...createdFile, order: prev.length }]
                  })
                  setActiveFileId(output.id)
                  setActiveRightPane("file")
                  pendingFocusedFileId.current = output.id
                }

                if (output.ok === true) {
                  if (name === "update_file" && typeof args.file_id === "string" && typeof args.content === "string") {
                    // update_file — patch content immediately and focus updated file
                    setFiles((prev) =>
                      prev.map((f) =>
                        f.id === args.file_id ? { ...f, content: args.content as string } : f,
                      ),
                    )
                    setActiveFileId(args.file_id)
                    setActiveRightPane("file")
                    pendingFocusedFileId.current = args.file_id
                  } else if (name === "rename_file" && typeof args.file_id === "string" && typeof args.name === "string") {
                    // rename_file — patch name immediately and focus renamed file
                    setFiles((prev) =>
                      prev.map((f) =>
                        f.id === args.file_id ? { ...f, name: args.name as string } : f,
                      ),
                    )
                    setActiveFileId(args.file_id)
                    setActiveRightPane("file")
                    pendingFocusedFileId.current = args.file_id
                  } else if (name === "delete_file" && typeof args.file_id === "string") {
                    setFiles((prev) => prev.filter((f) => f.id !== args.file_id))
                    setActiveFileId((prev) => (prev === args.file_id ? null : prev))
                    if (pendingFocusedFileId.current === args.file_id) {
                      pendingFocusedFileId.current = null
                    }
                  }
                }
              }
              pendingToolCalls.current.delete(callId)
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === placeholderId
                    ? {
                        ...m,
                        toolInteractions: (m.toolInteractions ?? []).map((t) =>
                          t.callId === event.callId
                            ? { ...t, output: event.output as Record<string, unknown> }
                            : t,
                        ),
                      }
                    : m,
                ),
              )
            } else if (event.type === "response") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === placeholderId
                    ? {
                        id: event.id as string,
                        role: "assistant" as const,
                        content: event.content as string,
                        toolInteractions: m.toolInteractions,
                      }
                    : m,
                ),
              )
              fetch(`/api/chats/${id}`)
                .then((r) => r.json())
                .then((d: ChatData) => setChatTitle(d.title))
                .catch(() => {})
              // Re-fetch all files to sync creates, deletes, and any missed updates
              fetch(`/api/chats/${id}/files`)
                .then((r) => r.json())
                .then((data: WorkspaceFile[]) => {
                  setFiles(data)
                  // Prefer the most recently created/updated file if present.
                  setActiveFileId((prev) => {
                    const pending = pendingFocusedFileId.current
                    if (pending && data.some((f) => f.id === pending)) {
                      pendingFocusedFileId.current = null
                      return pending
                    }

                    const still = data.find((f) => f.id === prev)
                    return still ? prev : (data[0]?.id ?? null)
                  })
                })
                .catch(() => {})
              setActiveRightPane("preview")
              shouldOfferPreviewFixRef.current = true
            } else if (event.type === "error") {
              setMessages((prev) => prev.filter((m) => m.id !== placeholderId))
              console.error("Generation error:", event.message)
            }
          } catch {
            // malformed line, skip
          }
        }
      }
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function handleModelChange(newModel: string) {
    setModel(newModel)
    await fetch(`/api/chats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: newModel }),
    })
  }

  async function handleReasoningEffortChange(effort: string) {
    if (!effort) return
    setReasoningEffort(effort)
    await fetch(`/api/chats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reasoningEffort: effort }),
    })
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Top bar — spans full width */}
        <header className={cn("flex h-12 shrink-0 items-center gap-1.5 border-b px-3", previewExpanded && "hidden")}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/chats")}
          >
            <ArrowLeft className="size-3.5" />
          </Button>
          <span className="flex-1 truncate text-xs font-medium text-foreground/80">
            {loading ? (
              <span className="inline-block h-4 w-40 animate-pulse rounded bg-muted" />
            ) : (
              (chatTitle ?? "Chat")
            )}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={handleConnectFigma}
            disabled={figmaStatusLoading || !figmaStatus?.configured}
          >
            {figmaStatusLoading
              ? "Figma…"
              : figmaStatus?.connected
                ? "Figma connected"
                : figmaStatus?.configured
                  ? "Connect Figma"
                  : "Figma OAuth missing"}
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroup
                type="single"
                value={reasoningEffort}
                onValueChange={handleReasoningEffortChange}
                disabled={!MODEL_CAPS[model]?.reasoning}
                className="h-7 gap-0 rounded-md border disabled:opacity-40"
              >
                {(["low", "medium", "high"] as const).map((level) => (
                  <ToggleGroupItem
                    key={level}
                    value={level}
                    className="h-7 rounded-none px-2 text-[11px] first:rounded-l-md last:rounded-r-md"
                  >
                    {level === "medium" ? "Med" : level.charAt(0).toUpperCase() + level.slice(1)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {MODEL_CAPS[model]?.reasoning
                ? "Reasoning effort"
                : "Reasoning effort (not supported by this model)"}
            </TooltipContent>
          </Tooltip>

          <Select value={model} onValueChange={handleModelChange}>
            <SelectTrigger className="h-7 w-32 text-[11px]">
              <SelectValue>
                {ALL_MODELS.find((m) => m.value === model)?.label ?? model}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end" className="w-56">
              {MODEL_GROUPS.map((group, gi) => (
                <span key={group.label}>
                  {gi > 0 && <SelectSeparator />}
                  <SelectGroup>
                    <SelectLabel className="text-xs">{group.label}</SelectLabel>
                    {group.models.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <span className="text-xs font-medium">{m.label}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {m.desc}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </span>
              ))}
            </SelectContent>
          </Select>
        </header>

        {/* Main workspace: chat left + file view right */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── LEFT: Chat panel ── */}
          <div className={cn("flex w-[36%] shrink-0 flex-col border-r", previewExpanded && "hidden")}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3 px-3 py-4">
                {messages.length === 0 && !loading && (
                  <div className="flex flex-col items-center gap-2.5 py-12 text-center">
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <Bot className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">What can I help you with?</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Send a message to start the conversation
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  msg.role === "system" ? (
                    <div key={msg.id} className="flex justify-center">
                      <div className="max-w-[94%] rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-[12px] leading-5 text-muted-foreground whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-1.5",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="size-2.5" />
                      </div>
                    )}

                    {msg.role === "assistant" ? (
                      <div className="flex max-w-[90%] flex-col gap-1.5">
                        {msg.toolInteractions && msg.toolInteractions.length > 0 && (
                          <div className="space-y-0">
                            {msg.toolInteractions.map((interaction, index) => (
                              <ToolInteractionAccordion
                                key={interaction.callId}
                                interaction={interaction}
                                expanded={Boolean(expandedToolCalls[interaction.callId])}
                                isLast={index === msg.toolInteractions!.length - 1}
                                onToggle={() =>
                                  setExpandedToolCalls((prev) => ({
                                    ...prev,
                                    [interaction.callId]: !prev[interaction.callId],
                                  }))}
                                onPreviewImage={(src, alt) => setPreviewImage({ src, alt })}
                              />
                            ))}
                          </div>
                        )}

                        {msg.content ? (
                          <div className="whitespace-pre-wrap px-0.5 py-0.5 text-[12px] leading-5 text-foreground/90">
                            {resolveAssistantMessage(msg.content)}
                          </div>
                        ) : (
                          <div className="px-0.5 py-1 text-sm">
                            <span className="flex items-center gap-1 py-0.5">
                              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex max-w-[85%] flex-col gap-2 rounded-xl rounded-br-sm bg-primary px-3 py-2 text-[13px] leading-5 text-primary-foreground",
                        )}
                      >
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {msg.attachments.map((attachment) => (
                              <img
                                key={attachment.id}
                                src={attachment.dataUrl}
                                alt={attachment.name}
                                className="max-h-40 w-full cursor-zoom-in rounded-md border border-primary-foreground/20 bg-black/10 object-cover"
                                onClick={() =>
                                  setPreviewImage({
                                    src: attachment.dataUrl,
                                    alt: attachment.name,
                                  })}
                              />
                            ))}
                          </div>
                        )}
                        {msg.content ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : null}
                      </div>
                    )}

                    {msg.role === "user" && (
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full border bg-muted">
                        <User className="size-2.5" />
                      </div>
                    )}
                  </div>
                  )
                ))}

                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t bg-background/80 px-2.5 py-2.5 backdrop-blur-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => void handleAttachImages(event)}
                className="hidden"
              />
              {pendingAttachments.length > 0 && (
                <div className="mb-2 grid grid-cols-3 gap-2 md:grid-cols-4">
                  {pendingAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="group relative overflow-hidden rounded-lg border bg-muted/20"
                    >
                      <img
                        src={attachment.dataUrl}
                        alt={attachment.name}
                        className="h-20 w-full cursor-zoom-in object-cover"
                        onClick={() =>
                          setPreviewImage({
                            src: attachment.dataUrl,
                            alt: attachment.name,
                          })}
                      />
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(attachment.id)}
                        className="absolute right-1 top-1 rounded-full border bg-background/90 p-1 text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={`Remove ${attachment.name}`}
                      >
                        <X className="size-3" />
                      </button>
                      <div className="truncate border-t px-2 py-1 text-[10px] text-muted-foreground">
                        {attachment.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={streaming}
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-0.5 shrink-0 rounded-lg"
                >
                  <Paperclip className="size-3.5" />
                </Button>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message…"
                  rows={1}
                  disabled={streaming}
                  className="flex-1 resize-none rounded-lg border bg-muted/30 px-3 py-2 text-[13px] leading-5 outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <Button
                  onClick={() => void sendMessage()}
                  disabled={(!input.trim() && pendingAttachments.length === 0) || streaming}
                  size="icon-sm"
                  className="mb-0.5 shrink-0 rounded-lg"
                >
                  <Send className="size-3.5" />
                </Button>
              </div>
              <p className="mt-1 text-center text-[11px] text-muted-foreground">
                Attach one or more reference images with the paperclip
                &middot;{" "}
                <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Enter</kbd> to send
                &middot;{" "}
                <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Shift+Enter</kbd> for new line
              </p>
            </div>
          </div>

          {/* ── RIGHT: File panel ── */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Tab bar — horizontally scrollable, no close buttons */}
            <div className={cn("flex shrink-0 border-b bg-muted/20", previewExpanded && "hidden")}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveRightPane("preview")}
                    className={cn(
                      "relative flex items-center justify-center border-r px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-muted/60",
                      activeRightPane === "preview"
                        ? "bg-background text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-background"
                        : "text-muted-foreground",
                    )}
                  >
                    <Eye className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Preview</TooltipContent>
              </Tooltip>

              <div
                className="flex min-w-0 flex-1 items-end gap-0 overflow-x-auto scrollbar-none"
                style={{ scrollbarWidth: "none" }}
              >
                {files.map((file) => (
                  <Tooltip key={file.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setActiveFileId(file.id)
                          setActiveRightPane("file")
                        }}
                        className={cn(
                          "relative flex shrink-0 items-center gap-1.5 border-r px-3 py-1.5 text-[11px] font-medium transition-colors",
                          "hover:bg-muted/60",
                          activeRightPane === "file" && file.id === activeFileId
                            ? "bg-background text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-background"
                            : "text-muted-foreground",
                        )}
                      >
                        <FileTypeIndicator type={file.type} />
                        {file.name}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-mono text-xs">
                      {file.id}
                    </TooltipContent>
                  </Tooltip>
                ))}
                {files.length === 0 && loading && (
                  <div className="flex gap-2 px-3 py-2">
                    {[80, 96, 72].map((w) => (
                      <span
                        key={w}
                        className="inline-block h-4 animate-pulse rounded bg-muted"
                        style={{ width: w }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* File content area */}
            <div className="relative flex-1 overflow-hidden">
              {activeRightPane === "preview" ? (
                <div
                  ref={previewScrollRef}
                  className="h-full overflow-auto bg-background p-3"
                >
                  {filesLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Loading workspace preview...
                    </div>
                  ) : previewIssues.length > 0 ? (
                    <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                      <div>
                        <p className="text-sm font-medium text-destructive">Preview blocked by DSL issues</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Fix these config problems to render the workspace preview.
                        </p>
                      </div>
                      <div className="space-y-2">
                        {previewIssues.map((issue) => (
                          <div
                            key={`${issue.path}:${issue.message}`}
                            className="rounded-md border bg-background/70 px-3 py-2"
                          >
                            <p className="font-mono text-[11px] text-muted-foreground">{issue.path}</p>
                            <p className="text-sm">{issue.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : previewData.rootConfig ? (
                    <div
                      ref={previewSurfaceRef}
                      className="min-h-full rounded-lg border bg-card p-4"
                    >
                      {!previewReady && (
                        <div className="mb-3 rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                          Rendering workspace preview...
                        </div>
                      )}
                      <GuiProvider theme={previewData.theme}>
                        <GuiComponent
                          rootConfig={previewData.rootConfig}
                          refConfigs={previewData.subConfigs}
                          store={{
                            sliceName: String(id),
                            initialState: previewData.initialState,
                          }}
                        />
                      </GuiProvider>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Preview unavailable
                    </div>
                  )}
                </div>
              ) : activeFile ? (
                <div className="h-full p-2.5">
                  <JsonViewer
                    src={parseJsonValue(activeFile.content)}
                    title={activeFile.name}
                    collapsed={false}
                    compact
                    contentClassName="h-full"
                    className="h-full"
                  />
                </div>
              ) : (
                !loading && (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No files
                  </div>
                )
              )}
            </div>
          </div>
        </div>
        <Dialog
          open={Boolean(previewImage)}
          onOpenChange={(open) => {
            if (!open) setPreviewImage(null)
          }}
        >
          <DialogContent className="max-w-5xl p-2 sm:max-w-5xl" showCloseButton>
            <DialogHeader className="sr-only">
              <DialogTitle>Image preview</DialogTitle>
              <DialogDescription>
                Enlarged preview for attached and tool output images.
              </DialogDescription>
            </DialogHeader>
            {previewImage && (
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                className="max-h-[85vh] w-full rounded-lg object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

function FileTypeIndicator({ type }: { type: WorkspaceFile["type"] }) {
  const colors: Record<WorkspaceFile["type"], string> = {
    initial_state: "bg-blue-400",
    theme_tokens:  "bg-purple-400",
    root_config:   "bg-orange-400",
    subconfig:     "bg-green-400",
  }
  return <span className={cn("size-1.5 rounded-full", colors[type])} />
}
