import { FnContext } from "../../engine/fns/index.context"

export const definition = {
  type: "function" as const,
  name: "get_fn_context",
  description:
    "Get the context string for a specific built-in function group key, including signature and DSL config examples.",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Exact fn group key, for example dateFns or formatFns.",
      },
    },
    required: ["name"],
    additionalProperties: false,
  },
}

export function execute(name: string): Record<string, unknown> {
  const context = FnContext[name as keyof typeof FnContext]

  if (!context) {
    return {
      error: `Unknown fn group: ${name}`,
      availableFns: Object.keys(FnContext),
    }
  }

  return {
    name,
    context,
  }
}
