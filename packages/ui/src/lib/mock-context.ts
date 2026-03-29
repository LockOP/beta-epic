export type GenXuiContextType = {
  sessionId: string
  projectId: string | null
  variables: Record<string, unknown>
  theme: "light" | "dark"
}

export const mockGenXuiContext: GenXuiContextType = {
  sessionId: "mock-session-001",
  projectId: null,
  variables: {},
  theme: "light",
}
