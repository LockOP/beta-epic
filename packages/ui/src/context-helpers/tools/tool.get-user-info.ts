const USER_NAME = "Arul"
const USER_DOB = "1991-07-15" // YYYY-MM-DD

export const definition = {
  type: "function" as const,
  name: "get_user_info",
  description:
    "Get personal information about the user Arul: their name, age, and date of birth.",
  parameters: {
    type: "object",
    properties: {},
    required: [] as string[],
    additionalProperties: false,
  },
}

export function execute(): Record<string, unknown> {
  const dob = new Date(USER_DOB)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const hasBirthdayPassed =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
  if (!hasBirthdayPassed) age--
  return { name: USER_NAME, age, dateOfBirth: USER_DOB }
}
