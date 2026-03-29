// ─────────────────────────────────────────────────────────────────────────────
// Epic Engine — public API
// ─────────────────────────────────────────────────────────────────────────────

// ── Main entry points ────────────────────────────────────────────────────────
export { GuiProvider }    from './provider/GuiProvider';
export { GuiComponent }   from './provider/GuiComponent';
export { useGuiContext }   from './provider/context';

export type { GuiProviderProps }  from './provider/GuiProvider';
export type { GuiComponentProps } from './provider/GuiComponent';
export type { GuiContextValue }   from './provider/context';

// ── DSL types ────────────────────────────────────────────────────────────────
export type {
  ComponentNode,
  Expression,
  ActionSpec,
  ActionExpression,
  EffectConfig,
  SubConfigRef,
  RefConfigs,
  ChildNode,
  RuntimeContext,
  Registries,
  UrlInfo,
  ToastVariant,
  NormalizedError,

  // Action spec subtypes
  PageStoreUpdateAction,
  PageStoreResetAction,
  AsyncCallAction,
  TryAction,
  ActionsGroupAction,
  ReduxDispatchAction,
  NavigateAction,
  SnackbarAction,
  ConsoleLogAction,
  WindowOpenAction,
  LocalSetAction,
  LocalRemoveAction,
  LocalClearAction,
  SessionSetAction,
  SessionRemoveAction,
  SessionClearAction,
  FnCallExpr,
  HttpCallExpr,
} from './types';

// ── Type guards ───────────────────────────────────────────────────────────────
export { isComponentNode, isSubConfigRef, isActionExpression } from './types';

// ── Engine internals (advanced use) ──────────────────────────────────────────
export { evaluateExpression } from './compiler/expr';
export { runActions }         from './compiler/actions';
export { substituteSubConfigs } from './compiler/substitute';
export { DslNode }            from './runtime/render';

// ── Default registries ────────────────────────────────────────────────────────
export { defaultComponentRegistry } from './defaults/component-registry';
export { defaultFnRegistry }        from './defaults/fn-registry';
export { defaultHookRegistry }      from './defaults/hook-registry';

// ── Utilities ─────────────────────────────────────────────────────────────────
export { getByPath, setByPath, getLocalStorage, getSessionStorage } from './utils/dot-path';
export { normalizeError } from './utils/normalize-error';
