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
    "Get the latest captured workspace preview snapshots (including tall previews split into multiple images) and optionally run a UI/UX review against recent user-provided reference images.",
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
    return { error: "No preview snapshots are available yet. Open the preview and wait for it to render before reviewing it." }
  }

  const basePayload = {
    capturedAt: snapshotDoc?.updatedAt ?? null,
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

  const recentMessages = args.compare_to_user_images
    ? await context.db
        .collection("messages")
        .find({ chatId: context.chatId, role: "user", attachments: { $exists: true, $ne: [] } })
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray()
    : []

  const referenceImages = recentMessages
    .flatMap((message) =>
      Array.isArray(message.attachments)
        ? message.attachments.map(sanitizeImageAttachment).filter(isDefined)
        : [],
    )
    .slice(0, 6)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [
    {
      type: "input_text",
      text: [
        "Review this Studio workspace preview for UI/UX quality.",
        "The preview may be split into multiple captures from top to bottom to cover the full height.",
        args.focus ? `Focus on: ${args.focus}.` : "Focus on layout, spacing, visual hierarchy, alignment, responsiveness, and polish.",
        args.compare_to_user_images && referenceImages.length > 0
          ? "Compare the preview against the provided reference images and call out mismatches."
          : "Review the preview on its own merits.",
        "Respond concisely with strengths, issues, and concrete improvement directions.",
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

  if (args.compare_to_user_images && referenceImages.length > 0) {
    referenceImages.forEach((attachment, index) => {
      content.push({
        type: "input_text",
        text: `Reference image ${index + 1}${attachment.name ? `: ${attachment.name}` : ""}.`,
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
      "You are a product design reviewer. Evaluate UI/UX quality from screenshots. Prefer practical, implementation-oriented feedback. Be concise but specific.",
  })

  return {
    ...basePayload,
    comparedToUserImages: args.compare_to_user_images ? referenceImages.length : 0,
    review: response.output_text || "No review text returned.",
  }
}
