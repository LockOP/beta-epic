const USER_CITY = "Chennai"
const USER_COUNTRY = "India"
const USER_TIMEZONE = "Asia/Kolkata"

export const definition = {
  type: "function" as const,
  name: "get_user_location",
  description: "Get the city and country where the user Arul currently lives.",
  parameters: {
    type: "object",
    properties: {},
    required: [] as string[],
    additionalProperties: false,
  },
}

export function execute(): Record<string, unknown> {
  return { city: USER_CITY, country: USER_COUNTRY, timezone: USER_TIMEZONE }
}
