import { getDefaultThemeTokens } from "../../engine/defaults/theme-tokens"

export const definition = {
  type: "function" as const,
  name: "get_default_tokens",
  description:
    "Get the built-in default theme tokens for both light and dark modes used by GuiProvider.",
  parameters: {
    type: "object",
    properties: {},
    required: [] as string[],
    additionalProperties: false,
  },
}

export function execute(): Record<string, unknown> {
  return getDefaultThemeTokens()
}
