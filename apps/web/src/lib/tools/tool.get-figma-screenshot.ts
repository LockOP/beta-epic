import type { Db } from "mongodb"
import { fetchFigmaScreenshot, parseFigmaUrl } from "@/lib/figma-rest"

export const definition = {
  type: "function" as const,
  name: "get_figma_screenshot",
  description:
    "Capture a screenshot of a Figma frame or layer URL and return it as an image that can be reviewed in the chat.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "A Figma frame or layer URL that includes a node-id.",
      },
      scale: {
        type: "number",
        description: "Optional image scale multiplier. Use 1-4. Defaults to 2.",
      },
    },
    required: ["url"] as string[],
    additionalProperties: false,
  },
}

export async function execute(
  context: { chatId: string; db: Db },
  args: { url: string; scale?: number },
): Promise<Record<string, unknown>> {
  const scale =
    typeof args.scale === "number" && Number.isFinite(args.scale) && args.scale >= 1 && args.scale <= 4
      ? args.scale
      : 2

  const cached = await context.db.collection("chat_figma_references").findOne({ chatId: context.chatId })
  if (
    cached &&
    typeof cached.dataUrl === "string" &&
    cached.dataUrl.startsWith("data:image/") &&
    typeof cached.url === "string" &&
    cached.url === args.url &&
    (typeof cached.scale !== "number" || cached.scale === scale)
  ) {
    const target = parseFigmaUrl(args.url)
    return {
      url: cached.url,
      ...(target ? { fileKey: target.fileKey, nodeId: target.nodeId } : {}),
      scale,
      ...(typeof cached.imageUrl === "string" ? { imageUrl: cached.imageUrl } : {}),
      dataUrl: cached.dataUrl,
      cached: true,
    }
  }

  const result = await fetchFigmaScreenshot(context.db, args.url, scale)

  // Persist the Figma reference image so capture_preview_snapshot can use it
  // for visual comparison even when no user attachment exists.
  if (typeof result.dataUrl === "string") {
    const now = new Date()
    await context.db.collection("chat_figma_references").updateOne(
      { chatId: context.chatId },
      {
        $set: {
          chatId: context.chatId,
          dataUrl: result.dataUrl,
          url: result.url ?? args.url,
          ...(typeof result.fileKey === "string" ? { fileKey: result.fileKey } : {}),
          ...(typeof result.nodeId === "string" ? { nodeId: result.nodeId } : {}),
          ...(typeof result.scale === "number" ? { scale: result.scale } : {}),
          ...(typeof result.imageUrl === "string" ? { imageUrl: result.imageUrl } : {}),
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    )
  }

  return result
}
