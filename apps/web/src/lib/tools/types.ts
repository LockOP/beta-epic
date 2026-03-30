export const FILE_TYPES = ["initial_state", "theme_tokens", "root_config", "subconfig"] as const
export type FileType = (typeof FILE_TYPES)[number]

export const PROTECTED_FILE_TYPES: ReadonlySet<FileType> = new Set([
  "initial_state",
  "theme_tokens",
  "root_config",
])
