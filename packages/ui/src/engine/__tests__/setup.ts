import type { RuntimeContext, Registries } from '../types';

/** Minimal registries — override per test as needed. */
export const makeRegistries = (
  overrides: Partial<Registries> = {}
): Registries => ({
  components: {},
  functions: {},
  hooks: {},
  ...overrides,
});

/** Build a minimal RuntimeContext for unit tests. */
export const makeCtx = (
  overrides: Partial<RuntimeContext> & {
    pageState?: Record<string, unknown>;
    refs?: Record<string, unknown>;
  } = {}
): RuntimeContext => {
  const dispatched: Array<{ type: string; path?: string; payload?: unknown }> = [];

  return {
    registries: makeRegistries(),
    pageState: overrides.pageState ?? {},
    initialPageState: overrides.pageState ?? {},
    sliceName: 'test',
    dispatchPage: (action) => dispatched.push(action),
    refs: overrides.refs ?? {},
    ...overrides,
    // expose dispatched for assertions
    _dispatched: dispatched,
  } as RuntimeContext & { _dispatched: typeof dispatched };
};

/** Pull dispatched actions off a ctx created with makeCtx. */
export const getDispatched = (
  ctx: RuntimeContext
): Array<{ type: string; path?: string; payload?: unknown }> =>
  (ctx as RuntimeContext & { _dispatched: Array<{ type: string; path?: string; payload?: unknown }> })
    ._dispatched;
