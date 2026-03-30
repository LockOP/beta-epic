import type { Db } from "mongodb"

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export const definition = {
  type: "function" as const,
  name: "create_file",
  description:
    "Create a new subconfig file in the current workspace. Only subconfig files can be created — the three special files (Initial State, Theme Tokens, Root Config) already exist.",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Display name for the new subconfig file.",
      },
      content: {
        type: "string",
        description: "Initial content of the file. Defaults to empty string if omitted.",
      },
    },
    required: ["name"] as string[],
    additionalProperties: false,
  },
}

export async function execute(
  context: { chatId: string; db: Db },
  args: { name: string; content?: string },
): Promise<Record<string, unknown>> {
  const name = args.name?.trim()
  if (!name) return { error: "name is required" }

  const existingFile = await context.db.collection("workspace_files").findOne({
    chatId: context.chatId,
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  })
  if (existingFile) {
    return {
      error: `A workspace file named "${existingFile.name as string}" already exists. Reuse it instead of creating a duplicate.`,
      existing_file_id: existingFile._id.toString(),
      name: existingFile.name,
      type: existingFile.type,
    }
  }

  const existingCount = await context.db
    .collection("workspace_files")
    .countDocuments({ chatId: context.chatId })

  const now = new Date()
  const result = await context.db.collection("workspace_files").insertOne({
    chatId: context.chatId,
    name,
    type: "subconfig",
    content: args.content ?? "",
    order: existingCount,
    createdAt: now,
    updatedAt: now,
  })

  return { id: result.insertedId.toString(), name }
}
