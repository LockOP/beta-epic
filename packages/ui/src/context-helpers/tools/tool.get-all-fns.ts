import { FnContext } from "../../engine/fns/index.context"

export const definition = {
  type: "function" as const,
  name: "get_all_fns",
  description:
    "Get all registered built-in function keys available via the { \"$fn\": \"name\" } DSL operator.",
  parameters: {
    type: "object",
    properties: {},
    required: [] as string[],
    additionalProperties: false,
  },
}

export function execute(): Record<string, unknown> {
  return {
    fns: Object.keys(FnContext),
  }
}
