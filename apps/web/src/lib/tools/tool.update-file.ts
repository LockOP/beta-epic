import { ObjectId } from "mongodb"
import type { Db } from "mongodb"

export const definition = {
  type: "function" as const,
  name: "update_file",
  description: "Update the content of a workspace file by its id.",
  parameters: {
    type: "object",
    properties: {
      file_id: {
        type: "string",
        description: "The id of the file to update.",
      },
      content: {
        type: "string",
        description: "The new content for the file.",
      },
    },
    required: ["file_id", "content"] as string[],
    additionalProperties: false,
  },
}

export async function execute(
  context: { chatId: string; db: Db },
  args: { file_id: string; content: string },
): Promise<Record<string, unknown>> {
  let oid: ObjectId
  try {
    oid = new ObjectId(args.file_id)
  } catch {
    return { error: "Invalid file_id" }
  }

  const result = await context.db.collection("workspace_files").updateOne(
    { _id: oid, chatId: context.chatId },
    { $set: { content: args.content, updatedAt: new Date() } },
  )

  if (result.matchedCount === 0) return { error: "File not found" }
  return { ok: true }
}
