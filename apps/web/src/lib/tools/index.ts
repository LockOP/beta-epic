import type { Db } from "mongodb"
import {
  toolGetAllComponents,
  toolGetComponentsContext,
  toolGetAllIcons,
  toolGetIconContext,
  toolGetAllFns,
  toolGetFnContext,
  toolGetDefaultTokens,
} from "@beta-epic/ui"
import * as getWorkspaceFiles  from "./tool.get-workspace-files"
import * as getFileContent     from "./tool.get-file-content"
import * as getResolvedConfig  from "./tool.get-resolved-config"
import * as createFile         from "./tool.create-file"
import * as updateFile         from "./tool.update-file"
import * as validateConfig     from "./tool.validate-config"
import * as renameFile         from "./tool.rename-file"
import * as deleteFile         from "./tool.delete-file"
import * as capturePreviewSnapshot from "./tool.capture-preview-snapshot"
import * as getFigmaContext    from "./tool.get-figma-context"
import * as getFigmaScreenshot from "./tool.get-figma-screenshot"

export interface ToolInteraction {
  callId: string
  name: string
  arguments: Record<string, unknown>
  output: Record<string, unknown> | null // null while streaming (output pending)
}

export interface ToolContext {
  chatId: string
  db: Db
}

export const TOOL_DEFINITIONS = [
  // UI / component exploration tools (from @beta-epic/ui)
  toolGetAllComponents.definition,
  toolGetComponentsContext.definition,
  toolGetAllIcons.definition,
  toolGetIconContext.definition,
  toolGetAllFns.definition,
  toolGetFnContext.definition,
  toolGetDefaultTokens.definition,
  // Workspace file tools (local to studio app)
  getWorkspaceFiles.definition,
  getFileContent.definition,
  getResolvedConfig.definition,
  validateConfig.definition,
  capturePreviewSnapshot.definition,
  getFigmaContext.definition,
  getFigmaScreenshot.definition,
  createFile.definition,
  updateFile.definition,
  renameFile.definition,
  deleteFile.definition,
]

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext,
): Promise<Record<string, unknown>> {
  switch (name) {
    // UI exploration — sync, no context needed
    case "get_all_components":
      return toolGetAllComponents.execute()
    case "get_components_context":
      return toolGetComponentsContext.execute(args.names as string[])
    case "get_all_icons":
      return toolGetAllIcons.execute()
    case "get_icon_context":
      return toolGetIconContext.execute(args.name as string)
    case "get_all_fns":
      return toolGetAllFns.execute()
    case "get_fn_context":
      return toolGetFnContext.execute(args.name as string)
    case "get_default_tokens":
      return toolGetDefaultTokens.execute()

    // Workspace file tools — async, need context
    case "get_workspace_files":
      return getWorkspaceFiles.execute(context)
    case "get_file_content":
      return getFileContent.execute(context, args as { file_id: string })
    case "get_resolved_config":
      return getResolvedConfig.execute(context)
    case "validate_config":
      return validateConfig.execute(context, args as { content: string; file_type: import("./types").FileType })
    case "capture_preview_snapshot":
      return capturePreviewSnapshot.execute(context, args as {
        review?: boolean
        compare_to_user_images?: boolean
        focus?: string
      })
    case "get_figma_context":
      return getFigmaContext.execute(context, args as { url: string })
    case "get_figma_screenshot":
      return getFigmaScreenshot.execute(context, args as { url: string; scale?: number })
    case "create_file":
      return createFile.execute(context, args as { name: string; content?: string })
    case "update_file":
      return updateFile.execute(context, args as { file_id: string; content: string })
    case "rename_file":
      return renameFile.execute(context, args as { file_id: string; name: string })
    case "delete_file":
      return deleteFile.execute(context, args as { file_id: string })

    default:
      return { error: `Unknown tool: ${name}` }
  }
}
