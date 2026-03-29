import type { Expression, RuntimeContext } from '../types';
import { getByPath, getLocalStorage, getSessionStorage } from '../utils/dot-path';

// ─────────────────────────────────────────────────────────────────────────────
// Core expression evaluator — all DSL $-prefixed operators
// ─────────────────────────────────────────────────────────────────────────────

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

export const evaluateExpression = (expr: Expression, ctx: RuntimeContext): unknown => {

  // ── Primitives ──────────────────────────────────────────────────────────────
  if (expr === null || expr === undefined) return null;
  if (typeof expr === 'boolean') return expr;
  if (typeof expr === 'number')  return expr;
  if (typeof expr === 'string') {
    // "$$" as a bare string is a $pipe accumulator shorthand — resolve as a ref
    if (expr === '$$') return resolveRef('$$', ctx);
    return expr;
  }

  // ── Array — evaluate each element ──────────────────────────────────────────
  if (Array.isArray(expr)) {
    return expr.map(item => evaluateExpression(item as Expression, ctx));
  }

  const e = expr as Record<string, unknown>;

  // ── $ref ────────────────────────────────────────────────────────────────────
  if ('$ref' in e) return resolveRef(e['$ref'] as string, ctx);

  // ── $arg — raw handler argument by index ────────────────────────────────────
  // { "$arg": 0 }                     → first handler arg as-is
  // { "$arg": 0, "path": "target.value" } → dot-path into that arg
  if ('$arg' in e) {
    const idx  = typeof e['$arg'] === 'number' ? (e['$arg'] as number) : 0;
    const path = typeof e['path'] === 'string' ? (e['path'] as string) : undefined;
    const arg  = ctx.args?.[idx] ?? null;
    if (path && arg !== null && arg !== undefined) {
      return getByPath(arg as Record<string, unknown>, path) ?? null;
    }
    return arg;
  }

  // ── $fn ─────────────────────────────────────────────────────────────────────
  if ('$fn' in e) {
    const name = e['$fn'] as string;
    const fn = ctx.registries.functions[name];
    if (!fn) { console.warn(`[Epic] $fn "${name}" not found in function registry`); return undefined; }
    const args = Array.isArray(e['args']) ? (e['args'] as Expression[]).map(a => evaluateExpression(a, ctx)) : [];
    const result = fn(...args);
    if (e['path'] && typeof e['path'] === 'string') return getByPath(result, e['path'] as string);
    return result;
  }

  // ── $pipe ────────────────────────────────────────────────────────────────────
  if ('$pipe' in e) {
    const steps = e['$pipe'] as Expression[];
    if (!Array.isArray(steps)) return null;
    let acc: unknown = undefined;
    for (const step of steps) {
      acc = evaluateExpression(step as Expression, { ...ctx, refs: { ...ctx.refs, '$$': acc } });
    }
    return acc;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Control flow
  // ─────────────────────────────────────────────────────────────────────────────

  // $if — { cond, then, else? }
  if ('$if' in e) {
    const { cond, then: t, else: f } = e['$if'] as { cond: Expression; then?: Expression; else?: Expression };
    return evaluateExpression(evaluateExpression(cond, ctx) ? (t ?? null) : (f ?? null), ctx);
  }

  // $switch — { on, cases, default? }
  if ('$switch' in e) {
    const { on, cases, default: def } = e['$switch'] as { on: Expression; cases: Record<string, Expression>; default?: Expression };
    const key = String(evaluateExpression(on, ctx));
    return key in cases ? evaluateExpression(cases[key], ctx) : (def !== undefined ? evaluateExpression(def, ctx) : null);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Logic
  // ─────────────────────────────────────────────────────────────────────────────

  if ('$not' in e) return !evaluateExpression(e['$not'] as Expression, ctx);
  if ('$and' in e) { const items = e['$and'] as Expression[]; return Array.isArray(items) ? items.every(i => Boolean(evaluateExpression(i, ctx))) : false; }
  if ('$or'  in e) { const items = e['$or']  as Expression[]; return Array.isArray(items) ? items.some(i =>  Boolean(evaluateExpression(i, ctx))) : false; }

  // $in — { value, array }
  if ('$in' in e) {
    const { value, array } = e['$in'] as { value: Expression; array: Expression };
    const arr = evaluateExpression(array, ctx);
    const val = evaluateExpression(value, ctx);
    return Array.isArray(arr) ? arr.includes(val) : false;
  }

  // $has — { obj, key }
  if ('$has' in e) {
    const { obj, key } = e['$has'] as { obj: Expression; key: Expression };
    const o = evaluateExpression(obj, ctx);
    const k = String(evaluateExpression(key, ctx) ?? '');
    return isPlainObject(o) ? k in o : false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Type checks — $isEmpty, $isNil, $isNotNil, $isArray
  // ─────────────────────────────────────────────────────────────────────────────

  if ('$isEmpty'   in e) { const v = evaluateExpression(e['$isEmpty']   as Expression, ctx); return v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0); }
  if ('$isNil'     in e) { const v = evaluateExpression(e['$isNil']     as Expression, ctx); return v === null || v === undefined; }
  if ('$isNotNil'  in e) { const v = evaluateExpression(e['$isNotNil']  as Expression, ctx); return v !== null && v !== undefined; }
  if ('$isArray'   in e) { const v = evaluateExpression(e['$isArray']   as Expression, ctx); return Array.isArray(v); }

  // ─────────────────────────────────────────────────────────────────────────────
  // Comparison — { a, b }
  // ─────────────────────────────────────────────────────────────────────────────

  if ('$eq'  in e) { const {a,b} = e['$eq']  as {a:Expression;b:Expression}; return evaluateExpression(a,ctx) === evaluateExpression(b,ctx); }
  if ('$neq' in e) { const {a,b} = e['$neq'] as {a:Expression;b:Expression}; return evaluateExpression(a,ctx) !== evaluateExpression(b,ctx); }
  if ('$gt'  in e) { const {a,b} = e['$gt']  as {a:Expression;b:Expression}; return (evaluateExpression(a,ctx) as number) >  (evaluateExpression(b,ctx) as number); }
  if ('$gte' in e) { const {a,b} = e['$gte'] as {a:Expression;b:Expression}; return (evaluateExpression(a,ctx) as number) >= (evaluateExpression(b,ctx) as number); }
  if ('$lt'  in e) { const {a,b} = e['$lt']  as {a:Expression;b:Expression}; return (evaluateExpression(a,ctx) as number) <  (evaluateExpression(b,ctx) as number); }
  if ('$lte' in e) { const {a,b} = e['$lte'] as {a:Expression;b:Expression}; return (evaluateExpression(a,ctx) as number) <= (evaluateExpression(b,ctx) as number); }

  // ─────────────────────────────────────────────────────────────────────────────
  // Math
  // ─────────────────────────────────────────────────────────────────────────────

  if ('$add' in e) { const items = e['$add'] as Expression[]; return (items as Expression[]).reduce<number>((s,i) => s + (evaluateExpression(i,ctx) as number), 0); }
  if ('$sub' in e) { const [a,b] = e['$sub'] as Expression[]; return (evaluateExpression(a,ctx) as number) - (evaluateExpression(b,ctx) as number); }
  if ('$mul' in e) { const items = e['$mul'] as Expression[]; return (items as Expression[]).reduce<number>((p,i) => p * (evaluateExpression(i,ctx) as number), 1); }
  if ('$div' in e) { const [a,b] = e['$div'] as Expression[]; const d = evaluateExpression(b,ctx) as number; return d === 0 ? 0 : (evaluateExpression(a,ctx) as number) / d; }
  if ('$mod' in e) { const [a,b] = e['$mod'] as Expression[]; return (evaluateExpression(a,ctx) as number) % (evaluateExpression(b,ctx) as number); }
  if ('$pow' in e) {
    const inner = e['$pow'] as { base: Expression; exp: Expression } | Expression[];
    if (Array.isArray(inner)) return Math.pow(evaluateExpression(inner[0],ctx) as number, evaluateExpression(inner[1],ctx) as number);
    const { base, exp } = inner as { base: Expression; exp: Expression };
    return Math.pow(evaluateExpression(base,ctx) as number, evaluateExpression(exp,ctx) as number);
  }
  if ('$abs'    in e) return Math.abs(evaluateExpression(e['$abs']    as Expression,ctx) as number);
  if ('$negate' in e) return -(evaluateExpression(e['$negate'] as Expression,ctx) as number);
  if ('$sqrt'   in e) return Math.sqrt(evaluateExpression(e['$sqrt']  as Expression,ctx) as number);
  if ('$ceil'   in e) return Math.ceil(evaluateExpression(e['$ceil']  as Expression,ctx) as number);
  if ('$floor'  in e) return Math.floor(evaluateExpression(e['$floor'] as Expression,ctx) as number);
  if ('$round'  in e) {
    const inner = e['$round'];
    if (Array.isArray(inner)) { const [v,d] = inner as Expression[]; const f = Math.pow(10, (evaluateExpression(d,ctx) as number)||0); return Math.round((evaluateExpression(v,ctx) as number)*f)/f; }
    return Math.round(evaluateExpression(inner as Expression,ctx) as number);
  }
  if ('$sum' in e) {
    const inner = e['$sum'];
    if (Array.isArray(inner)) return (inner as Expression[]).reduce<number>((s,i) => s + (evaluateExpression(i,ctx) as number), 0);
    const { over, as: asN, return: ret } = inner as { over: Expression; as: string; return: Expression };
    const arr = evaluateExpression(over, ctx);
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((s, item) => { const c = mapCtx(ctx,asN,item,0); return (s as number) + (evaluateExpression(ret,c) as number); }, 0);
  }
  if ('$min' in e) { const items = (e['$min'] as Expression[]).map(i => evaluateExpression(i,ctx) as number); return Math.min(...items); }
  if ('$max' in e) { const items = (e['$max'] as Expression[]).map(i => evaluateExpression(i,ctx) as number); return Math.max(...items); }
  if ('$clamp' in e) {
    const { value: v, min: mn, max: mx } = e['$clamp'] as { value: Expression; min: Expression; max: Expression };
    return Math.min(Math.max(evaluateExpression(v,ctx) as number, evaluateExpression(mn,ctx) as number), evaluateExpression(mx,ctx) as number);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // String
  // ─────────────────────────────────────────────────────────────────────────────

  if ('$concat' in e) { const items = e['$concat'] as Expression[]; return (items as Expression[]).map(i => evaluateExpression(i,ctx) ?? '').join(''); }
  if ('$length' in e) { const v = evaluateExpression(e['$length'] as Expression,ctx); if (typeof v === 'string') return v.length; if (Array.isArray(v)) return v.length; if (isPlainObject(v)) return Object.keys(v).length; return 0; }

  // Unary string ops
  if ('$trim'  in e) return String(evaluateExpression(e['$trim']  as Expression, ctx) ?? '').trim();
  if ('$lower' in e) return String(evaluateExpression(e['$lower'] as Expression, ctx) ?? '').toLowerCase();
  if ('$upper' in e) return String(evaluateExpression(e['$upper'] as Expression, ctx) ?? '').toUpperCase();

  // Binary string ops — { value, ... }
  if ('$replace' in e) {
    const { value: v, from, to } = e['$replace'] as { value: Expression; from: Expression; to: Expression };
    return String(evaluateExpression(v,ctx) ?? '').replaceAll(String(evaluateExpression(from,ctx) ?? ''), String(evaluateExpression(to,ctx) ?? ''));
  }
  if ('$padStart' in e) {
    const inner = e['$padStart'] as { value: Expression; len?: Expression; length?: Expression; char?: Expression };
    const len   = Number(evaluateExpression((inner.len ?? inner.length ?? 0) as Expression, ctx) ?? 0);
    const char  = inner.char !== undefined ? String(evaluateExpression(inner.char, ctx) ?? '') : ' ';
    return String(evaluateExpression(inner.value, ctx) ?? '').padStart(len, char);
  }
  if ('$padEnd' in e) {
    const inner = e['$padEnd'] as { value: Expression; len?: Expression; length?: Expression; char?: Expression };
    const len   = Number(evaluateExpression((inner.len ?? inner.length ?? 0) as Expression, ctx) ?? 0);
    const char  = inner.char !== undefined ? String(evaluateExpression(inner.char, ctx) ?? '') : ' ';
    return String(evaluateExpression(inner.value, ctx) ?? '').padEnd(len, char);
  }
  if ('$split' in e) {
    const { value: v, sep } = e['$split'] as { value: Expression; sep: Expression };
    return String(evaluateExpression(v,ctx) ?? '').split(String(evaluateExpression(sep,ctx) ?? ''));
  }
  // $join — joins an array into a string: { arr, sep } or { parts: [...], sep? }
  if ('$join' in e) {
    const inner = e['$join'] as { arr?: Expression; parts?: Expression[]; sep?: Expression };
    const sep   = inner.sep !== undefined ? String(evaluateExpression(inner.sep,ctx) ?? '') : '';
    const arr   = inner.parts !== undefined
      ? inner.parts.map(p => evaluateExpression(p as Expression, ctx))
      : evaluateExpression(inner.arr as Expression, ctx);
    return Array.isArray(arr) ? arr.join(sep) : String(arr ?? '');
  }
  if ('$includes' in e) {
    const { value: v, search: s } = e['$includes'] as { value: Expression; search: Expression };
    return String(evaluateExpression(v,ctx) ?? '').includes(String(evaluateExpression(s,ctx) ?? ''));
  }
  if ('$startsWith' in e) {
    const { value: v, prefix } = e['$startsWith'] as { value: Expression; prefix: Expression };
    return String(evaluateExpression(v,ctx) ?? '').startsWith(String(evaluateExpression(prefix,ctx) ?? ''));
  }
  if ('$endsWith' in e) {
    const { value: v, suffix } = e['$endsWith'] as { value: Expression; suffix: Expression };
    return String(evaluateExpression(v,ctx) ?? '').endsWith(String(evaluateExpression(suffix,ctx) ?? ''));
  }
  // $contains — case-insensitive substring match; empty search returns true
  if ('$contains' in e) {
    const { value: v, search: s } = e['$contains'] as { value: Expression; search: Expression };
    const str = String(evaluateExpression(v,ctx) ?? '').toLowerCase();
    const q   = String(evaluateExpression(s,ctx) ?? '').toLowerCase();
    return q === '' || str.includes(q);
  }
  if ('$charAt' in e) {
    const { value: v, index } = e['$charAt'] as { value: Expression; index: Expression };
    return String(evaluateExpression(v,ctx) ?? '').charAt(Number(evaluateExpression(index,ctx) ?? 0));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Type coercion — $string, $number, $bool, $nullish
  // ─────────────────────────────────────────────────────────────────────────────

  if ('$string'  in e) return String(evaluateExpression(e['$string'] as Expression,ctx) ?? '');
  if ('$number'  in e) return Number(evaluateExpression(e['$number'] as Expression,ctx));
  if ('$bool'    in e) return Boolean(evaluateExpression(e['$bool']  as Expression,ctx));
  if ('$nullish' in e) {
    const { value: v, default: def } = e['$nullish'] as { value: Expression; default: Expression };
    const val = evaluateExpression(v, ctx);
    return val !== null && val !== undefined ? val : evaluateExpression(def, ctx);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Array
  // ─────────────────────────────────────────────────────────────────────────────

  // Iteration operators
  if ('$map' in e) {
    const { over, as: asN, return: ret } = e['$map'] as { over: Expression; as: string; return: Expression };
    const arr = evaluateExpression(over, ctx);
    if (!Array.isArray(arr)) return [];
    return arr.map((item, idx) => evaluateExpression(ret, mapCtx(ctx, asN, item, idx)));
  }
  if ('$filter' in e) {
    const { over, as: asN, where } = e['$filter'] as { over: Expression; as: string; where: Expression };
    const arr = evaluateExpression(over, ctx);
    if (!Array.isArray(arr)) return [];
    return arr.filter((item, idx) => Boolean(evaluateExpression(where, mapCtx(ctx, asN, item, idx))));
  }
  if ('$reduce' in e) {
    const { over, as: asN, acc: accN, init, return: ret } = e['$reduce'] as { over: Expression; as: string; acc: string; init: Expression; return: Expression };
    const arr = evaluateExpression(over, ctx);
    if (!Array.isArray(arr)) return evaluateExpression(init, ctx);
    return arr.reduce((acc, item, idx) => {
      const c = mapCtx(ctx, asN, item, idx);
      c.refs[accN] = acc;
      return evaluateExpression(ret, c);
    }, evaluateExpression(init, ctx));
  }
  if ('$find' in e) {
    const { over, as: asN, where } = e['$find'] as { over: Expression; as: string; where: Expression };
    const arr = evaluateExpression(over, ctx);
    if (!Array.isArray(arr)) return null;
    return arr.find((item, idx) => Boolean(evaluateExpression(where, mapCtx(ctx, asN, item, idx)))) ?? null;
  }
  if ('$findIndex' in e) {
    const { over, as: asN, where } = e['$findIndex'] as { over: Expression; as: string; where: Expression };
    const arr = evaluateExpression(over, ctx);
    if (!Array.isArray(arr)) return -1;
    return arr.findIndex((item, idx) => Boolean(evaluateExpression(where, mapCtx(ctx, asN, item, idx))));
  }
  if ('$some' in e) {
    const { over, as: asN, where } = e['$some'] as { over: Expression; as: string; where: Expression };
    const arr = evaluateExpression(over, ctx);
    if (!Array.isArray(arr)) return false;
    return arr.some((item, idx) => Boolean(evaluateExpression(where, mapCtx(ctx, asN, item, idx))));
  }
  if ('$every' in e) {
    const { over, as: asN, where } = e['$every'] as { over: Expression; as: string; where: Expression };
    const arr = evaluateExpression(over, ctx);
    if (!Array.isArray(arr)) return true;
    return arr.every((item, idx) => Boolean(evaluateExpression(where, mapCtx(ctx, asN, item, idx))));
  }
  if ('$sort' in e) {
    const { over, by, dir } = e['$sort'] as { over: Expression; by?: Expression; dir?: 'asc' | 'desc' };
    const arr = evaluateExpression(over, ctx);
    if (!Array.isArray(arr)) return [];
    return [...arr].sort((a, b) => {
      let aV = a, bV = b;
      if (by) {
        aV = evaluateExpression(by, { ...ctx, refs: { ...ctx.refs, item: a } });
        bV = evaluateExpression(by, { ...ctx, refs: { ...ctx.refs, item: b } });
      }
      if (aV === bV) return 0;
      const cmp = (aV as number) < (bV as number) ? -1 : 1;
      return dir === 'desc' ? -cmp : cmp;
    });
  }

  // Utility array operators
  if ('$count'   in e) { const v = evaluateExpression(e['$count']   as Expression,ctx); if (Array.isArray(v)) return v.length; if (typeof v === 'string') return v.length; if (isPlainObject(v)) return Object.keys(v).length; return 0; }
  if ('$first'   in e) { const v = evaluateExpression(e['$first']   as Expression,ctx); return Array.isArray(v) ? (v[0] ?? null) : null; }
  if ('$last'    in e) { const v = evaluateExpression(e['$last']    as Expression,ctx); return Array.isArray(v) ? (v[v.length-1] ?? null) : null; }
  if ('$flat'    in e) { const v = evaluateExpression(e['$flat']    as Expression,ctx); return Array.isArray(v) ? v.flat() : []; }
  if ('$flatten' in e) { const v = evaluateExpression(e['$flatten'] as Expression,ctx); return Array.isArray(v) ? v.flat() : []; }
  if ('$reverse' in e) { const v = evaluateExpression(e['$reverse'] as Expression,ctx); return Array.isArray(v) ? [...v].reverse() : []; }
  if ('$compact' in e) { const v = evaluateExpression(e['$compact'] as Expression,ctx); return Array.isArray(v) ? v.filter(Boolean) : []; }
  if ('$uniq'    in e) { const v = evaluateExpression(e['$uniq']    as Expression,ctx); return Array.isArray(v) ? [...new Set(v)] : v; }

  if ('$slice' in e) {
    const inner = e['$slice'] as { over?: Expression; value?: Expression; start: Expression; end?: Expression };
    const src   = evaluateExpression((inner.over ?? inner.value) as Expression, ctx);
    const from  = Number(evaluateExpression(inner.start, ctx) ?? 0);
    const to    = inner.end !== undefined ? Number(evaluateExpression(inner.end, ctx)) : undefined;
    if (Array.isArray(src)) return src.slice(from, to);
    if (typeof src === 'string') return src.slice(from, to);
    return src;
  }
  if ('$at' in e) {
    const { arr, index, fallback } = e['$at'] as { arr: Expression; index: Expression; fallback?: Expression };
    const v   = evaluateExpression(arr, ctx);
    const idx = Number(evaluateExpression(index, ctx) ?? 0);
    if (!Array.isArray(v)) return fallback !== undefined ? evaluateExpression(fallback, ctx) : null;
    const item = v[idx];
    return item !== undefined ? item : (fallback !== undefined ? evaluateExpression(fallback, ctx) : null);
  }
  if ('$append' in e) {
    const inner = e['$append'] as { to: Expression; item?: Expression; value?: Expression };
    const arr   = evaluateExpression(inner.to, ctx);
    const val   = evaluateExpression((inner.item ?? inner.value) as Expression, ctx);
    return Array.isArray(arr) ? [...arr, val] : [val];
  }
  if ('$prepend' in e) {
    const { to, item } = e['$prepend'] as { to: Expression; item: Expression };
    const arr = evaluateExpression(to, ctx);
    const val = evaluateExpression(item, ctx);
    return Array.isArray(arr) ? [val, ...arr] : [val];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Object
  // ─────────────────────────────────────────────────────────────────────────────

  if ('$merge' in e) {
    const items = e['$merge'] as Expression[];
    return (items as Expression[]).reduce<unknown>((acc, item) => {
      const v = evaluateExpression(item, ctx);
      return isPlainObject(v) ? { ...(acc as object), ...v } : acc;
    }, {});
  }
  if ('$get' in e) {
    const inner = e['$get'] as { from: Expression; key?: Expression; path?: Expression };
    const obj   = evaluateExpression(inner.from, ctx);
    const k     = String(evaluateExpression((inner.key ?? inner.path) as Expression, ctx) ?? '');
    return getByPath(obj, k);
  }
  if ('$keys'    in e) { const v = evaluateExpression(e['$keys']    as Expression,ctx); return isPlainObject(v) ? Object.keys(v)                                          : []; }
  if ('$values'  in e) { const v = evaluateExpression(e['$values']  as Expression,ctx); return isPlainObject(v) ? Object.values(v)                                        : []; }
  if ('$entries' in e) { const v = evaluateExpression(e['$entries'] as Expression,ctx); return isPlainObject(v) ? Object.entries(v)                                       : []; }
  if ('$pick' in e) {
    const { from, keys: ks } = e['$pick'] as { from: Expression; keys: Expression };
    const obj  = evaluateExpression(from, ctx);
    const keys = evaluateExpression(ks, ctx) as string[];
    if (!isPlainObject(obj) || !Array.isArray(keys)) return {};
    return Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
  }
  if ('$omit' in e) {
    const { from, keys: ks } = e['$omit'] as { from: Expression; keys: Expression };
    const obj  = evaluateExpression(from, ctx);
    const keys = evaluateExpression(ks, ctx) as string[];
    if (!isPlainObject(obj) || !Array.isArray(keys)) return obj;
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
  }
  if ('$has' in e) {
    const { obj, key } = e['$has'] as { obj: Expression; key: Expression };
    const o = evaluateExpression(obj, ctx);
    const k = String(evaluateExpression(key, ctx) ?? '');
    return isPlainObject(o) ? k in o : false;
  }

  // $json — JSON.stringify; $parse — JSON.parse
  if ('$json'  in e) { try { return JSON.stringify(evaluateExpression(e['$json']  as Expression,ctx)); } catch { return null; } }
  if ('$parse' in e) { try { return JSON.parse(String(evaluateExpression(e['$parse'] as Expression,ctx) ?? '')); } catch { return null; } }

  // ─────────────────────────────────────────────────────────────────────────────
  // Plain object — evaluate each value (no $ keys matched above)
  // ─────────────────────────────────────────────────────────────────────────────

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(e)) {
    result[k] = evaluateExpression(v as Expression, ctx);
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Create a prototype-chain child context for iteration variables. */
const mapCtx = (ctx: RuntimeContext, varName: string, item: unknown, idx: number): RuntimeContext => {
  const child = Object.create(ctx) as RuntimeContext;
  child.refs  = Object.create(ctx.refs) as Record<string, unknown>;
  child.refs[varName]           = item;
  child.refs[`${varName}Index`] = idx;
  return child;
};

// ─────────────────────────────────────────────────────────────────────────────
// Ref resolver
// ─────────────────────────────────────────────────────────────────────────────

const resolveRef = (ref: string, ctx: RuntimeContext): unknown => {
  if (typeof ref !== 'string') return undefined;

  if (ref.startsWith('page.store:')) { const p = ref.slice(11); return p ? getByPath(ctx.pageState, p) : ctx.pageState; }
  if (ref.startsWith('selectors:'))  { const name = ref.slice(10); return getByPath((ctx.refs['__selectors'] as Record<string,unknown> | undefined) ?? {}, name); }
  // var: — iteration variables (from as:/acc:), env block vars, event/result/error/$$
  if (ref.startsWith('var:'))        { return getByPath(ctx.refs, ref.slice(4)); }
  // env: — window/process environment variables ONLY (not iteration vars)
  if (ref.startsWith('env:'))        { if (typeof window !== 'undefined') { return getByPath((window as Window & { env?: Record<string,unknown> }).env, ref.slice(4)); } return undefined; }
  if (ref.startsWith('redux:'))      { const p = ref.slice(6); return ctx.globalStore ? getByPath(ctx.globalStore.getState(), p) : undefined; }
  if (ref.startsWith('url:'))        { return ctx.url ? getByPath(ctx.url, ref.slice(4)) : undefined; }
  if (ref.startsWith('refs:'))       { return getByPath(ctx.refs, ref.slice(5)); }
  if (ref.startsWith('local:'))      { return getLocalStorage(ref.slice(6)); }
  if (ref.startsWith('session:'))    { return getSessionStorage(ref.slice(8)); }

  // No prefix — bare refs: event.value, result, error.message, $$, iteration vars, env block vars
  const fromRefs = getByPath(ctx.refs, ref);
  if (fromRefs !== undefined) return fromRefs;
  return getByPath(ctx.pageState, ref);
};
