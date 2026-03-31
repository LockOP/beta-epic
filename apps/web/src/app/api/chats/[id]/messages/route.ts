import { ObjectId } from "mongodb"
import OpenAI from "openai"
import type { ReasoningEffort } from "openai/resources/shared"
import { MASTER_PROMPT } from "@/lib/master-prompt"
import { TOOL_DEFINITIONS, executeTool, type ToolInteraction } from "@/lib/tools"
import clientPromise, { DB_NAME } from "@/lib/mongodb"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MAX_TOOL_ROUNDS = 16
type ChatImageAttachment = {
  id?: string
  name?: string
  mimeType?: string
  dataUrl: string
  width?: number
  height?: number
}

interface ModelCaps { reasoning: boolean }

const MODEL_CAPS: Record<string, ModelCaps> = {
  "gpt-5.4":      { reasoning: false },
  "gpt-5.2":      { reasoning: false },
  "gpt-5.1":      { reasoning: false },
  "gpt-5":        { reasoning: false },
  "gpt-5-mini":   { reasoning: false },
  "gpt-4.1":      { reasoning: false },
  "gpt-4.1-mini": { reasoning: false },
  "gpt-4o":       { reasoning: false },
  "gpt-4o-mini":  { reasoning: false },
  "o3":           { reasoning: true  },
  "o4-mini":      { reasoning: true  },
}

const DEFAULT_CAPS: ModelCaps = { reasoning: false }

function buildPreviewIssuesContext(
  issues: Array<{ path: string; message: string }>,
): string {
  return [
    "Workspace preview context:",
    "The current workspace preview has DSL issues. If you update config, fix these issues as part of your answer.",
    ...issues.map((issue) => `- ${issue.path}: ${issue.message}`),
  ].join("\n")
}

// NDJSON event types streamed to the client
type StreamEvent =
  | { type: "tool_call"; callId: string; name: string; arguments: Record<string, unknown> }
  | { type: "tool_output"; callId: string; output: Record<string, unknown> }
  | { type: "response"; id: string; content: string; toolInteractions: ToolInteraction[] }
  | { type: "error"; message: string }

function sanitizeAttachments(value: unknown): ChatImageAttachment[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((attachment) => {
    if (!attachment || typeof attachment !== "object") return []

    const candidate = attachment as Partial<ChatImageAttachment>
    if (typeof candidate.dataUrl !== "string" || !candidate.dataUrl.startsWith("data:image/")) {
      return []
    }

    return [{
      dataUrl: candidate.dataUrl,
      ...(typeof candidate.id === "string" ? { id: candidate.id } : {}),
      ...(typeof candidate.name === "string" ? { name: candidate.name } : {}),
      ...(typeof candidate.mimeType === "string" ? { mimeType: candidate.mimeType } : {}),
      ...(typeof candidate.width === "number" ? { width: candidate.width } : {}),
      ...(typeof candidate.height === "number" ? { height: candidate.height } : {}),
    }]
  })
}

