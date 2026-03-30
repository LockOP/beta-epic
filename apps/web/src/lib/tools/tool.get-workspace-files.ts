import type { Db } from "mongodb"

export const definition = {
  type: "function" as const,
  name: "get_workspace_files",
  description:
    "List all files in the current workspace — returns id, name, and type for each file. Does NOT return content. Use get_file_content to read a specific file's content.",
  parameters: {
    type: "object",
    properties: {},
    required: [] as string[],
    additionalProperties: false,
  },
}

export async function execute(
  context: { chatId: string; db: Db },
): Promise<Record<string, unknown>> {
  const files = await context.db
    .collection("workspace_files")
    .find({ chatId: context.chatId })
    .sort({ order: 1 })
    .toArray()

  return {
    files: files.map((f) => ({
      id: f._id.toString(),
      name: f.name,
      type: f.type,
    })),
  }
}
