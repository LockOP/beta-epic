import { UIComponentContext } from "../../components/ui/index.context"

export const definition = {
  type: "function" as const,
  name: "get_component_context",
  description:
    "Get the context string for a specific component key from the combined UI component and icon context map.",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Exact component key, for example Button or ChevronDownIcon.",
      },
    },
    required: ["name"],
    additionalProperties: false,
  },
}

export function execute(name: string): Record<string, unknown> {
  const context = UIComponentContext[name as keyof typeof UIComponentContext]

  if (!context) {
    return {
      error: `Unknown component: ${name}`,
      availableComponents: Object.keys(UIComponentContext),
    }
  }

  return {
    name,
    context,
  }
}
