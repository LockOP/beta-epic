import { ObjectId } from "mongodb"
import type { Db } from "mongodb"
import { FILE_TYPES } from "./types"

export const definition = {
  type: "function" as const,
  name: "get_file_content",
  description: `Get the content of a specific workspace file by its id. The returned type field is one of: ${FILE_TYPES.join(", ")}.`,
  parameters: {
    type: "object",
    properties: {
      file_id: {
        type: "string",
        description: "The id of the file to fetch.",
      },
    },
    required: ["file_id"] as string[],
    additionalProperties: false,
  },
}

export async function execute(
  context: { chatId: string; db: Db },
  args: { file_id: string },
): Promise<Record<string, unknown>> {
  let oid: ObjectId
  try {
    oid = new ObjectId(args.file_id)
  } catch {
    return { error: "Invalid file_id" }
  }

  const file = await context.db
    .collection("workspace_files")
    .findOne({ _id: oid, chatId: context.chatId })

  if (!file) return { error: "File not found" }

  return {
    id: file._id.toString(),
    name: file.name,
    type: file.type,
    content: file.content,
  }
}