function hasFigmaUrl(value: unknown): boolean {
  return typeof value === "string" && /https?:\/\/(?:www\.)?figma\.com\//i.test(value)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { content, model, reasoningEffort, previewIssues, attachments } = await req.json()
  const userAttachments = sanitizeAttachments(attachments)
  const previewIssueList = Array.isArray(previewIssues)
    ? previewIssues
        .filter(
          (issue): issue is { path: string; message: string } =>
            Boolean(issue) &&
            typeof issue === "object" &&
            typeof (issue as { path?: unknown }).path === "string" &&
            typeof (issue as { message?: unknown }).message === "string",
        )
    : []
  const previewSystemContent =
    previewIssueList.length > 0 ? buildPreviewIssuesContext(previewIssueList) : null
  const userProvidedFigmaUrl = hasFigmaUrl(content)

  const client = await clientPromise
  const db = client.db(DB_NAME)

  if (previewSystemContent) {
    await db.collection("messages").insertOne({
      chatId: id,
      role: "system",
      content: previewSystemContent,
      createdAt: new Date(),
    })
  }

  // Save user message
  await db.collection("messages").insertOne({
    chatId: id,
    role: "user",
    content,
    attachments: userAttachments,
    createdAt: new Date(),
  })

  // Fetch full conversation history
  const history = await db
    .collection("messages")
    .find({ chatId: id })
    .sort({ createdAt: 1 })
    .toArray()

  // Resolve model; auto-title on first user message
  let chatModel = model || "gpt-5.4"
  try {
    const chat = await db.collection("chats").findOne({ _id: new ObjectId(id) })
    if (chat) {
      chatModel = model || chat.model || "gpt-5.4"
      if (chat.title === "New chat") {
        const titleSource =
          typeof content === "string" && content.trim()
            ? content
            : (userAttachments[0]?.name ?? "Image chat")
        const title = titleSource.slice(0, 60) + (titleSource.length > 60 ? "…" : "")
        await db
          .collection("chats")
          .updateOne({ _id: new ObjectId(id) }, { $set: { title, updatedAt: new Date() } })
      }
    }
  } catch {
    // keep chatModel as resolved above
  }

  const instructions = [
    MASTER_PROMPT,
    "You are a helpful AI assistant. Be concise, accurate, and clear. " +
      "Format responses with markdown when it aids readability. " +
      "When writing code, always include the language identifier in fenced code blocks. " +
      "When you need to answer questions about the user's personal details — age, location, " +
      "date of birth, or luck — always call the appropriate tool rather than guessing.",
    userProvidedFigmaUrl
      ? "The user has provided a Figma URL. You MUST call get_figma_context then get_figma_screenshot (in that order) before writing any workspace files. The screenshot will be provided to you as a vision image — examine it carefully and generate DSL that is pixel-faithful to the design, not a generic interpretation. CRITICAL: if the screenshot shows a table (column headers + repeated rows), you MUST use the Table component family (TableHeader/TableBody/TableRow/TableHead/TableCell). NEVER simulate a table with div + grid-cols-*."
      : null,
  ]
    .filter(Boolean)
    .join("\n\n")

  const caps = MODEL_CAPS[chatModel] ?? DEFAULT_CAPS

  const baseParams: Omit<Parameters<typeof openai.responses.create>[0], "input"> = {
    model: chatModel,
    instructions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: TOOL_DEFINITIONS as any,
    store: false,
  }
  if (caps.reasoning) {
    baseParams.reasoning = { effort: (reasoningEffort ?? "medium") as ReasoningEffort }
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function emit(event: StreamEvent) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inputList: any[] = history.map((m) => {
          const messageAttachments = sanitizeAttachments(m.attachments)
          if (m.role !== "user") {
            return {
              role: m.role as "assistant" | "system",
              content: typeof m.content === "string" ? m.content : "",
            }
          }

          const blocks: Array<Record<string, unknown>> = []

          if (typeof m.content === "string" && m.content.trim()) {
            blocks.push({
              type: "input_text",
              text: m.content,
            })
          }

          messageAttachments.forEach((attachment) => {
            blocks.push({
              type: "input_image",
              image_url: attachment.dataUrl,
            })
          })

          return {
            role: "user" as const,
            content: blocks.length > 0 ? blocks : "",
          }
        })

        const toolInteractions: ToolInteraction[] = []
        let finalContent = ""
        // Track the last Figma screenshot so we can re-inject it each round as a reminder.
        // Without this, the image gets buried under dozens of tool output messages and the
        // model loses visual context by the time it generates the DSL.
        let figmaScreenshotDataUrl: string | null = null

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          // Re-inject the Figma screenshot as a compact visual reminder at the top of every
          // round after it was first fetched. This keeps the design reference fresh in context
          // regardless of how many component-context tool calls have stacked up since.
          if (figmaScreenshotDataUrl && round > 0) {
            inputList.push({
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: "[FIGMA REFERENCE — keep this in view] Your DSL must match this design. Check layout structure, column arrangement, spacing density, and component types before every write.",
                },
                {
                  type: "input_image",
                  image_url: figmaScreenshotDataUrl,
                },
              ],
            })
          }

          const response = await openai.responses.create({ ...baseParams, input: inputList })
          const responseData = response as Awaited<ReturnType<typeof openai.responses.create>> & {
            // Narrow away the streaming branch for this non-streaming call.
            output: Array<Record<string, unknown>>
            output_text: string
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolCalls = responseData.output.filter((item: any) => item.type === "function_call")

          if (toolCalls.length === 0) {
            finalContent = JSON.stringify({ message: responseData.output_text })
            break
          }

          // Append response output for next round
          inputList.push(...responseData.output)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const toolCall of toolCalls as any[]) {
            const args = JSON.parse(toolCall.arguments) as Record<string, unknown>

            // 1. Announce the tool call (output is pending)
            emit({ type: "tool_call", callId: toolCall.call_id, name: toolCall.name, arguments: args })

            // 2. Execute and emit the output
            const output = await executeTool(toolCall.name, args, { chatId: id, db })
            toolInteractions.push({ callId: toolCall.call_id, name: toolCall.name, arguments: args, output })
            emit({ type: "tool_output", callId: toolCall.call_id, output })

            // Strip dataUrl from the function_call_output to avoid huge token blobs —
            // the image is injected as a proper input_image block below instead.
            const outputForModel = toolCall.name === "get_figma_screenshot" && typeof output.dataUrl === "string"
              ? { ...output, dataUrl: "[image injected as input_image below]" }
              : output

            inputList.push({
              type: "function_call_output",
              call_id: toolCall.call_id,
              output: JSON.stringify(outputForModel),
            })

            // Inject Figma screenshot as a real vision input so the model can see the design.
            if (toolCall.name === "get_figma_screenshot" && typeof output.dataUrl === "string") {
              figmaScreenshotDataUrl = output.dataUrl
              inputList.push({
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text: "Figma design screenshot — use this image as the primary visual reference. Your DSL output must match this design as closely as possible: layout structure, spacing, typography hierarchy, component choice, and visual weight.",
                  },
                  {
                    type: "input_image",
                    image_url: output.dataUrl,
                  },
                ],
              })
            }
          }
        }

        if (!finalContent) {
          finalContent = JSON.stringify({ message: "Could not generate a final response." })
        }

        // Persist assistant message
        const { insertedId } = await db.collection("messages").insertOne({
          chatId: id,
          role: "assistant",
          content: finalContent,
          attachments: [],
          toolInteractions,
          createdAt: new Date(),
        })

        await db
          .collection("chats")
          .updateOne({ _id: new ObjectId(id) }, { $set: { updatedAt: new Date() } })
          .catch(() => {})

        emit({ type: "response", id: insertedId.toString(), content: finalContent, toolInteractions })
      } catch (err) {
        console.error("[messages] generation error:", err)
        emit({ type: "error", message: err instanceof Error ? err.message : "Generation failed" })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
