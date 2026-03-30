import { IconComponentContext } from "../../components/icons/index.context"

export const definition = {
  type: "function" as const,
  name: "get_icon_context",
  description: "Get the context string for a specific icon key from the icon context map only.",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Exact icon key, for example Plus or ChevronDownIcon.",
      },
    },
    required: ["name"],
    additionalProperties: false,
  },
}

export function execute(name: string): Record<string, unknown> {
  const context = IconComponentContext[name as keyof typeof IconComponentContext]

  if (!context) {
    return {
      error: `Unknown icon: ${name}`,
      availableIcons: Object.keys(IconComponentContext),
    }
  }

  return {
    name,
    context,
  }
}
