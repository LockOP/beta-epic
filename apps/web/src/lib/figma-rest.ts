import type { Db } from "mongodb"
import { getUsableFigmaAccessToken } from "@/lib/figma-oauth"

export type FigmaUrlTarget = {
  fileKey: string
  nodeId: string
  originalUrl: string
}

type FigmaPaint = {
  type?: string
  visible?: boolean
  opacity?: number
  color?: { r?: number; g?: number; b?: number; a?: number }
}

type FigmaBoundingBox = {
  x?: number
  y?: number
  width?: number
  height?: number
}

type FigmaEffect = {
  type?: string
  visible?: boolean
  radius?: number
  spread?: number
  color?: { r?: number; g?: number; b?: number; a?: number }
  offset?: { x?: number; y?: number }
}

type FigmaTypeStyle = {
  fontFamily?: string
  fontWeight?: number
  fontSize?: number
  lineHeightPx?: number
  letterSpacing?: number
  textAlignHorizontal?: string
  textDecoration?: string
}

type FigmaNode = {
  id?: string
  name?: string
  type?: string
  visible?: boolean
  characters?: string
  children?: FigmaNode[]
  absoluteBoundingBox?: FigmaBoundingBox
  layoutMode?: string
  itemSpacing?: number
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  primaryAxisAlignItems?: string
  counterAxisAlignItems?: string
  counterAxisSizingMode?: string
  primaryAxisSizingMode?: string
  layoutSizingHorizontal?: string
  layoutSizingVertical?: string
  cornerRadius?: number
  fills?: FigmaPaint[]
  strokes?: FigmaPaint[]
  strokeWeight?: number
  strokeAlign?: string
  opacity?: number
  effects?: FigmaEffect[]
  style?: FigmaTypeStyle
  componentId?: string
  constraints?: { vertical?: string; horizontal?: string }
}

type FigmaNodeResponse = {
  name?: string
  nodes?: Record<string, { document?: FigmaNode }>
}

type FigmaImageResponse = {
  err?: string | null
  images?: Record<string, string>
}

function normalizeNodeId(raw: string | null): string | null {
  if (!raw) return null
  return raw.replace(/-/g, ":")
}

export function parseFigmaUrl(url: string): FigmaUrlTarget | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (!/(\.|^)figma\.com$/i.test(parsed.hostname)) {
    return null
  }

  const segments = parsed.pathname.split("/").filter(Boolean)
  if (segments.length < 2) {
    return null
  }

  let fileKey: string | null = null
  if (segments[0] === "design" && segments[2] === "branch") {
    fileKey = segments[3] || null
  } else if (segments[0] === "design" || segments[0] === "file" || segments[0] === "board" || segments[0] === "proto") {
    fileKey = segments[1] || null
  } else {
    fileKey = segments[1] || null
  }

  const nodeId =
    normalizeNodeId(parsed.searchParams.get("node-id")) ||
    normalizeNodeId(parsed.searchParams.get("node_id"))

  if (!fileKey || !nodeId) {
    return null
  }

  return {
    fileKey,
    nodeId,
    originalUrl: url,
  }
}

async function getFigmaAccessTokenOrThrow(db: Db): Promise<string> {
  const token = await getUsableFigmaAccessToken(db)
  if (!token) {
    throw new Error("Figma is not connected. Connect Figma in the chat header before using Figma URL tools.")
  }
  return token
}

async function figmaRequestJson<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`https://api.figma.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`Figma API request failed (${response.status}): ${errorText || "Unknown error"}`)
  }

  return response.json() as Promise<T>
}

function rgbaToHex(color?: { r?: number; g?: number; b?: number; a?: number }): string | null {
  if (!color) return null
  const r = Math.round((color.r ?? 0) * 255)
  const g = Math.round((color.g ?? 0) * 255)
  const b = Math.round((color.b ?? 0) * 255)
  const a = color.a
  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`
  if (typeof a === "number" && a < 1) {
    return `${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}`
  }
  return hex
}

