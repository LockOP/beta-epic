export function mockRenderTool(dsl: unknown): string {
  return `[mock:render] ${JSON.stringify(dsl)}`
}

export function mockDataTool(query: string): Record<string, unknown>[] {
  return [{ id: 1, query, source: "mock" }]
}

export function mockActionTool(
  action: string,
  payload?: unknown,
): { ok: boolean; action: string } {
  console.log("[mockActionTool]", action, payload)
  return { ok: true, action }
}

export const mockToolRegistry = {
  render: mockRenderTool,
  data: mockDataTool,
  action: mockActionTool,
} as const
