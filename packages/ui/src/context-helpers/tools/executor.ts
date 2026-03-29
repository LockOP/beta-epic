/**
 * Aggregates all tool executors into a single dispatcher.
 *
 * To add a new tool: create its file, import execute here, add a case to executeTool.
 */
import { execute as executeGetUserInfo } from "./tool.get-user-info"
import { execute as executeGetUserLocation } from "./tool.get-user-location"
import { execute as executeCalculatePersonalLuck } from "./tool.calculate-personal-luck"

export interface ToolInteraction {
  callId: string
  name: string
  arguments: Record<string, unknown>
  output: Record<string, unknown> | null // null while streaming (output pending)
}

export function executeTool(
  name: string,
  args: Record<string, unknown>,
): Record<string, unknown> {
  switch (name) {
    case "get_user_info":
      return executeGetUserInfo()
    case "get_user_location":
      return executeGetUserLocation()
    case "calculate_personal_luck":
      return executeCalculatePersonalLuck(args.age as number)
    default:
      return { error: `Unknown tool: ${name}` }
  }
}
