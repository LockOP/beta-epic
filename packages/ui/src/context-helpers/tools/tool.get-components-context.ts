import { UIComponentContext } from "../../components/ui/index.context"

export const definition = {
  type: "function" as const,
  name: "get_components_context",
  description:
    "Get the context strings for multiple component keys from the combined UI component and icon context map (bulk lookup).",
  parameters: {
    type: "object",
    properties: {
      names: {
        type: "array",
        items: {
          type: "string",
        },
        description:
          "List of exact component keys, for example [\"Button\", \"Input\", \"ChevronDownIcon\"].",
      },
    },
    required: ["names"],
    additionalProperties: false,
  },
}

type ResultItem =
  | { name: string; context: string }
  | { name: string; error: string }

export function execute(names: string[]): Record<string, unknown> {
  const requested = Array.isArray(names) ? names : []
  const results: ResultItem[] = requested.map((name) => {
    const safeName = typeof name === "string" ? name : String(name)
    const context = UIComponentContext[safeName as keyof typeof UIComponentContext]

    if (!context) {
      return {
        name: safeName,
        error: `Unknown component: ${safeName}`,
      }
    }

    return { name: safeName, context }
  })

  const unknownComponents = results
    .filter((item): item is { name: string; error: string } => "error" in item)
    .map((item) => item.name)

  return {
    results,
    ...(unknownComponents.length > 0
      ? {
          unknownComponents,
          availableComponents: Object.keys(UIComponentContext),
        }
      : {}),
  }
}

