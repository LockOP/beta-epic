/**
 * Aggregates all tool definitions into a single array injected into the
 * OpenAI Responses API `tools` parameter.
 *
 * To add a new tool: create its file, import the definition here, add to the array.
 */
import { definition as getUserInfo } from "./tool.get-user-info"
import { definition as getUserLocation } from "./tool.get-user-location"
import { definition as calculatePersonalLuck } from "./tool.calculate-personal-luck"

export const TOOL_DEFINITIONS = [getUserInfo, getUserLocation, calculatePersonalLuck]
