/**
 * Default hook registry — empty by design.
 *
 * Register React hooks via GuiProvider:
 *
 *   <GuiProvider
 *     hooks={{
 *       windowSize:  () => useWindowSize(),
 *       currentUser: () => useAuth().user,
 *     }}
 *   >
 *
 * Hook return values are then readable in DSL via { "$ref": "refs:hookName.field" }
 */
export const defaultHookRegistry: Record<string, () => unknown> = {};
