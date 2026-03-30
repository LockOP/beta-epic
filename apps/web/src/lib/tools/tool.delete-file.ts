import { ObjectId } from "mongodb"
import type { Db } from "mongodb"
import { PROTECTED_FILE_TYPES, type FileType } from "./types"

export const definition = {
  type: "function" as const,
  name: "delete_file",
  description:
    "Delete a subconfig file from the workspace by its id. The three special files (Initial State, Theme Tokens, Root Config) cannot be deleted.",
  parameters: {
    type: "object",
    properties: {
      file_id: {
        type: "string",
        description: "The id of the file to delete.",
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
  if (PROTECTED_FILE_TYPES.has(file.type as FileType)) {
    return { error: `Cannot delete protected file of type "${file.type as string}"` }
  }

  await context.db.collection("workspace_files").deleteOne({ _id: oid })
  return { ok: true }
}
