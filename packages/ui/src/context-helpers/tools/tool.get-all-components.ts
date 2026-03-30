import { UIComponentContext } from "../../components/ui/index.context"

export const definition = {
  type: "function" as const,
  name: "get_all_components",
  description:
    "Get all registered component keys from the combined UI component and icon context map.",
  parameters: {
    type: "object",
    properties: {},
    required: [] as string[],
    additionalProperties: false,
  },
}

export function execute(): Record<string, unknown> {
  return {
    components: Object.keys(UIComponentContext),
  }
}