function summarizePaints(paints: FigmaPaint[] | undefined): Array<Record<string, unknown>> {
  return (paints ?? [])
    .filter((paint) => paint && paint.visible !== false)
    .slice(0, 4)
    .map((paint) => ({
      type: paint.type ?? "UNKNOWN",
      ...(typeof paint.opacity === "number" ? { opacity: paint.opacity } : {}),
      ...(rgbaToHex(paint.color) ? { color: rgbaToHex(paint.color) } : {}),
    }))
}

function summarizeBounds(bounds?: FigmaBoundingBox): Record<string, number> | null {
  if (!bounds) return null

  const entries = Object.entries(bounds).filter(([, value]) => typeof value === "number")
  return entries.length > 0 ? Object.fromEntries(entries) as Record<string, number> : null
}

function collectTextSnippets(node: FigmaNode | undefined, limit = 20, bucket: string[] = []): string[] {
  if (!node || bucket.length >= limit) return bucket

  if (typeof node.characters === "string") {
    const text = node.characters.trim()
    if (text) {
      bucket.push(text.length > 180 ? `${text.slice(0, 177)}...` : text)
    }
  }

  for (const child of node.children ?? []) {
    if (bucket.length >= limit) break
    collectTextSnippets(child, limit, bucket)
  }

  return bucket
}

function summarizeEffects(effects: FigmaEffect[] | undefined): Array<Record<string, unknown>> {
  return (effects ?? [])
    .filter((e) => e && e.visible !== false)
    .slice(0, 3)
    .map((e) => ({
      type: e.type ?? "UNKNOWN",
      ...(typeof e.radius === "number" ? { radius: e.radius } : {}),
      ...(typeof e.spread === "number" ? { spread: e.spread } : {}),
      ...(e.offset ? { offset: e.offset } : {}),
      ...(rgbaToHex(e.color) ? { color: rgbaToHex(e.color) } : {}),
    }))
}

function summarizeNode(node: FigmaNode | undefined, depth = 0): Record<string, unknown> | null {
  if (!node) return null

  const summary: Record<string, unknown> = {
    name: node.name ?? "Untitled",
    type: node.type ?? "UNKNOWN",
  }

  if (node.componentId) summary.componentId = node.componentId

  const bounds = summarizeBounds(node.absoluteBoundingBox)
  if (bounds) summary.bounds = bounds

  if (typeof node.opacity === "number" && node.opacity < 1) {
    summary.opacity = node.opacity
  }

  if (typeof node.layoutMode === "string" && node.layoutMode !== "NONE") {
    summary.layout = {
      mode: node.layoutMode,
      ...(typeof node.itemSpacing === "number" ? { itemSpacing: node.itemSpacing } : {}),
      ...(typeof node.primaryAxisSizingMode === "string" ? { primaryAxisSizing: node.primaryAxisSizingMode } : {}),
      ...(typeof node.counterAxisSizingMode === "string" ? { counterAxisSizing: node.counterAxisSizingMode } : {}),
      ...(typeof node.layoutSizingHorizontal === "string" ? { sizingH: node.layoutSizingHorizontal } : {}),
      ...(typeof node.layoutSizingVertical === "string" ? { sizingV: node.layoutSizingVertical } : {}),
      ...(typeof node.paddingTop === "number" ||
      typeof node.paddingRight === "number" ||
      typeof node.paddingBottom === "number" ||
      typeof node.paddingLeft === "number"
        ? {
            padding: {
              ...(typeof node.paddingTop === "number" ? { top: node.paddingTop } : {}),
              ...(typeof node.paddingRight === "number" ? { right: node.paddingRight } : {}),
              ...(typeof node.paddingBottom === "number" ? { bottom: node.paddingBottom } : {}),
              ...(typeof node.paddingLeft === "number" ? { left: node.paddingLeft } : {}),
            },
          }
        : {}),
      ...(typeof node.primaryAxisAlignItems === "string" ? { primaryAxisAlign: node.primaryAxisAlignItems } : {}),
      ...(typeof node.counterAxisAlignItems === "string" ? { counterAxisAlign: node.counterAxisAlignItems } : {}),
    }
  }

  if (typeof node.cornerRadius === "number") {
    summary.cornerRadius = node.cornerRadius
  }

  const fills = summarizePaints(node.fills)
  if (fills.length > 0) summary.fills = fills

  const strokes = summarizePaints(node.strokes)
  if (strokes.length > 0) {
    summary.strokes = strokes
    if (typeof node.strokeWeight === "number") summary.strokeWeight = node.strokeWeight
    if (typeof node.strokeAlign === "string") summary.strokeAlign = node.strokeAlign
  }

  const effects = summarizeEffects(node.effects)
  if (effects.length > 0) summary.effects = effects

  if (typeof node.characters === "string" && node.characters.trim()) {
    summary.text = node.characters.trim()
    if (node.style) {
      const s = node.style
      summary.textStyle = {
        ...(s.fontFamily ? { fontFamily: s.fontFamily } : {}),
        ...(typeof s.fontWeight === "number" ? { fontWeight: s.fontWeight } : {}),
        ...(typeof s.fontSize === "number" ? { fontSize: s.fontSize } : {}),
        ...(typeof s.lineHeightPx === "number" ? { lineHeightPx: s.lineHeightPx } : {}),
        ...(typeof s.letterSpacing === "number" && s.letterSpacing !== 0 ? { letterSpacing: s.letterSpacing } : {}),
        ...(s.textAlignHorizontal ? { textAlign: s.textAlignHorizontal } : {}),
        ...(s.textDecoration && s.textDecoration !== "NONE" ? { textDecoration: s.textDecoration } : {}),
      }
    }
  }

  if (node.constraints) {
    summary.constraints = node.constraints
  }

  if (depth < 4 && Array.isArray(node.children) && node.children.length > 0) {
    summary.children = node.children
      .slice(0, 20)
      .map((child) => summarizeNode(child, depth + 1))
      .filter(Boolean)
    if (node.children.length > 20) {
      summary.childrenTruncated = `${node.children.length - 20} more children not shown`
    }
  }

  return summary
}

