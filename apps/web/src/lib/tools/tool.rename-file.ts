import { ObjectId } from "mongodb"
import type { Db } from "mongodb"
import { PROTECTED_FILE_TYPES, type FileType } from "./types"

export const definition = {
  type: "function" as const,
  name: "rename_file",
  description:
    "Rename a workspace file. The three special files (Initial State, Theme Tokens, Root Config) cannot be renamed.",
  parameters: {
    type: "object",
    properties: {
      file_id: {
        type: "string",
        description: "The id of the file to rename.",
      },
      name: {
        type: "string",
        description: "The new display name for the file.",
      },
    },
    required: ["file_id", "name"] as string[],
    additionalProperties: false,
  },
}

export async function execute(
  context: { chatId: string; db: Db },
  args: { file_id: string; name: string },
): Promise<Record<string, unknown>> {
  const name = args.name?.trim()
  if (!name) return { error: "name is required" }

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
    return { error: `Cannot rename protected file of type "${file.type as string}"` }
  }

  await context.db.collection("workspace_files").updateOne(
    { _id: oid },
    { $set: { name, updatedAt: new Date() } },
  )

  return { ok: true, name }
}
