import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runActions } from '../compiler/actions';
import { makeCtx, getDispatched } from './setup';
import type { RuntimeContext } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const run = (
  actions: Parameters<typeof runActions>[0],
  ctxOverrides: Partial<RuntimeContext> & { pageState?: Record<string, unknown>; refs?: Record<string, unknown> } = {},
  handlerArgs: unknown[] = []
) => {
  const ctx = makeCtx(ctxOverrides);
  return runActions(actions, ctx, handlerArgs).then(() => ctx);
};

// ─────────────────────────────────────────────────────────────────────────────
// page.store.update
// ─────────────────────────────────────────────────────────────────────────────

describe('page.store.update', () => {
  it('dispatches UPDATE with evaluated payload', async () => {
    const ctx = await run([{ type: 'page.store.update', path: 'count', payload: { $add: [1, 2] } }]);
    expect(getDispatched(ctx)).toEqual([{ type: 'UPDATE', path: 'count', payload: 3 }]);
  });

  it('dispatches UPDATE with literal payload', async () => {
    const ctx = await run([{ type: 'page.store.update', path: 'flag', payload: true }]);
    expect(getDispatched(ctx)).toEqual([{ type: 'UPDATE', path: 'flag', payload: true }]);
  });

  it('evaluates undefined payload to null', async () => {
    const ctx = await run([{ type: 'page.store.update', path: 'x', payload: undefined as unknown as null }]);
    const dispatched = getDispatched(ctx);
    expect(dispatched[0].payload).toBe(null);
  });

  it('dispatches UPDATE with path from page.store ref', async () => {
    const ctx = await run(
      [{ type: 'page.store.update', path: 'name', payload: { $ref: 'page.store:draft' } }],
      { pageState: { draft: 'Alice' } }
    );
    expect(getDispatched(ctx)).toEqual([{ type: 'UPDATE', path: 'name', payload: 'Alice' }]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// page.store.reset
// ─────────────────────────────────────────────────────────────────────────────

describe('page.store.reset', () => {
  it('dispatches RESET when no path given', async () => {
    const ctx = await run([{ type: 'page.store.reset' }]);
    expect(getDispatched(ctx)).toEqual([{ type: 'RESET' }]);
  });

  it('dispatches UPDATE to initial value for specific path', async () => {
    const ctx = makeCtx({ pageState: { count: 99 } });
    // Mutate pageState as if count was updated but initialPageState stays 0
    (ctx as RuntimeContext & { initialPageState: Record<string, unknown> }).initialPageState = { count: 0 };
    await runActions([{ type: 'page.store.reset', path: 'count' }], ctx);
    expect(getDispatched(ctx)).toEqual([{ type: 'UPDATE', path: 'count', payload: 0 }]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// navigate
// ─────────────────────────────────────────────────────────────────────────────

describe('navigate', () => {
  it('calls ctx.navigate with evaluated path', async () => {
    const navigate = vi.fn();
    await run([{ type: 'navigate', to: '/dashboard' }], { navigate });
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('evaluates expression in to field', async () => {
    const navigate = vi.fn();
    await run(
      [{ type: 'navigate', to: { $concat: ['/users/', { $ref: 'page.store:id' }] } }],
      { navigate, pageState: { id: '42' } }
    );
    expect(navigate).toHaveBeenCalledWith('/users/42');
  });

  it('does nothing if navigate not provided', async () => {
    // Should not throw
    await expect(run([{ type: 'navigate', to: '/' }])).resolves.toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// snackbar
// ─────────────────────────────────────────────────────────────────────────────

describe('snackbar', () => {
  it('calls showToast with message and variant', async () => {
    const showToast = vi.fn();
    await run([{ type: 'snackbar', message: 'Saved!', variant: 'success' }], { showToast });
    expect(showToast).toHaveBeenCalledWith('Saved!', 'success');
  });

  it('defaults variant to "default"', async () => {
    const showToast = vi.fn();
    await run([{ type: 'snackbar', message: 'Hello' }], { showToast });
    expect(showToast).toHaveBeenCalledWith('Hello', 'default');
  });

  it('evaluates message expression', async () => {
    const showToast = vi.fn();
    await run(
      [{ type: 'snackbar', message: { $concat: ['User ', { $ref: 'page.store:name' }] } }],
      { showToast, pageState: { name: 'Alice' } }
    );
    expect(showToast).toHaveBeenCalledWith('User Alice', 'default');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// console.log
// ─────────────────────────────────────────────────────────────────────────────

describe('console.log', () => {
  it('logs payload to console', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await run([{ type: 'console.log', payload: 'debug value' }]);
    expect(log).toHaveBeenCalledWith('[Epic DSL]', 'debug value');
    log.mockRestore();
  });

  it('logs undefined when no payload', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await run([{ type: 'console.log' }]);
    expect(log).toHaveBeenCalledWith('[Epic DSL]', undefined);
    log.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// $if conditional action
// ─────────────────────────────────────────────────────────────────────────────

describe('$if conditional action', () => {
  it('runs then branch when cond is truthy', async () => {
    const navigate = vi.fn();
    await run(
      [{ $if: { cond: true, then: [{ type: 'navigate', to: '/yes' }], else: [{ type: 'navigate', to: '/no' }] } }],
      { navigate }
    );
    expect(navigate).toHaveBeenCalledWith('/yes');
  });

  it('runs else branch when cond is falsy', async () => {
    const navigate = vi.fn();
    await run(
      [{ $if: { cond: false, then: [{ type: 'navigate', to: '/yes' }], else: [{ type: 'navigate', to: '/no' }] } }],
      { navigate }
    );
    expect(navigate).toHaveBeenCalledWith('/no');
  });

  it('runs nothing when cond is false and no else', async () => {
    const navigate = vi.fn();
    await run(
      [{ $if: { cond: false, then: [{ type: 'navigate', to: '/yes' }] } }],
      { navigate }
    );
    expect(navigate).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// actions.group
// ─────────────────────────────────────────────────────────────────────────────

describe('actions.group', () => {
  it('serial mode runs actions in sequence', async () => {
    const order: string[] = [];
    const navigate = vi.fn((to: string) => { order.push(to); });
    await run(
      [{
        type: 'actions.group',
        mode: 'serial',
        actions: [
          { type: 'navigate', to: '/first' },
          { type: 'navigate', to: '/second' },
        ],
      }],
      { navigate }
    );
    expect(order).toEqual(['/first', '/second']);
  });

  it('parallel mode runs all actions', async () => {
    const visited: string[] = [];
    const navigate = vi.fn((to: string) => { visited.push(to); });
    await run(
      [{
        type: 'actions.group',
        mode: 'parallel',
        actions: [
          { type: 'navigate', to: '/a' },
          { type: 'navigate', to: '/b' },
        ],
      }],
      { navigate }
    );
    expect(visited.sort()).toEqual(['/a', '/b']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// try / catch / finally
// ─────────────────────────────────────────────────────────────────────────────

describe('try/catch/finally', () => {
  it('runs try and finally on success', async () => {
    const navigate = vi.fn();
    const showToast = vi.fn();
    await run(
      [{
        type: 'try',
        try: [{ type: 'navigate', to: '/ok' }],
        finally: [{ type: 'snackbar', message: 'done' }],
      }],
      { navigate, showToast }
    );
    expect(navigate).toHaveBeenCalledWith('/ok');
    expect(showToast).toHaveBeenCalledWith('done', 'default');
  });

  it('runs catch on error, then finally', async () => {
    const showToast = vi.fn();
    const navigateSpy = vi.fn().mockImplementationOnce(() => { throw new Error('nav-failed'); });
    const navigateFinal = vi.fn();

    // Use two navigate mocks: first call throws (caught by try), second call runs in finally
    let callCount = 0;
    const navigate = vi.fn().mockImplementation((to: string) => {
      callCount++;
      if (callCount === 1) throw new Error('nav-failed');
      navigateFinal(to);
    });

    await runActions(
      [{
        type: 'try',
        try: [{ type: 'navigate', to: '/will-throw' }],
        catch: [{ type: 'snackbar', message: { $ref: 'error.message' }, variant: 'error' }],
        finally: [{ type: 'navigate', to: '/done' }],
      }],
      makeCtx({ showToast, navigate })
    );
    expect(showToast).toHaveBeenCalledWith('nav-failed', 'error');
    expect(navigateFinal).toHaveBeenCalledWith('/done');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// async.call — $fn
// ─────────────────────────────────────────────────────────────────────────────

describe('async.call with $fn', () => {
  it('calls function, runs onSuccess with result', async () => {
    const showToast = vi.fn();
    const ctx = makeCtx({ showToast });
    ctx.registries.functions['fetchUser'] = async () => ({ name: 'Alice' });

    await runActions(
      [{
        type: 'async.call',
        call: { $fn: 'fetchUser', args: [] },
        onSuccess: [{ type: 'snackbar', message: { $ref: 'result.name' }, variant: 'success' }],
      }],
      ctx
    );
    expect(showToast).toHaveBeenCalledWith('Alice', 'success');
  });

  it('sets loading flag before and after', async () => {
    const dispatched: unknown[] = [];
    const ctx = makeCtx();
    ctx.dispatchPage = (a) => { dispatched.push({ ...a }); };
    ctx.registries.functions['slow'] = async () => 'result';

    await runActions(
      [{
        type: 'async.call',
        loading: 'isLoading',
        call: { $fn: 'slow', args: [] },
      }],
      ctx
    );
    expect(dispatched[0]).toEqual({ type: 'UPDATE', path: 'isLoading', payload: true });
    expect(dispatched[1]).toEqual({ type: 'UPDATE', path: 'isLoading', payload: false });
  });

  it('calls onError when function throws', async () => {
    const showToast = vi.fn();
    const ctx = makeCtx({ showToast });
    ctx.registries.functions['fail'] = async () => { throw new Error('oops'); };

    await runActions(
      [{
        type: 'async.call',
        call: { $fn: 'fail', args: [] },
        onError: [{ type: 'snackbar', message: { $ref: 'error.message' }, variant: 'error' }],
      }],
      ctx
    );
    expect(showToast).toHaveBeenCalledWith('oops', 'error');
  });

  it('drills path into function result', async () => {
    const showToast = vi.fn();
    const ctx = makeCtx({ showToast });
    ctx.registries.functions['getData'] = async () => ({ items: ['a', 'b'] });

    await runActions(
      [{
        type: 'async.call',
        call: { $fn: 'getData', path: 'items' },
        onSuccess: [{ type: 'snackbar', message: { $ref: 'result.0' } }],
      }],
      ctx
    );
    expect(showToast).toHaveBeenCalledWith('a', 'default');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Event injection / $arg
// ─────────────────────────────────────────────────────────────────────────────

describe('event injection and $arg', () => {
  it('$arg reads first raw handler arg', async () => {
    const ctx = await run(
      [{ type: 'page.store.update', path: 'val', payload: { $arg: 0 } }],
      {},
      ['typed-value']
    );
    expect(getDispatched(ctx)[0].payload).toBe('typed-value');
  });

  it('$arg reads dot-path into first arg', async () => {
    const ctx = await run(
      [{ type: 'page.store.update', path: 'val', payload: { $arg: 0, path: 'currentTarget.value' } }],
      {},
      [{ currentTarget: { value: 'from input' } }]
    );
    expect(getDispatched(ctx)[0].payload).toBe('from input');
  });

  it('bare event ref reads plain value arg', async () => {
    // When a component passes a raw string, use { $ref: 'event' } (not event.value)
    // event.value only works when the component passes an object with a 'value' key
    const ctx = await run(
      [{ type: 'page.store.update', path: 'val', payload: { $ref: 'event' } }],
      {},
      ['hello']
    );
    expect(getDispatched(ctx)[0].payload).toBe('hello');
  });

  it('event.value convenience — object arg with value key', async () => {
    const ctx = await run(
      [{ type: 'page.store.update', path: 'val', payload: { $ref: 'event.value' } }],
      {},
      [{ value: 'from-object' }]
    );
    expect(getDispatched(ctx)[0].payload).toBe('from-object');
  });

  it('$arg 1 reads second arg', async () => {
    const ctx = await run(
      [{ type: 'page.store.update', path: 'val', payload: { $arg: 1 } }],
      {},
      ['ignored', 'second']
    );
    expect(getDispatched(ctx)[0].payload).toBe('second');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// localStorage actions (mocked)
// ─────────────────────────────────────────────────────────────────────────────

describe('local storage actions', () => {
  beforeEach(() => {
    // Vitest runs in node by default; stub localStorage
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k in store) delete store[k]; },
      length: 0,
      key: () => null,
    } as Storage;
  });

  it('local.set stores JSON value', async () => {
    await run([{ type: 'local.set', key: 'theme', payload: 'dark' }]);
    expect(localStorage.getItem('theme')).toBe('"dark"');
  });

  it('local.remove deletes key', async () => {
    localStorage.setItem('theme', '"dark"');
    await run([{ type: 'local.remove', key: 'theme' }]);
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('local.clear removes all keys', async () => {
    localStorage.setItem('a', '1');
    localStorage.setItem('b', '2');
    await run([{ type: 'local.clear' }]);
    expect(localStorage.getItem('a')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sessionStorage actions (mocked)
// ─────────────────────────────────────────────────────────────────────────────

describe('session storage actions', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    global.sessionStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k in store) delete store[k]; },
      length: 0,
      key: () => null,
    } as Storage;
  });

  it('session.set stores JSON value', async () => {
    await run([{ type: 'session.set', key: 'step', payload: 2 }]);
    expect(sessionStorage.getItem('step')).toBe('2');
  });

  it('session.remove deletes key', async () => {
    sessionStorage.setItem('step', '2');
    await run([{ type: 'session.remove', key: 'step' }]);
    expect(sessionStorage.getItem('step')).toBeNull();
  });

  it('session.clear removes all', async () => {
    sessionStorage.setItem('x', '1');
    await run([{ type: 'session.clear' }]);
    expect(sessionStorage.getItem('x')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multiple actions in sequence
// ─────────────────────────────────────────────────────────────────────────────

describe('sequential actions', () => {
  it('runs multiple actions in order', async () => {
    const ctx = await run([
      { type: 'page.store.update', path: 'a', payload: 1 },
      { type: 'page.store.update', path: 'b', payload: 2 },
      { type: 'page.store.update', path: 'c', payload: 3 },
    ]);
    expect(getDispatched(ctx)).toEqual([
      { type: 'UPDATE', path: 'a', payload: 1 },
      { type: 'UPDATE', path: 'b', payload: 2 },
      { type: 'UPDATE', path: 'c', payload: 3 },
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unknown action type
// ─────────────────────────────────────────────────────────────────────────────

describe('unknown action type', () => {
  it('warns but does not throw', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(run([{ type: 'nonexistent.action' } as unknown as Parameters<typeof runActions>[0][0]])).resolves.toBeDefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
