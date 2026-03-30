import { IconComponentContext } from "../../components/icons/index.context"

export const definition = {
  type: "function" as const,
  name: "get_all_icons",
  description: "Get all registered icon keys from the icon context map only.",
  parameters: {
    type: "object",
    properties: {},
    required: [] as string[],
    additionalProperties: false,
  },
}

export function execute(): Record<string, unknown> {
  return {
    icons: Object.keys(IconComponentContext),
  }
}
