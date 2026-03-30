import { execute as executeGetAllComponents } from "./tool.get-all-components"
import { execute as executeGetComponentContext } from "./tool.get-component-context"
import { execute as executeGetAllIcons } from "./tool.get-all-icons"
import { execute as executeGetIconContext } from "./tool.get-icon-context"

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
    case "get_all_components":
      return executeGetAllComponents()
    case "get_component_context":
      return executeGetComponentContext(args.name as string)
    case "get_all_icons":
      return executeGetAllIcons()
    case "get_icon_context":
      return executeGetIconContext(args.name as string)
    default:
      return { error: `Unknown tool: ${name}` }
  }
}
