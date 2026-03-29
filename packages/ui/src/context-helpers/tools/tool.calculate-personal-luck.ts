export const definition = {
  type: "function" as const,
  name: "calculate_personal_luck",
  description:
    "Calculate Arul's personal luck score for today (1–10) based on their age and the current calendar day. Higher is luckier.",
  parameters: {
    type: "object",
    properties: {
      age: {
        type: "number",
        description: "The user's current age in years.",
      },
    },
    required: ["age"],
    additionalProperties: false,
  },
}

export function execute(age: number): Record<string, unknown> {
  const today = new Date()
  const startOfYear = new Date(today.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / 86_400_000)
  // Deterministic per (age, day) — always 1–10, changes daily
  const score = (Math.abs(age * 31 + dayOfYear * 7 + 13) % 10) + 1
  const description =
    score >= 9
      ? "Exceptional — everything aligns today"
      : score >= 7
        ? "Strong — trust your instincts"
        : score >= 5
          ? "Balanced — steady progress ahead"
          : score >= 3
            ? "Moderate — patience will pay off"
            : "Challenging — a good day for reflection"
  return { score, description }
}
