/**
 * Structured output schema for every AI chat response.
 *
 * Shape matches OpenAI Responses API `ResponseFormatTextJSONSchemaConfig`:
 *   { type, name, strict, schema }
 *
 * All properties must be required and additionalProperties must be false
 * per the Structured Outputs spec.
 *
 * Add fields here as the schema evolves — keep this the single source
 * of truth for both the API route and any UI consumers.
 */

/** TypeScript type mirroring the JSON schema below. */
export interface ChatOutput {
  message: string
}

/**
 * Passed to the Responses API as:
 *   `text: { format: OUTPUT_SCHEMA }`
 */
export const OUTPUT_SCHEMA = {
  type: "json_schema" as const,
  name: "chat_response",
  strict: true,
  schema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "The assistant's response to the user.",
      },
    },
    required: ["message"],
    additionalProperties: false,
  },
} as const
