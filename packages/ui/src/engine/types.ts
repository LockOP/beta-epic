// ─────────────────────────────────────────────────────────────────────────────
// Core DSL types for the Epic Engine
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Expressions — evaluated synchronously, read-only
// ---------------------------------------------------------------------------

export type Expression =
  | null
  | boolean
  | number
  | string
  | Expression[]
  | { [key: string]: Expression | undefined };

// Narrow helpers (used at runtime)
export const isExpression = (v: unknown): v is Expression =>
  v === null ||
  typeof v === 'boolean' ||
  typeof v === 'number' ||
  typeof v === 'string' ||
  Array.isArray(v) ||
  (typeof v === 'object' && v !== null);

// ---------------------------------------------------------------------------
// ComponentNode — the DSL's renderable unit
// ---------------------------------------------------------------------------

export interface ComponentNode {
  component: string;
  props?: Record<string, Expression | ActionExpression>;
  children?: ChildNode[];
  /** Local scope variables, available as env:name to this node and descendants */
  env?: Record<string, Expression>;
  /** Node-scoped derived state. Computed once per render, visible downward only. */
  selectors?: Record<string, Expression>;
  /** useEffect equivalents — run side-effects tied to deps */
  effects?: EffectConfig[];
}

export const isComponentNode = (v: unknown): v is ComponentNode =>
  v !== null &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  'component' in (v as object) &&
  typeof (v as ComponentNode).component === 'string';

// ---------------------------------------------------------------------------
// $subConfig — pre-compilation fragment substitution
// ---------------------------------------------------------------------------

export interface SubConfigRef {
  $subConfig: string;
  subConfigProps?: Record<string, Expression>;
}

export const isSubConfigRef = (v: unknown): v is SubConfigRef =>
  v !== null &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  '$subConfig' in (v as object) &&
  typeof (v as SubConfigRef).$subConfig === 'string';

export type RefConfigs = Record<string, ComponentNode | Expression>;

// ---------------------------------------------------------------------------
// Children
// ---------------------------------------------------------------------------

export type ChildNode = ComponentNode | SubConfigRef | Expression | string | null | undefined;

// ---------------------------------------------------------------------------
// Actions — imperative sequences triggered by events
// ---------------------------------------------------------------------------

export type ActionExpression = { $action: ActionSpec | ActionSpec[] };

export const isActionExpression = (v: unknown): v is ActionExpression =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && '$action' in (v as object);

export type ActionSpec =
  | PageStoreUpdateAction
  | PageStoreResetAction
  | AsyncCallAction
  | TryAction
  | ActionsGroupAction
  | ReduxDispatchAction
  | NavigateAction
  | SnackbarAction
  | ConsoleLogAction
  | WindowOpenAction
  | LocalSetAction
  | LocalRemoveAction
  | LocalClearAction
  | SessionSetAction
  | SessionRemoveAction
  | SessionClearAction
  | ConditionalActionExpr;

// page.store.update
export interface PageStoreUpdateAction {
  type: 'page.store.update';
  path?: string;
  payload: Expression;
}

// page.store.reset
export interface PageStoreResetAction {
  type: 'page.store.reset';
  path?: string;
}

// async.call
export interface AsyncCallAction {
  type: 'async.call';
  /** $fn call or $http call */
  call: FnCallExpr | HttpCallExpr;
  onSuccess?: ActionSpec[];
  onError?: ActionSpec[];
  /** Shorthand: sets this store path to true before, false after */
  loading?: string;
}

export interface FnCallExpr {
  $fn: string;
  args?: Expression[];
  path?: string;
}

export interface HttpCallExpr {
  $http: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string | Expression;
    params?: Record<string, Expression>;
    data?: Expression;
    headers?: Record<string, Expression>;
  };
}

export const isFnCallExpr = (v: unknown): v is FnCallExpr =>
  v !== null && typeof v === 'object' && '$fn' in (v as object);

export const isHttpCallExpr = (v: unknown): v is HttpCallExpr =>
  v !== null && typeof v === 'object' && '$http' in (v as object);

// try / catch / finally
export interface TryAction {
  type: 'try';
  try: ActionSpec[];
  catch?: ActionSpec[];
  finally?: ActionSpec[];
}