export async function fetchFigmaNodeContext(
  db: Db,
  url: string,
): Promise<Record<string, unknown>> {
  const target = parseFigmaUrl(url)
  if (!target) {
    return { error: "Invalid Figma URL. Provide a frame or layer URL that includes a node-id." }
  }

  const token = await getFigmaAccessTokenOrThrow(db)
  const data = await figmaRequestJson<FigmaNodeResponse>(
    token,
    `/files/${encodeURIComponent(target.fileKey)}/nodes?ids=${encodeURIComponent(target.nodeId)}&depth=4`,
  )

  const node = data.nodes?.[target.nodeId]?.document
  if (!node) {
    return { error: "Could not find that Figma node in the file." }
  }

  return {
    url: target.originalUrl,
    fileKey: target.fileKey,
    nodeId: target.nodeId,
    fileName: data.name ?? null,
    node: summarizeNode(node),
    textSnippets: collectTextSnippets(node),
  }
}

async function imageUrlToDataUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Could not download Figma image (${response.status}).`)
  }

  const contentType = response.headers.get("content-type") || "image/png"
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  return `data:${contentType};base64,${base64}`
}

export async function fetchFigmaScreenshot(
  db: Db,
  url: string,
  scale = 2,
): Promise<Record<string, unknown>> {
  const target = parseFigmaUrl(url)
  if (!target) {
    return { error: "Invalid Figma URL. Provide a frame or layer URL that includes a node-id." }
  }

  const token = await getFigmaAccessTokenOrThrow(db)
  const images = await figmaRequestJson<FigmaImageResponse>(
    token,
    `/images/${encodeURIComponent(target.fileKey)}?ids=${encodeURIComponent(target.nodeId)}&format=png&scale=${encodeURIComponent(String(scale))}`,
  )

  const imageUrl = images.images?.[target.nodeId]
  if (!imageUrl) {
    return { error: images.err || "Figma did not return an image for that node." }
  }

  const dataUrl = await imageUrlToDataUrl(imageUrl)

  return {
    url: target.originalUrl,
    fileKey: target.fileKey,
    nodeId: target.nodeId,
    scale,
    imageUrl,
    dataUrl,
  }
}
