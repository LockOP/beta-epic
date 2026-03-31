import type { Db } from "mongodb"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type StoredImageAttachment = {
  name?: string
  mimeType?: string
  dataUrl?: string
  width?: number
  height?: number
}

type StoredPreviewCapture = {
  index?: number
  scrollTop?: number
  width?: number
  height?: number
  dataUrl?: string
}

type SanitizedImageAttachment = Required<Pick<StoredImageAttachment, "dataUrl">> &
  Pick<StoredImageAttachment, "name" | "mimeType" | "width" | "height">

type SanitizedPreviewCapture = Required<Pick<StoredPreviewCapture, "dataUrl">> &
  Pick<StoredPreviewCapture, "index" | "scrollTop" | "width" | "height">

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

function isImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/")
}

function sanitizeImageAttachment(
  value: unknown,
): SanitizedImageAttachment | null {
  if (!value || typeof value !== "object") return null

  const attachment = value as StoredImageAttachment
  if (!isImageDataUrl(attachment.dataUrl)) return null

  return {
    dataUrl: attachment.dataUrl,
    ...(typeof attachment.name === "string" ? { name: attachment.name } : {}),
    ...(typeof attachment.mimeType === "string" ? { mimeType: attachment.mimeType } : {}),
    ...(typeof attachment.width === "number" ? { width: attachment.width } : {}),
    ...(typeof attachment.height === "number" ? { height: attachment.height } : {}),
  }
}

function sanitizePreviewCapture(
  value: unknown,
): SanitizedPreviewCapture | null {
  if (!value || typeof value !== "object") return null

  const capture = value as StoredPreviewCapture
  if (!isImageDataUrl(capture.dataUrl)) return null

  return {
    dataUrl: capture.dataUrl,
    ...(typeof capture.index === "number" ? { index: capture.index } : {}),
    ...(typeof capture.scrollTop === "number" ? { scrollTop: capture.scrollTop } : {}),
    ...(typeof capture.width === "number" ? { width: capture.width } : {}),
    ...(typeof capture.height === "number" ? { height: capture.height } : {}),
  }
}

export const definition = {
  type: "function" as const,
  name: "capture_preview_snapshot",
  description:
    "Get the latest captured workspace preview snapshots and optionally run a visual review comparing the rendered UI against the Figma reference (if one was fetched) and any user-provided images. IMPORTANT: Only call this after all workspace files have been written and at least one tool round has passed — the browser needs time to render the new config before a snapshot is available.",
  parameters: {
    type: "object",
    properties: {
      review: {
        type: "boolean",
        description: "When true, also return a UI/UX review of the captured preview snapshots.",
      },
      compare_to_user_images: {
        type: "boolean",
        description:
          "When true, include recent user-provided image attachments as reference images in the review.",
      },
      focus: {
        type: "string",
        description:
          "Optional review focus, for example spacing, hierarchy, polish, responsiveness, or visual match.",
      },
    },
    required: [] as string[],
    additionalProperties: false,
  },
}