// actions.group
export interface ActionsGroupAction {
  type: 'actions.group';
  mode?: 'serial' | 'parallel';
  actions: ActionSpec[];
}

// redux.dispatch
export interface ReduxDispatchAction {
  type: 'redux.dispatch';
  action: string | { type: string; payload?: Expression };
  payload?: Expression;
}

// navigate
export interface NavigateAction {
  type: 'navigate';
  to: Expression;
}

// snackbar
export interface SnackbarAction {
  type: 'snackbar';
  message: Expression;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

// console.log
export interface ConsoleLogAction {
  type: 'console.log';
  payload?: Expression;
}

// window.open
export interface WindowOpenAction {
  type: 'window.open';
  url: Expression;
  target?: Expression;
}

// local storage
export interface LocalSetAction    { type: 'local.set';    key: string; payload: Expression; }
export interface LocalRemoveAction { type: 'local.remove'; key: string; }
export interface LocalClearAction  { type: 'local.clear'; }

// session storage
export interface SessionSetAction    { type: 'session.set';    key: string; payload: Expression; }
export interface SessionRemoveAction { type: 'session.remove'; key: string; }
export interface SessionClearAction  { type: 'session.clear'; }

// Conditional action ($if inside action array)
export interface ConditionalActionExpr {
  $if: {
    cond: Expression;
    then?: ActionSpec[];
    else?: ActionSpec[];
  };
}

export const isConditionalActionExpr = (v: unknown): v is ConditionalActionExpr =>
  v !== null && typeof v === 'object' && '$if' in (v as object);

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

export interface EffectConfig {
  /** Watch expressions. Empty array = run once on mount. */
  deps: Expression[];
  /** Debounce ms for re-runs (initial mount always fires immediately). */
  debounce?: number;
  /** Actions to run when deps change. */
  run: ActionSpec[];
  /** Actions to run on cleanup (unmount or before next re-run). */
  cleanup?: ActionSpec[];
}

// ---------------------------------------------------------------------------
// Registries
// ---------------------------------------------------------------------------

export type ComponentType = React.ElementType;

export interface Registries {
  components: Record<string, ComponentType>;
  functions: Record<string, (...args: unknown[]) => unknown>;
  hooks: Record<string, () => unknown>;
}

// ---------------------------------------------------------------------------
// RuntimeContext — threaded through compile + eval + actions
// ---------------------------------------------------------------------------

export interface UrlInfo {
  params: Record<string, string>;
  query: Record<string, string>;
  pathname: string;
  search: string;
  hash: string;
  fragment: string;
  origin: string;
  fullPath: string;
  href: string;
}

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface RuntimeContext {
  registries: Registries;

  // Page-local store
  pageState: Record<string, unknown>;
  dispatchPage: (action: { type: string; path?: string; payload?: unknown }) => void;
  sliceName: string;
  initialPageState: Record<string, unknown>;

  // Global store (optional — e.g. Redux, Zustand)
  globalStore?: { getState: () => Record<string, unknown> };

  // Local refs: env vars, hook values, iteration vars, selectors
  // Selectors stored under refs.__selectors = { name: value }
  refs: Record<string, unknown>;

  // Raw handler arguments — populated when an $action fires.
  // Access via { "$arg": 0 } (first arg), { "$arg": 1 } (second), etc.
  // Optional dot-path: { "$arg": 0, "path": "currentTarget.value" }
  args?: unknown[];

  // URL info
  url?: UrlInfo;

  // Navigation
  navigate?: (to: string) => void;

  // Toast
  showToast?: (message: string, variant?: ToastVariant) => void;

  // HTTP
  baseUrl?: string;
  getToken?: () => Promise<string | null>;
}

// ---------------------------------------------------------------------------
// NormalizedError
// ---------------------------------------------------------------------------

export interface NormalizedError {
  message: string;
  status?: number;
}

// ---------------------------------------------------------------------------
// Page store action types
// ---------------------------------------------------------------------------

export interface PageUpdatePayload { path?: string; payload: unknown; }
export interface PageResetPayload  { path?: string; }

// Import React for ComponentType
import type React from 'react';
