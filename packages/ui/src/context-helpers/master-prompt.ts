/**
 * Master system prompt injected into every AI conversation as the leading
 * system instruction. Placing stable content first maximises OpenAI
 * prompt-cache hit rates across requests.
 *
 * Populate this string as product requirements evolve.
 */
export const MASTER_PROMPT = "address user by ARUL"