export async function execute(
  context: { chatId: string; db: Db },
  args: { review?: boolean; compare_to_user_images?: boolean; focus?: string } = {},
): Promise<Record<string, unknown>> {
  const snapshotDoc = await context.db
    .collection("chat_preview_snapshots")
    .find({ chatId: context.chatId })
    .sort({ updatedAt: -1 })
    .limit(1)
    .next()

  const snapshotCaptures =
    snapshotDoc && Array.isArray(snapshotDoc.captures) ? snapshotDoc.captures : []
  const captures = snapshotCaptures.map(sanitizePreviewCapture).filter(isDefined)

  if (captures.length === 0) {
    return { error: "No preview snapshot is available yet. The browser captures the preview after a short delay — call get_resolved_config first to confirm all files are healthy, then retry capture_preview_snapshot in the next round." }
  }

  // Guard against stale snapshots: if the snapshot is older than 10 seconds and a review
  // was requested, warn the model so it doesn't act on outdated data.
  const snapshotAge = snapshotDoc?.updatedAt
    ? Date.now() - new Date(snapshotDoc.updatedAt as Date).getTime()
    : null
  const snapshotIsStale = snapshotAge !== null && snapshotAge > 10_000

  const basePayload = {
    capturedAt: snapshotDoc?.updatedAt ?? null,
    snapshotAgeMs: snapshotAge,
    staleWarning: snapshotIsStale ? "Snapshot may be stale — it was captured before the latest file write. Results may not reflect the current config." : undefined,
    captureCount: captures.length,
    captures: captures.map((capture, index) => ({
      index: capture.index ?? index,
      scrollTop: capture.scrollTop ?? 0,
      width: capture.width ?? null,
      height: capture.height ?? null,
      dataUrl: capture.dataUrl,
    })),
  }

  if (!args.review) {
    return basePayload
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      ...basePayload,
      error: "OPENAI_API_KEY is not configured, so visual review is unavailable.",
    }
  }

  // Always pull the stored Figma reference image for visual comparison.
  // This is persisted by get_figma_screenshot so it's available even without a user attachment.
  const figmaRef = await context.db
    .collection("chat_figma_references")
    .findOne({ chatId: context.chatId })

  const figmaReferenceDataUrl =
    figmaRef && isImageDataUrl(figmaRef.dataUrl) ? (figmaRef.dataUrl as string) : null

  const recentMessages = args.compare_to_user_images
    ? await context.db
        .collection("messages")
        .find({ chatId: context.chatId, role: "user", attachments: { $exists: true, $ne: [] } })
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray()
    : []

  const userReferenceImages = recentMessages
    .flatMap((message) =>
      Array.isArray(message.attachments)
        ? message.attachments.map(sanitizeImageAttachment).filter(isDefined)
        : [],
    )
    .slice(0, 6)

  const hasFigmaRef = figmaReferenceDataUrl !== null
  const hasUserImages = userReferenceImages.length > 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [
    {
      type: "input_text",
      text: [
        "Review this Studio workspace preview for UI/UX quality.",
        "The preview may be split into multiple captures from top to bottom to cover the full height.",
        args.focus ? `Focus on: ${args.focus}.` : "Focus on layout, spacing, visual hierarchy, alignment, responsiveness, and polish.",
        hasFigmaRef
          ? "A Figma design reference is provided at the end. Compare the preview against it and call out every layout, component, spacing, or visual mismatch."
          : hasUserImages
          ? "Reference images are provided at the end. Compare the preview against them and call out mismatches."
          : "Review the preview on its own merits.",
        "Respond concisely with: what matches, what doesn't match (be specific about each diff), and concrete DSL changes needed.",
      ].join("\n"),
    },
  ]

  captures.forEach((capture, index) => {
    content.push({
      type: "input_text",
      text: `Preview capture ${index + 1} of ${captures.length} (top-to-bottom segment order).`,
    })
    content.push({
      type: "input_image",
      image_url: capture.dataUrl,
    })
  })

  if (hasFigmaRef) {
    content.push({ type: "input_text", text: "Figma design reference (source of truth):" })
    content.push({ type: "input_image", image_url: figmaReferenceDataUrl })
  }

  if (args.compare_to_user_images && hasUserImages) {
    userReferenceImages.forEach((attachment, index) => {
      content.push({
        type: "input_text",
        text: `User reference image ${index + 1}${attachment.name ? `: ${attachment.name}` : ""}.`,
      })
      content.push({
        type: "input_image",
        image_url: attachment.dataUrl,
      })
    })
  }

  const response = await openai.responses.create({
    model: "gpt-4.1",
    store: false,
    input: [
      {
        role: "user",
        content,
      },
    ],
    instructions:
      "You are a product design reviewer. Evaluate UI/UX quality from screenshots. When a Figma reference is provided, compare every section of the preview against it and list concrete mismatches. Prefer specific, actionable feedback over generic praise.",
  })

  return {
    ...basePayload,
    comparedToFigmaReference: hasFigmaRef,
    comparedToUserImages: args.compare_to_user_images ? userReferenceImages.length : 0,
    review: response.output_text || "No review text returned.",
  }
}
