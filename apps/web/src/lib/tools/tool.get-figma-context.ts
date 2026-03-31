import type { Db } from "mongodb"
import { fetchFigmaNodeContext } from "@/lib/figma-rest"

export const definition = {
  type: "function" as const,
  name: "get_figma_context",
  description:
    "Inspect a Figma frame or layer URL and return read-only design context such as node structure, layout hints, fills, bounds, and text snippets.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "A Figma frame or layer URL that includes a node-id.",
      },
    },
    required: ["url"] as string[],
    additionalProperties: false,
  },
}

export async function execute(
  context: { chatId: string; db: Db },
  args: { url: string },
): Promise<Record<string, unknown>> {
  return fetchFigmaNodeContext(context.db, args.url)
}
