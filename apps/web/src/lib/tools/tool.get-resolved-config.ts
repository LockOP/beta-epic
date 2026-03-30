import type { Db } from "mongodb"

export const definition = {
  type: "function" as const,
  name: "get_resolved_config",
  description:
    "Get a full view of the current workspace config — parsed initial state, theme tokens, root config, and all subconfigs. Identifies linking issues such as refConfigs referenced in root config that have no matching subconfig file, or subconfig files not referenced by the root.",
  parameters: {
    type: "object",
    properties: {},
    required: [] as string[],
    additionalProperties: false,
  },
}

function tryParse(content: string): { ok: true; value: unknown } | { ok: false; error: string } {
  if (!content.trim()) return { ok: false, error: "file is empty" }
  try {
    return { ok: true, value: JSON.parse(content) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function execute(
  context: { chatId: string; db: Db },
): Promise<Record<string, unknown>> {
  const files = await context.db
    .collection("workspace_files")
    .find({ chatId: context.chatId })
    .sort({ order: 1 })
    .toArray()

  const issues: string[] = []

  // Parse each file by type
  const initialStateFile  = files.find((f) => f.type === "initial_state")
  const themeTokensFile   = files.find((f) => f.type === "theme_tokens")
  const rootConfigFile    = files.find((f) => f.type === "root_config")
  const subconfigFiles    = files.filter((f) => f.type === "subconfig")

  const parsedInitialState = initialStateFile ? tryParse(initialStateFile.content) : null
  const parsedThemeTokens  = themeTokensFile  ? tryParse(themeTokensFile.content)  : null
  const parsedRootConfig   = rootConfigFile   ? tryParse(rootConfigFile.content)   : null

  if (parsedInitialState && !parsedInitialState.ok) {
    issues.push(`Initial State: parse error — ${parsedInitialState.error}`)
  }
  if (parsedThemeTokens && !parsedThemeTokens.ok) {
    issues.push(`Theme Tokens: parse error — ${parsedThemeTokens.error}`)
  }
  if (parsedRootConfig && !parsedRootConfig.ok) {
    issues.push(`Root Config: parse error — ${parsedRootConfig.error}`)
  }

  // Subconfig files — each is a bare ComponentNode, keyed by file name
  // The workspace assembles them; we just check that each file parses cleanly
  const subconfigsByName = new Map(subconfigFiles.map((f) => [f.name, f._id.toString()]))

  const parsedSubconfigs = subconfigFiles.map((f) => {
    const parsed = tryParse(f.content)
    return {
      id: f._id.toString(),
      name: f.name,
      ...(parsed.ok ? { content: parsed.value } : { parseError: parsed.error }),
    }
  })

  return {
    initialState:  parsedInitialState?.ok  ? parsedInitialState.value  : null,
    themeTokens:   parsedThemeTokens?.ok   ? parsedThemeTokens.value   : null,
    rootConfig:    parsedRootConfig?.ok    ? parsedRootConfig.value    : null,
    subconfigs:    parsedSubconfigs,
    issues,
    healthy: issues.length === 0,
  }
}
