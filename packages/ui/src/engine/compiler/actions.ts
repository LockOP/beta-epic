import type {
  ActionSpec,
  RuntimeContext,
  NormalizedError,
} from '../types';
import { evaluateExpression } from './expr';
import { normalizeError } from '../utils/normalize-error';
import { executeHttp } from '../utils/http';
import { getByPath, setByPath } from '../utils/dot-path';
import { isHttpCallExpr, isFnCallExpr, isConditionalActionExpr } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Action runner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run an array of action specs sequentially.
 * Each action can be sync or async — the runner always awaits.
 */
export const runActions = async (
  actions: ActionSpec[],
  ctx: RuntimeContext,
  handlerArgs: unknown[] = []
): Promise<void> => {
  // Inject event from first handler arg
  const ctxWithEvent = injectEvent(ctx, handlerArgs);

  for (const action of actions) {
    await runSingleAction(action, ctxWithEvent, handlerArgs);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Single action dispatch
// ─────────────────────────────────────────────────────────────────────────────

const runSingleAction = async (
  action: ActionSpec,
  ctx: RuntimeContext,
  handlerArgs: unknown[]
): Promise<void> => {
  const a = action as unknown as Record<string, unknown>;

  // ── Conditional ($if inside action array) ──────────────────────────────────
  if (isConditionalActionExpr(action)) {
    const cond = evaluateExpression(action.$if.cond, ctx);
    if (cond) {
      if (action.$if.then) await runActions(action.$if.then, ctx, handlerArgs);
    } else {
      if (action.$if.else) await runActions(action.$if.else, ctx, handlerArgs);
    }
    return;
  }

  const type = a['type'] as string;

  switch (type) {

    // ── page.store.update ───────────────────────────────────────────────────
    case 'page.store.update': {
      const path    = a['path'] as string | undefined;
      const payload = evaluateExpression(a['payload'] as Parameters<typeof evaluateExpression>[0], ctx);
      ctx.dispatchPage({ type: 'UPDATE', path, payload });
      break;
    }

    // ── page.store.reset ────────────────────────────────────────────────────
    case 'page.store.reset': {
      const path = a['path'] as string | undefined;
      if (path) {
        const initial = getByPath(ctx.initialPageState, path);
        ctx.dispatchPage({ type: 'UPDATE', path, payload: initial });
      } else {
        ctx.dispatchPage({ type: 'RESET' });
      }
      break;
    }

    // ── async.call ──────────────────────────────────────────────────────────
    case 'async.call': {
      const call      = a['call'] as Record<string, unknown>;
      const onSuccess = a['onSuccess'] as ActionSpec[] | undefined;
      const onError   = a['onError']   as ActionSpec[] | undefined;
      const loading   = a['loading']   as string       | undefined;

      if (loading) ctx.dispatchPage({ type: 'UPDATE', path: loading, payload: true });

      try {
        let result: unknown;

        if (isHttpCallExpr(call)) {
          result = await executeHttp(call.$http, ctx);
        } else if (isFnCallExpr(call)) {
          const fn = ctx.registries.functions[call.$fn];
          if (!fn) throw new Error(`[Epic] Function "${call.$fn}" not found in registry`);
          const args = Array.isArray(call.args)
            ? call.args.map(arg => evaluateExpression(arg, ctx))
            : [];
          result = await fn(...args);
          if (call.path) result = getByPath(result, call.path);
        }

        if (onSuccess) {
          const successCtx = withResult(ctx, result);
          await runActions(onSuccess, successCtx, handlerArgs);
        }
      } catch (err) {
        const normalized = normalizeError(err);
        if (onError) {
          const errorCtx = withError(ctx, normalized);
          await runActions(onError, errorCtx, handlerArgs);
        }
      } finally {
        if (loading) ctx.dispatchPage({ type: 'UPDATE', path: loading, payload: false });
      }
      break;
    }

    // ── try / catch / finally ───────────────────────────────────────────────
    case 'try': {
      const tryBlock     = a['try']     as ActionSpec[];
      const catchBlock   = a['catch']   as ActionSpec[] | undefined;
      const finallyBlock = a['finally'] as ActionSpec[] | undefined;

      try {
        await runActions(tryBlock, ctx, handlerArgs);
      } catch (err) {
        const normalized = normalizeError(err);
        if (catchBlock) {
          const errorCtx = withError(ctx, normalized);
          await runActions(catchBlock, errorCtx, handlerArgs);
        }
      } finally {
        if (finallyBlock) {
          await runActions(finallyBlock, ctx, handlerArgs);
        }
      }
      break;
    }

    // ── actions.group ───────────────────────────────────────────────────────
    case 'actions.group': {
      const mode    = (a['mode'] as string) || 'serial';
      const actions = a['actions'] as ActionSpec[];
      if (mode === 'parallel') {
        await Promise.all(actions.map(act => runSingleAction(act, ctx, handlerArgs)));
      } else {
        for (const act of actions) {
          await runSingleAction(act, ctx, handlerArgs);
        }
      }
      break;
    }

    // ── redux.dispatch ──────────────────────────────────────────────────────
    case 'redux.dispatch': {
      const actionArg = a['action'];
      const payload   = a['payload'] !== undefined
        ? evaluateExpression(a['payload'] as Parameters<typeof evaluateExpression>[0], ctx)
        : undefined;

      if (typeof actionArg === 'string') {
        ctx.globalStore?.getState; // type-check presence
        // Dispatch via a separate Redux dispatch function if provided
        const reduxDispatch = (ctx as RuntimeContext & { reduxDispatch?: (a: unknown) => void }).reduxDispatch;
        reduxDispatch?.({ type: actionArg, payload });
      }
      break;
    }

    // ── navigate ────────────────────────────────────────────────────────────
    case 'navigate': {
      const to = String(evaluateExpression(a['to'] as Parameters<typeof evaluateExpression>[0], ctx) ?? '');
      ctx.navigate?.(to);
      break;
    }

    // ── snackbar ─────────────────────────────────────────────────────────────
    case 'snackbar': {
      const message = String(evaluateExpression(a['message'] as Parameters<typeof evaluateExpression>[0], ctx) ?? '');
      const variant = (a['variant'] as string) || 'default';
      ctx.showToast?.(message, variant as Parameters<NonNullable<RuntimeContext['showToast']>>[1]);
      break;
    }

    // ── console.log ──────────────────────────────────────────────────────────
    case 'console.log': {
      const val = a['payload'] !== undefined
        ? evaluateExpression(a['payload'] as Parameters<typeof evaluateExpression>[0], ctx)
        : undefined;
      console.log('[Epic DSL]', val);
      break;
    }

    // ── window.open ──────────────────────────────────────────────────────────
    case 'window.open': {
      const url    = String(evaluateExpression(a['url']    as Parameters<typeof evaluateExpression>[0], ctx) ?? '');
      const target = a['target'] !== undefined
        ? String(evaluateExpression(a['target'] as Parameters<typeof evaluateExpression>[0], ctx))
        : '_blank';
      window.open(url, target);
      break;
    }

    // ── local.set ───────────────────────────────────────────────────────────
    case 'local.set': {
      const key  = a['key'] as string;
      const val  = evaluateExpression(a['payload'] as Parameters<typeof evaluateExpression>[0], ctx);
      localStorage.setItem(key, JSON.stringify(val));
      break;
    }
    case 'local.remove': {
      localStorage.removeItem(a['key'] as string);
      break;
    }
    case 'local.clear': {
      localStorage.clear();
      break;
    }

    // ── session.set ─────────────────────────────────────────────────────────
    case 'session.set': {
      const key = a['key'] as string;
      const val = evaluateExpression(a['payload'] as Parameters<typeof evaluateExpression>[0], ctx);
      sessionStorage.setItem(key, JSON.stringify(val));
      break;
    }
    case 'session.remove': {
      sessionStorage.removeItem(a['key'] as string);
      break;
    }
    case 'session.clear': {
      sessionStorage.clear();
      break;
    }

    default:
      console.warn(`[Epic] Unknown action type: "${type}"`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Context augmentation helpers
// ─────────────────────────────────────────────────────────────────────────────

const injectEvent = (ctx: RuntimeContext, handlerArgs: unknown[]): RuntimeContext => {
  const refs: Record<string, unknown> = Object.create(ctx.refs) as Record<string, unknown>;

  if (handlerArgs.length) {
    const event = handlerArgs[0];
    refs['event'] = event;
    // Convenience shorthands for the first arg — works when the component passes
    // a plain value or a { value, checked } shaped object. For full raw access use $arg.
    if (event !== null && typeof event === 'object') {
      const ev = event as Record<string, unknown>;
      refs['event.value']   = ev['value'];
      refs['event.checked'] = ev['checked'];
    } else {
      refs['event.value'] = event;
    }
  }

  // Thread raw handler args into ctx so $arg expressions can read any position/path
  return { ...ctx, refs, args: handlerArgs };
};

const withResult = (ctx: RuntimeContext, result: unknown): RuntimeContext => {
  const refs: Record<string, unknown> = Object.create(ctx.refs) as Record<string, unknown>;
  refs['result'] = result;
  return { ...ctx, refs };
};

const withError = (ctx: RuntimeContext, err: NormalizedError): RuntimeContext => {
  const refs: Record<string, unknown> = Object.create(ctx.refs) as Record<string, unknown>;
  refs['error'] = err;
  refs['error.message'] = err.message;
  refs['error.status']  = err.status;
  return { ...ctx, refs };
};

// Re-export for convenience
export { runSingleAction };
