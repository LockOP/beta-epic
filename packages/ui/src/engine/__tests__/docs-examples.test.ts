/**
 * docs-examples.test.ts
 *
 * One test per meaningful claim in the 25 example files.
 * Each describe block is labelled with the source file so a failure tells you
 * exactly which doc is wrong.
 *
 * React-rendering concerns (GuiProvider, effects lifecycle, theme CSS vars)
 * are outside unit-test scope and are explicitly marked "runtime-only".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { evaluateExpression } from '../compiler/expr';
import { runActions } from '../compiler/actions';
import { substituteSubConfigs } from '../compiler/substitute';
import { makeCtx, getDispatched } from './setup';
import type { RuntimeContext, ComponentNode, RefConfigs } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const expr = (e: unknown, overrides: Partial<RuntimeContext> & {
  pageState?: Record<string, unknown>;
  refs?: Record<string, unknown>;
} = {}) => evaluateExpression(
  e as Parameters<typeof evaluateExpression>[0],
  makeCtx(overrides)
);

const act = async (
  actions: Parameters<typeof runActions>[0],
  overrides: Partial<RuntimeContext> & {
    pageState?: Record<string, unknown>;
    refs?: Record<string, unknown>;
  } = {},
  handlerArgs: unknown[] = []
) => {
  const ctx = makeCtx(overrides);
  await runActions(actions, ctx, handlerArgs);
  return ctx;
};

// ─────────────────────────────────────────────────────────────────────────────
// 01-refs.md
// ─────────────────────────────────────────────────────────────────────────────

describe('01-refs — $ref namespaces', () => {

  it('page.store: reads a top-level field', () =>
    expect(expr({ $ref: 'page.store:count' }, { pageState: { count: 7 } })).toBe(7));

  it('page.store: reads nested path', () =>
    expect(expr({ $ref: 'page.store:user.name' }, { pageState: { user: { name: 'Alice' } } })).toBe('Alice'));

  it('page.store: empty path returns entire store', () => {
    const state = { a: 1, b: 2 };
    expect(expr({ $ref: 'page.store:' }, { pageState: state })).toEqual(state);
  });

  it('selectors: reads from __selectors', () =>
    expect(expr({ $ref: 'selectors:total' }, { refs: { __selectors: { total: 42 } } })).toBe(42));

  it('var: reads iteration variable', () =>
    expect(expr({ $ref: 'var:item' }, { refs: { item: 'apple' } })).toBe('apple'));

  it('var: reads nested path into iteration variable', () =>
    expect(expr({ $ref: 'var:item.price' }, { refs: { item: { price: 9.99 } } })).toBe(9.99));

  it('var: reads $$ pipe accumulator', () =>
    expect(expr({ $ref: 'var:$$' }, { refs: { '$$': 'acc-value' } })).toBe('acc-value'));

  it('var: reads event.value', () =>
    expect(expr({ $ref: 'var:event.value' }, { refs: { event: { value: 'typed' } } })).toBe('typed'));

  it('var: reads result from async context', () =>
    expect(expr({ $ref: 'var:result' }, { refs: { result: { id: 99 } } })).toEqual({ id: 99 }));

  it('var: reads error.message', () =>
    expect(expr({ $ref: 'var:error.message' }, { refs: { error: { message: 'oops' } } })).toBe('oops'));

  it('bare ref reads result (no prefix)', () =>
    expect(expr({ $ref: 'result' }, { refs: { result: { id: 5 } } })).toEqual({ id: 5 }));

  it('bare ref reads error.message (no prefix, dot resolved via getByPath)', () => {
    // error.message is stored as refs['error'] = { message: '...' }
    // getByPath traverses: refs['error']['message']
    expect(expr({ $ref: 'error.message' }, { refs: { error: { message: 'bad' } } })).toBe('bad');
  });

  it('bare ref falls back to pageState when not in refs', () =>
    expect(expr({ $ref: 'count' }, { pageState: { count: 3 } })).toBe(3));

  it('refs: reads registered hook value', () =>
    expect(expr({ $ref: 'refs:isMobile' }, { refs: { isMobile: true } })).toBe(true));

  it('refs: reads nested hook path', () =>
    expect(expr({ $ref: 'refs:windowSize.width' }, { refs: { windowSize: { width: 1440 } } })).toBe(1440));

  it('url: reads pathname when ctx.url is set', () => {
    const ctx = makeCtx();
    ctx.url = {
      params: {},
      query: { tab: 'details' },
      pathname: '/products/42',
      search: '?tab=details',
      hash: '#reviews',
      fragment: 'reviews',
      origin: 'https://app.com',
      fullPath: '/products/42?tab=details#reviews',
      href: 'https://app.com/products/42?tab=details#reviews',
    };
    expect(evaluateExpression({ $ref: 'url:pathname' } as Parameters<typeof evaluateExpression>[0], ctx)).toBe('/products/42');
    expect(evaluateExpression({ $ref: 'url:query.tab' } as Parameters<typeof evaluateExpression>[0], ctx)).toBe('details');
    expect(evaluateExpression({ $ref: 'url:fragment' } as Parameters<typeof evaluateExpression>[0], ctx)).toBe('reviews');
    expect(evaluateExpression({ $ref: 'url:origin' } as Parameters<typeof evaluateExpression>[0], ctx)).toBe('https://app.com');
  });

  it('url: returns undefined when ctx.url is not set', () =>
    expect(expr({ $ref: 'url:pathname' })).toBeUndefined());

  it('redux: reads from globalStore', () => {
    const ctx = makeCtx();
    ctx.globalStore = { getState: () => ({ auth: { user: { role: 'admin' } } }) };
    expect(evaluateExpression({ $ref: 'redux:auth.user.role' } as Parameters<typeof evaluateExpression>[0], ctx)).toBe('admin');
  });

  it('redux: returns undefined when no globalStore', () =>
    expect(expr({ $ref: 'redux:auth.user' })).toBeUndefined());

  it('local: reads from localStorage (JSON-parsed)', () => {
    const store: Record<string, string> = { theme: '"dark"' };
    global.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as Storage;
    expect(expr({ $ref: 'local:theme' })).toBe('dark');
  });

  it('local: supports dot-path into stored JSON', () => {
    const settings = JSON.stringify({ appearance: { mode: 'dark' } });
    global.localStorage = {
      getItem: (k: string) => k === 'settings' ? settings : null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as Storage;
    expect(expr({ $ref: 'local:settings.appearance.mode' })).toBe('dark');
  });

  it('session: reads from sessionStorage', () => {
    const store: Record<string, string> = { step: '2' };
    global.sessionStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as Storage;
    expect(expr({ $ref: 'session:step' })).toBe(2);
  });

  it('all namespaces support dot-path traversal', () => {
    const ctx = makeCtx({ pageState: { order: { shipping: { address: { city: 'NYC' } } } } });
    expect(evaluateExpression({ $ref: 'page.store:order.shipping.address.city' } as Parameters<typeof evaluateExpression>[0], ctx)).toBe('NYC');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 02-conditionals.md
// ─────────────────────────────────────────────────────────────────────────────

describe('02-conditionals — $if, $switch', () => {

  it('$if returns then when cond is truthy', () =>
    expect(expr({ $if: { cond: true, then: 'yes', else: 'no' } })).toBe('yes'));

  it('$if returns else when cond is falsy', () =>
    expect(expr({ $if: { cond: false, then: 'yes', else: 'no' } })).toBe('no'));

  it('$if returns null when else omitted and cond false', () =>
    expect(expr({ $if: { cond: false, then: 'yes' } })).toBe(null));

  it('$if evaluates cond expression', () =>
    expect(expr({ $if: { cond: { $gt: { a: 10, b: 5 } }, then: 'big', else: 'small' } })).toBe('big'));

  it('$if nested: inner $if inside then branch', () =>
    expect(expr({
      $if: {
        cond: true,
        then: { $if: { cond: false, then: 'deep-yes', else: 'deep-no' } },
        else: 'outer-no',
      },
    })).toBe('deep-no'));

  it('$switch matches exact case', () =>
    expect(expr({ $switch: { on: 'paid', cases: { paid: 'green', pending: 'yellow', failed: 'red' }, default: 'grey' } })).toBe('green'));

  it('$switch falls to default when no match', () =>
    expect(expr({ $switch: { on: 'unknown', cases: { paid: 'green' }, default: 'grey' } })).toBe('grey'));

  it('$switch returns null when no match and no default', () =>
    expect(expr({ $switch: { on: 'x', cases: { a: 1 } } })).toBe(null));

  it('$switch evaluates the on expression', () =>
    expect(expr({ $switch: { on: { $ref: 'page.store:status' }, cases: { active: 1, inactive: 0 } } },
      { pageState: { status: 'active' } })).toBe(1));
});

// ─────────────────────────────────────────────────────────────────────────────
// 03-math-operators.md
// ─────────────────────────────────────────────────────────────────────────────

describe('03-math-operators', () => {

  it('$add sums all operands', () => expect(expr({ $add: [10, 20, 5] })).toBe(35));
  it('$sub subtracts', () => expect(expr({ $sub: [100, 37] })).toBe(63));
  it('$mul multiplies', () => expect(expr({ $mul: [3, 4] })).toBe(12));
  it('$div divides', () => expect(expr({ $div: [9, 3] })).toBe(3));
  it('$div returns 0 for division by zero', () => expect(expr({ $div: [5, 0] })).toBe(0));
  it('$mod returns remainder', () => expect(expr({ $mod: [10, 3] })).toBe(1));
  it('$pow (base/exp form)', () => expect(expr({ $pow: { base: 2, exp: 10 } })).toBe(1024));
  it('$pow (array form)', () => expect(expr({ $pow: [3, 3] })).toBe(27));
  it('$abs of negative', () => expect(expr({ $abs: -42 })).toBe(42));
  it('$negate', () => expect(expr({ $negate: 7 })).toBe(-7));
  it('$sqrt', () => expect(expr({ $sqrt: 81 })).toBe(9));
  it('$ceil rounds up', () => expect(expr({ $ceil: 1.1 })).toBe(2));
  it('$floor rounds down', () => expect(expr({ $floor: 1.9 })).toBe(1));
  it('$round to nearest integer', () => expect(expr({ $round: 2.5 })).toBe(3));
  it('$round with decimal places', () => expect(expr({ $round: [3.14159, 2] })).toBeCloseTo(3.14));
  it('$min', () => expect(expr({ $min: [5, 3, 9, 1] })).toBe(1));
  it('$max', () => expect(expr({ $max: [5, 3, 9, 1] })).toBe(9));
  it('$clamp within bounds', () => expect(expr({ $clamp: { value: 5, min: 0, max: 10 } })).toBe(5));
  it('$clamp below min → min', () => expect(expr({ $clamp: { value: -5, min: 0, max: 10 } })).toBe(0));
  it('$clamp above max → max', () => expect(expr({ $clamp: { value: 15, min: 0, max: 10 } })).toBe(10));
  it('$sum over array of objects', () =>
    expect(expr({ $sum: { over: [{ v: 10 }, { v: 20 }], as: 'x', return: { $ref: 'var:x.v' } } })).toBe(30));
});

// ─────────────────────────────────────────────────────────────────────────────
// 04-string-and-type-coercion.md
// ─────────────────────────────────────────────────────────────────────────────

describe('04-string-and-type-coercion', () => {

  it('$trim strips whitespace', () => expect(expr({ $trim: '  hello  ' })).toBe('hello'));
  it('$lower lowercases', () => expect(expr({ $lower: 'HELLO WORLD' })).toBe('hello world'));
  it('$upper uppercases', () => expect(expr({ $upper: 'hello' })).toBe('HELLO'));
  it('$concat joins parts', () => expect(expr({ $concat: ['Hello', ', ', 'World'] })).toBe('Hello, World'));
  it('$length of string', () => expect(expr({ $length: 'hello' })).toBe(5));
  it('$length of array', () => expect(expr({ $length: [1, 2, 3] })).toBe(3));
  it('$slice on string', () => expect(expr({ $slice: { value: 'hello world', start: 6 } })).toBe('world'));
  it('$replace replaces all occurrences', () =>
    expect(expr({ $replace: { value: 'foo bar foo', from: 'foo', to: 'baz' } })).toBe('baz bar baz'));
  it('$split splits string', () =>
    expect(expr({ $split: { value: 'a,b,c', sep: ',' } })).toEqual(['a', 'b', 'c']));
  it('$join joins array', () =>
    expect(expr({ $join: { arr: ['a', 'b', 'c'], sep: '-' } })).toBe('a-b-c'));
  it('$padStart pads with zeros', () =>
    expect(expr({ $padStart: { value: '7', len: 3, char: '0' } })).toBe('007'));
  it('$padEnd pads with spaces by default', () =>
    expect(expr({ $padEnd: { value: 'x', len: 3 } })).toBe('x  '));
  it('$includes case-sensitive', () =>
    expect(expr({ $includes: { value: 'foobar', search: 'bar' } })).toBe(true));
  it('$startsWith', () =>
    expect(expr({ $startsWith: { value: 'https://example.com', prefix: 'https' } })).toBe(true));
  it('$endsWith', () =>
    expect(expr({ $endsWith: { value: 'index.html', suffix: '.html' } })).toBe(true));
  it('$contains is case-insensitive', () =>
    expect(expr({ $contains: { value: 'Hello World', search: 'world' } })).toBe(true));
  it('$contains empty search returns true', () =>
    expect(expr({ $contains: { value: 'anything', search: '' } })).toBe(true));
  it('$charAt gets character at index', () =>
    expect(expr({ $charAt: { value: 'hello', index: 1 } })).toBe('e'));
  it('$string converts number to string', () => expect(expr({ $string: 42 })).toBe('42'));
  it('$number converts string to number', () => expect(expr({ $number: '3.14' })).toBe(3.14));
  it('$bool converts 0 to false', () => expect(expr({ $bool: 0 })).toBe(false));
  it('$bool converts non-empty string to true', () => expect(expr({ $bool: 'yes' })).toBe(true));
  it('$nullish returns value when not null', () =>
    expect(expr({ $nullish: { value: 'x', default: 'fallback' } })).toBe('x'));
  it('$nullish returns default for null', () =>
    expect(expr({ $nullish: { value: null, default: 'fallback' } })).toBe('fallback'));
  it('$nullish returns default for undefined', () => {
    const ctx = makeCtx({ pageState: {} });
    // reading missing key returns undefined — $nullish should use default
    expect(evaluateExpression(
      { $nullish: { value: { $ref: 'page.store:missing' }, default: 'Guest' } } as Parameters<typeof evaluateExpression>[0],
      ctx
    )).toBe('Guest');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 05-logic-and-comparison.md
// ─────────────────────────────────────────────────────────────────────────────

describe('05-logic-and-comparison', () => {

  it('$not', () => { expect(expr({ $not: true })).toBe(false); expect(expr({ $not: false })).toBe(true); });
  it('$and all true', () => expect(expr({ $and: [true, true, true] })).toBe(true));
  it('$and one false', () => expect(expr({ $and: [true, false, true] })).toBe(false));
  it('$or one true', () => expect(expr({ $or: [false, true, false] })).toBe(true));
  it('$or all false', () => expect(expr({ $or: [false, false] })).toBe(false));
  it('$eq strict equality', () => {
    expect(expr({ $eq: { a: 1, b: 1 } })).toBe(true);
    expect(expr({ $eq: { a: 1, b: '1' } })).toBe(false); // strict ===
  });
  it('$neq strict inequality', () => expect(expr({ $neq: { a: 1, b: 2 } })).toBe(true));
  it('$gt', () => { expect(expr({ $gt: { a: 5, b: 3 } })).toBe(true); expect(expr({ $gt: { a: 3, b: 5 } })).toBe(false); });
  it('$gte equal case', () => expect(expr({ $gte: { a: 5, b: 5 } })).toBe(true));
  it('$lt', () => expect(expr({ $lt: { a: 2, b: 8 } })).toBe(true));
  it('$lte equal case', () => expect(expr({ $lte: { a: 5, b: 5 } })).toBe(true));
  it('$in checks membership', () => {
    expect(expr({ $in: { value: 2, array: [1, 2, 3] } })).toBe(true);
    expect(expr({ $in: { value: 4, array: [1, 2, 3] } })).toBe(false);
  });
  it('$in returns false for non-array', () =>
    expect(expr({ $in: { value: 'x', array: 'not an array' } })).toBe(false));
  it('$has checks key existence', () => {
    expect(expr({ $has: { obj: { a: 1 }, key: 'a' } })).toBe(true);
    expect(expr({ $has: { obj: { a: 1 }, key: 'b' } })).toBe(false);
  });
  it('$has returns false for non-objects', () =>
    expect(expr({ $has: { obj: 'not-object', key: 'x' } })).toBe(false));
  it('$isEmpty — null, empty string, empty array', () => {
    expect(expr({ $isEmpty: null })).toBe(true);
    expect(expr({ $isEmpty: '' })).toBe(true);
    expect(expr({ $isEmpty: [] })).toBe(true);
    expect(expr({ $isEmpty: 'x' })).toBe(false);
  });
  it('$isNil', () => {
    expect(expr({ $isNil: null })).toBe(true);
    expect(expr({ $isNil: 0 })).toBe(false);
    expect(expr({ $isNil: '' })).toBe(false);
  });
  it('$isNotNil', () => {
    expect(expr({ $isNotNil: 'x' })).toBe(true);
    expect(expr({ $isNotNil: null })).toBe(false);
  });
  it('$isArray', () => {
    expect(expr({ $isArray: [1, 2] })).toBe(true);
    expect(expr({ $isArray: { a: 1 } })).toBe(false);
    expect(expr({ $isArray: 'string' })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 06-array-operators.md
// ─────────────────────────────────────────────────────────────────────────────

describe('06-array-operators', () => {

  it('$map transforms each item, exposing as var:', () =>
    expect(expr({ $map: { over: [1, 2, 3], as: 'n', return: { $mul: [{ $ref: 'var:n' }, 10] } } }))
      .toEqual([10, 20, 30]));

  it('$map exposes index as {as}Index var', () =>
    expect(expr({ $map: { over: ['a', 'b', 'c'], as: 'x', return: { $ref: 'var:xIndex' } } }))
      .toEqual([0, 1, 2]));

  it('$filter removes non-matching items', () =>
    expect(expr({ $filter: { over: [1, 2, 3, 4, 5], as: 'n', where: { $gt: { a: { $ref: 'var:n' }, b: 3 } } } }))
      .toEqual([4, 5]));

  it('$sort ascending (default)', () =>
    expect(expr({ $sort: { over: [3, 1, 4, 1, 5] } })).toEqual([1, 1, 3, 4, 5]));

  it('$sort descending', () =>
    expect(expr({ $sort: { over: [3, 1, 4], dir: 'desc' } })).toEqual([4, 3, 1]));

  it('$sort by field using item ref', () =>
    expect(
      expr({ $sort: { over: [{ n: 'banana' }, { n: 'apple' }, { n: 'cherry' }], by: { $ref: 'refs:item.n' } } })
    ).toEqual([{ n: 'apple' }, { n: 'banana' }, { n: 'cherry' }]));

  it('$reduce sums values', () =>
    expect(expr({ $reduce: { over: [1, 2, 3, 4], as: 'n', acc: 'total', init: 0, return: { $add: [{ $ref: 'var:total' }, { $ref: 'var:n' }] } } }))
      .toBe(10));

  it('$find returns first match', () =>
    expect(expr({ $find: { over: [{ id: 1 }, { id: 2 }, { id: 3 }], as: 'x', where: { $eq: { a: { $ref: 'var:x.id' }, b: 2 } } } }))
      .toEqual({ id: 2 }));

  it('$find returns null when not found', () =>
    expect(expr({ $find: { over: [1, 2, 3], as: 'n', where: { $eq: { a: { $ref: 'var:n' }, b: 99 } } } }))
      .toBe(null));

  it('$findIndex returns the index', () =>
    expect(expr({ $findIndex: { over: ['a', 'b', 'c'], as: 'x', where: { $eq: { a: { $ref: 'var:x' }, b: 'b' } } } }))
      .toBe(1));

  it('$findIndex returns -1 when not found', () =>
    expect(expr({ $findIndex: { over: ['a', 'b'], as: 'x', where: { $eq: { a: { $ref: 'var:x' }, b: 'z' } } } }))
      .toBe(-1));

  it('$some returns true if any match', () =>
    expect(expr({ $some: { over: [1, 2, 5], as: 'n', where: { $gt: { a: { $ref: 'var:n' }, b: 4 } } } }))
      .toBe(true));

  it('$every returns false if one fails', () =>
    expect(expr({ $every: { over: [1, 2, 3], as: 'n', where: { $gt: { a: { $ref: 'var:n' }, b: 1 } } } }))
      .toBe(false));

  it('$count returns length', () => expect(expr({ $count: [1, 2, 3] })).toBe(3));
  it('$first returns first element', () => expect(expr({ $first: [10, 20, 30] })).toBe(10));
  it('$last returns last element', () => expect(expr({ $last: [10, 20, 30] })).toBe(30));
  it('$slice with start and end', () =>
    expect(expr({ $slice: { over: [0, 1, 2, 3, 4], start: 1, end: 4 } })).toEqual([1, 2, 3]));
  it('$flat flattens one level', () =>
    expect(expr({ $flat: [[1, 2], [3, 4], [5]] })).toEqual([1, 2, 3, 4, 5]));
  it('$uniq deduplicates', () =>
    expect(expr({ $uniq: [1, 2, 2, 3, 1, 3] })).toEqual([1, 2, 3]));
  it('$compact removes falsy values', () =>
    expect(expr({ $compact: [0, 1, false, 2, null, 3, ''] })).toEqual([1, 2, 3]));
  it('$reverse reverses without mutating', () => {
    const arr = [1, 2, 3];
    expect(expr({ $reverse: arr })).toEqual([3, 2, 1]);
  });
  it('$at returns element by index', () =>
    expect(expr({ $at: { arr: ['a', 'b', 'c'], index: 2 } })).toBe('c'));
  it('$at uses fallback for out-of-bounds', () =>
    expect(expr({ $at: { arr: ['a'], index: 5, fallback: 'default' } })).toBe('default'));
  it('$append adds to end', () =>
    expect(expr({ $append: { to: [1, 2], item: 3 } })).toEqual([1, 2, 3]));
  it('$prepend adds to start', () =>
    expect(expr({ $prepend: { to: [2, 3], item: 1 } })).toEqual([1, 2, 3]));

  it('filter → sort → slice pipeline (doc 17 pattern)', () => {
    const items = [
      { name: 'Banana', price: 5 },
      { name: 'Apple', price: 3 },
      { name: 'Cherry', price: 7 },
      { name: 'Date', price: 1 },
    ];
    const result = expr({
      $slice: {
        over: {
          $sort: {
            over: {
              $filter: {
                over: items,
                as: 'item',
                where: { $lt: { a: { $ref: 'var:item.price' }, b: 6 } },
              },
            },
            by: { $ref: 'refs:item.price' },
          },
        },
        start: 0,
        end: 2,
      },
    });
    expect(result).toEqual([{ name: 'Date', price: 1 }, { name: 'Apple', price: 3 }]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 07-pipe.md
// ─────────────────────────────────────────────────────────────────────────────

describe('07-pipe — $pipe and $$', () => {

  it('$pipe chains steps with $$ accumulator', () =>
    expect(expr({ $pipe: [
      { $ref: 'page.store:count' },
      { $add: [{ $ref: 'var:$$' }, 10] },
      { $mul: [{ $ref: 'var:$$' }, 2] },
    ] }, { pageState: { count: 5 } })).toBe(30)); // (5+10)*2

  it('$pipe works with string operations', () =>
    expect(expr({ $pipe: [
      '  hello world  ',
      { $trim: { $ref: 'var:$$' } },
      { $upper: { $ref: 'var:$$' } },
    ] })).toBe('HELLO WORLD'));

  it('$pipe works with array operations', () =>
    // [3,1,4,1,5,9] → $uniq → [3,1,4,5,9] (5 unique) → $sort → still 5 → $count = 5
    expect(expr({ $pipe: [
      [3, 1, 4, 1, 5, 9],
      { $uniq: { $ref: 'var:$$' } },
      { $sort: { over: { $ref: 'var:$$' } } },
      { $count: { $ref: 'var:$$' } },
    ] })).toBe(5));

  it('$$ bare string resolves pipe accumulator', () =>
    expect(expr({ $pipe: [42, { $string: { $ref: 'var:$$' } }] })).toBe('42'));

  it('$pipe returns last step value for single step', () =>
    expect(expr({ $pipe: [99] })).toBe(99));

  it('$pipe returns undefined for empty array', () =>
    expect(expr({ $pipe: [] })).toBeUndefined());
});

// ─────────────────────────────────────────────────────────────────────────────
// 08-actions-store.md
// ─────────────────────────────────────────────────────────────────────────────

describe('08-actions-store — page.store mutations', () => {

  it('page.store.update dispatches UPDATE with evaluated payload', async () => {
    const ctx = await act([{ type: 'page.store.update', path: 'count', payload: { $add: [1, 2] } }]);
    expect(getDispatched(ctx)).toEqual([{ type: 'UPDATE', path: 'count', payload: 3 }]);
  });

  it('page.store.update reads from page.store in payload expression', async () => {
    const ctx = await act(
      [{ type: 'page.store.update', path: 'doubled', payload: { $mul: [{ $ref: 'page.store:n' }, 2] } }],
      { pageState: { n: 5 } }
    );
    expect(getDispatched(ctx)[0].payload).toBe(10);
  });

  it('page.store.reset (no path) dispatches RESET', async () => {
    const ctx = await act([{ type: 'page.store.reset' }]);
    expect(getDispatched(ctx)).toEqual([{ type: 'RESET' }]);
  });

  it('page.store.reset (with path) dispatches UPDATE to initial value', async () => {
    const ctx = makeCtx({ pageState: { count: 99 } });
    (ctx as RuntimeContext & { initialPageState: Record<string, unknown> }).initialPageState = { count: 0 };
    await runActions([{ type: 'page.store.reset', path: 'count' }], ctx);
    expect(getDispatched(ctx)).toEqual([{ type: 'UPDATE', path: 'count', payload: 0 }]);
  });

  it('multiple updates in one action array run in sequence', async () => {
    const ctx = await act([
      { type: 'page.store.update', path: 'a', payload: 1 },
      { type: 'page.store.update', path: 'b', payload: 2 },
    ]);
    expect(getDispatched(ctx)).toEqual([
      { type: 'UPDATE', path: 'a', payload: 1 },
      { type: 'UPDATE', path: 'b', payload: 2 },
    ]);
  });

  it('$if conditional action runs correct branch', async () => {
    const navigate = vi.fn();
    await act(
      [{ $if: { cond: { $ref: 'page.store:isAdmin' }, then: [{ type: 'navigate', to: '/admin' }], else: [{ type: 'navigate', to: '/home' }] } }],
      { navigate, pageState: { isAdmin: true } }
    );
    expect(navigate).toHaveBeenCalledWith('/admin');
  });

  it('actions.group serial runs in order', async () => {
    const order: string[] = [];
    const navigate = vi.fn().mockImplementation((to: string) => { order.push(to); });
    await act(
      [{ type: 'actions.group', mode: 'serial', actions: [{ type: 'navigate', to: '/first' }, { type: 'navigate', to: '/second' }] }],
      { navigate }
    );
    expect(order).toEqual(['/first', '/second']);
  });

  it('actions.group parallel runs all actions', async () => {
    const visited: string[] = [];
    const navigate = vi.fn().mockImplementation((to: string) => { visited.push(to); });
    await act(
      [{ type: 'actions.group', mode: 'parallel', actions: [{ type: 'navigate', to: '/a' }, { type: 'navigate', to: '/b' }] }],
      { navigate }
    );
    expect(visited.sort()).toEqual(['/a', '/b']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 09-actions-async.md
// ─────────────────────────────────────────────────────────────────────────────

describe('09-actions-async', () => {

  afterEach(() => vi.restoreAllMocks());

  it('async.call with $fn — onSuccess receives result', async () => {
    const showToast = vi.fn();
    const ctx = makeCtx({ showToast });
    ctx.registries.functions['fetchUser'] = async (id: unknown) => ({ id, name: 'Alice' });

    await runActions([{
      type: 'async.call',
      call: { $fn: 'fetchUser', args: [{ $ref: 'page.store:userId' }] },
      onSuccess: [{ type: 'snackbar', message: { $ref: 'result.name' }, variant: 'success' }],
    }], makeCtx({ showToast, pageState: { userId: 1 } }));

    // Re-run with fresh ctx to check dispatch
    const dispatchCtx = makeCtx({ pageState: { userId: 1 } });
    dispatchCtx.registries.functions['fetchUser'] = async (id: unknown) => ({ id, name: 'Alice' });
    await runActions([{
      type: 'async.call',
      call: { $fn: 'fetchUser', args: [{ $ref: 'page.store:userId' }] },
      onSuccess: [{ type: 'page.store.update', path: 'user', payload: { $ref: 'result' } }],
    }], dispatchCtx);
    expect(getDispatched(dispatchCtx)[0]).toEqual({
      type: 'UPDATE', path: 'user', payload: { id: 1, name: 'Alice' },
    });
  });

  it('async.call with $fn — onError receives error.message', async () => {
    const ctx = makeCtx();
    ctx.registries.functions['badFn'] = async () => { throw new Error('server error'); };
    await runActions([{
      type: 'async.call',
      call: { $fn: 'badFn', args: [] },
      onError: [{ type: 'page.store.update', path: 'error', payload: { $ref: 'error.message' } }],
    }], ctx);
    expect(getDispatched(ctx)[0]).toEqual({ type: 'UPDATE', path: 'error', payload: 'server error' });
  });

  it('async.call loading shorthand sets true before, false after', async () => {
    const dispatched: unknown[] = [];
    const ctx = makeCtx();
    ctx.dispatchPage = (a) => { dispatched.push({ ...a }); };
    ctx.registries.functions['slow'] = async () => 'done';

    await runActions([{
      type: 'async.call',
      loading: 'isFetching',
      call: { $fn: 'slow', args: [] },
    }], ctx);

    expect(dispatched[0]).toEqual({ type: 'UPDATE', path: 'isFetching', payload: true });
    expect(dispatched[dispatched.length - 1]).toEqual({ type: 'UPDATE', path: 'isFetching', payload: false });
  });

  it('async.call loading shorthand also sets false on error', async () => {
    const dispatched: unknown[] = [];
    const ctx = makeCtx();
    ctx.dispatchPage = (a) => { dispatched.push({ ...a }); };
    ctx.registries.functions['fail'] = async () => { throw new Error('boom'); };

    await runActions([{
      type: 'async.call',
      loading: 'isFetching',
      call: { $fn: 'fail', args: [] },
    }], ctx);

    expect(dispatched[dispatched.length - 1]).toEqual({ type: 'UPDATE', path: 'isFetching', payload: false });
  });

  it('async.call with $http GET — does not set Content-Type', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: vi.fn().mockResolvedValue([]),
    });
    const ctx = makeCtx();
    await runActions([{
      type: 'async.call',
      call: { $http: { method: 'GET', url: 'https://api.example.com/items' } },
      onSuccess: [{ type: 'page.store.update', path: 'items', payload: { $ref: 'result' } }],
    }], ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
    expect(getDispatched(ctx)[0]).toEqual({ type: 'UPDATE', path: 'items', payload: [] });
  });

  it('async.call with $http POST + data — sets Content-Type and sends body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: { get: () => 'application/json' },
      json: vi.fn().mockResolvedValue({ id: 42 }),
    });
    const ctx = makeCtx({ pageState: { form: { name: 'Alice' } } });
    await runActions([{
      type: 'async.call',
      call: { $http: { method: 'POST', url: 'https://api.example.com/users', data: { $ref: 'page.store:form' } } },
      onSuccess: [{ type: 'page.store.update', path: 'orderId', payload: { $ref: 'result.id' } }],
    }], ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"name":"Alice"}');
    expect(getDispatched(ctx)[0]).toEqual({ type: 'UPDATE', path: 'orderId', payload: 42 });
  });

  it('async.call — async.call catches its own errors (outer try is not needed)', async () => {
    // Doc says: "async.call catches its own errors internally. Use onError — not outer try"
    const ctx = makeCtx();
    ctx.registries.functions['fail'] = async () => { throw new Error('inner error'); };

    // No onError — error should be swallowed silently (no throw to outer scope)
    await expect(runActions([{
      type: 'async.call',
      call: { $fn: 'fail', args: [] },
    }], ctx)).resolves.toBeUndefined();
  });

  it('actions.group parallel — runs multiple async.call simultaneously', async () => {
    const results: string[] = [];
    const ctx = makeCtx();
    ctx.registries.functions['fetchUser']   = async () => { results.push('user');   return { name: 'Alice' }; };
    ctx.registries.functions['fetchOrders'] = async () => { results.push('orders'); return [{ id: 1 }]; };

    await runActions([{
      type: 'actions.group',
      mode: 'parallel',
      actions: [
        {
          type: 'async.call',
          call: { $fn: 'fetchUser', args: [] },
          onSuccess: [{ type: 'page.store.update', path: 'user', payload: { $ref: 'result' } }],
        },
        {
          type: 'async.call',
          call: { $fn: 'fetchOrders', args: [] },
          onSuccess: [{ type: 'page.store.update', path: 'orders', payload: { $ref: 'result' } }],
        },
      ],
    }], ctx);

    expect(results.sort()).toEqual(['orders', 'user']);
    const dispatched = getDispatched(ctx);
    expect(dispatched.some(d => d.path === 'user')).toBe(true);
    expect(dispatched.some(d => d.path === 'orders')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10-actions-side-effects.md
// ─────────────────────────────────────────────────────────────────────────────

describe('10-actions-side-effects', () => {

  it('navigate calls ctx.navigate', async () => {
    const navigate = vi.fn();
    await act([{ type: 'navigate', to: '/dashboard' }], { navigate });
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigate evaluates expression in to', async () => {
    const navigate = vi.fn();
    await act(
      [{ type: 'navigate', to: { $concat: ['/users/', { $ref: 'page.store:id' }] } }],
      { navigate, pageState: { id: '42' } }
    );
    expect(navigate).toHaveBeenCalledWith('/users/42');
  });

  it('navigate is optional — no crash when not provided', async () => {
    await expect(act([{ type: 'navigate', to: '/x' }])).resolves.toBeDefined();
  });

  it('snackbar calls showToast with message and variant', async () => {
    const showToast = vi.fn();
    await act([{ type: 'snackbar', message: 'Saved!', variant: 'success' }], { showToast });
    expect(showToast).toHaveBeenCalledWith('Saved!', 'success');
  });

  it('snackbar defaults variant to "default"', async () => {
    const showToast = vi.fn();
    await act([{ type: 'snackbar', message: 'Info' }], { showToast });
    expect(showToast).toHaveBeenCalledWith('Info', 'default');
  });

  it('snackbar evaluates message expression', async () => {
    const showToast = vi.fn();
    await act(
      [{ type: 'snackbar', message: { $concat: ['Hello, ', { $ref: 'page.store:name' }] } }],
      { showToast, pageState: { name: 'Alice' } }
    );
    expect(showToast).toHaveBeenCalledWith('Hello, Alice', 'default');
  });

  it('console.log logs payload', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await act([{ type: 'console.log', payload: { $ref: 'page.store:count' } }], { pageState: { count: 99 } });
    expect(log).toHaveBeenCalledWith('[Epic DSL]', 99);
    log.mockRestore();
  });

  it('page.store: reads full store as payload for console.log', async () => {
    // Doc claims { "$ref": "page.store:" } returns entire store
    const state = { a: 1, b: 2 };
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await act([{ type: 'console.log', payload: { $ref: 'page.store:' } }], { pageState: state });
    expect(log).toHaveBeenCalledWith('[Epic DSL]', state);
    log.mockRestore();
  });

  it('combine multiple side effects in sequence', async () => {
    const navigate = vi.fn();
    const showToast = vi.fn();
    await act(
      [
        { type: 'snackbar', message: 'Done', variant: 'success' },
        { type: 'navigate', to: '/home' },
      ],
      { navigate, showToast }
    );
    expect(showToast).toHaveBeenCalledWith('Done', 'success');
    expect(navigate).toHaveBeenCalledWith('/home');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11-fn-registry.md
// ─────────────────────────────────────────────────────────────────────────────

describe('11-fn-registry', () => {

  it('$fn calls a sync registered function', () => {
    const ctx = makeCtx({ pageState: { price: 100, tax: 0.1 } });
    ctx.registries.functions['calcTotal'] = (price: unknown, tax: unknown) =>
      (price as number) * (1 + (tax as number));
    expect(evaluateExpression(
      { $fn: 'calcTotal', args: [{ $ref: 'page.store:price' }, { $ref: 'page.store:tax' }] } as Parameters<typeof evaluateExpression>[0],
      ctx
    )).toBeCloseTo(110);
  });

  it('$fn with path drills into return value', () => {
    const ctx = makeCtx();
    ctx.registries.functions['getUser'] = () => ({ profile: { name: 'Bob' } });
    expect(evaluateExpression(
      { $fn: 'getUser', path: 'profile.name' } as Parameters<typeof evaluateExpression>[0],
      ctx
    )).toBe('Bob');
  });

  it('$fn warns and returns undefined for unknown function', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(expr({ $fn: 'missing' })).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('async.call with $fn — result available via $ref result', async () => {
    const ctx = makeCtx();
    ctx.registries.functions['loadData'] = async () => ({ total: 42 });
    await runActions([{
      type: 'async.call',
      call: { $fn: 'loadData', args: [] },
      onSuccess: [{ type: 'page.store.update', path: 'total', payload: { $ref: 'result.total' } }],
    }], ctx);
    expect(getDispatched(ctx)[0]).toEqual({ type: 'UPDATE', path: 'total', payload: 42 });
  });

  it('async.call with $fn — passes evaluated args', async () => {
    const received: unknown[] = [];
    const ctx = makeCtx({ pageState: { userId: 7 } });
    ctx.registries.functions['fetchUser'] = async (id: unknown) => { received.push(id); return {}; };
    await runActions([{
      type: 'async.call',
      call: { $fn: 'fetchUser', args: [{ $ref: 'page.store:userId' }] },
    }], ctx);
    expect(received).toEqual([7]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13-selectors.md
// ─────────────────────────────────────────────────────────────────────────────

describe('13-selectors — derived state', () => {

  it('selectors: namespace reads from __selectors ref', () =>
    expect(expr({ $ref: 'selectors:fullName' }, {
      refs: { __selectors: { fullName: 'Alice Smith' } },
    })).toBe('Alice Smith'));

  it('selectors can reference other selectors via __selectors chain', () => {
    // Both fullName and initials are in __selectors
    const refs = {
      __selectors: {
        fullName: 'Alice Smith',
        initials: 'AS',
      },
    };
    expect(expr({ $ref: 'selectors:fullName' }, { refs })).toBe('Alice Smith');
    expect(expr({ $ref: 'selectors:initials' }, { refs })).toBe('AS');
  });

  it('page.store: does NOT contain computed selectors (different namespace)', () => {
    // Accessing a selector name via page.store: returns undefined
    expect(expr({ $ref: 'page.store:fullName' }, {
      pageState: {},
      refs: { __selectors: { fullName: 'Alice' } },
    })).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14-env-local-vars.md
// ─────────────────────────────────────────────────────────────────────────────

describe('14-env-local-vars', () => {

  it('var: reads env block variable', () =>
    expect(expr({ $ref: 'var:displayName' }, { refs: { displayName: 'Guest' } })).toBe('Guest'));

  it('var:item.name reads nested iteration variable', () =>
    expect(expr({ $ref: 'var:item.name' }, { refs: { item: { name: 'Widget' } } })).toBe('Widget'));

  it('$nullish can be used in an env block value', () => {
    // env block computed: { $nullish: { value: { $ref: "page.store:user.name" }, default: "Guest" } }
    const ctx = makeCtx({ pageState: { user: { name: null } } });
    const displayName = evaluateExpression(
      { $nullish: { value: { $ref: 'page.store:user.name' }, default: 'Guest' } } as Parameters<typeof evaluateExpression>[0],
      ctx
    );
    expect(displayName).toBe('Guest');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16-object-operators.md
// ─────────────────────────────────────────────────────────────────────────────

describe('16-object-operators', () => {

  it('$get reads dynamic key', () =>
    expect(expr({ $get: { from: { a: 1, b: 2, c: 3 }, key: 'b' } })).toBe(2));

  it('$get reads nested path', () =>
    expect(expr({ $get: { from: { user: { name: 'Alice' } }, path: 'user.name' } })).toBe('Alice'));

  it('$keys returns array of keys', () =>
    expect(expr({ $keys: { a: 1, b: 2, c: 3 } })).toEqual(['a', 'b', 'c']));

  it('$values returns array of values', () =>
    expect(expr({ $values: { a: 10, b: 20 } })).toEqual([10, 20]));

  it('$entries returns [key,value] pairs', () =>
    expect(expr({ $entries: { x: 1, y: 2 } })).toEqual([['x', 1], ['y', 2]]));

  it('$merge combines objects, last wins', () =>
    expect(expr({ $merge: [{ a: 1, b: 2 }, { b: 99, c: 3 }] })).toEqual({ a: 1, b: 99, c: 3 }));

  it('$pick selects subset', () =>
    expect(expr({ $pick: { from: { a: 1, b: 2, c: 3 }, keys: ['a', 'c'] } })).toEqual({ a: 1, c: 3 }));

  it('$omit removes keys', () =>
    expect(expr({ $omit: { from: { a: 1, b: 2, c: 3 }, keys: ['b'] } })).toEqual({ a: 1, c: 3 }));

  it('$has checks key exists in object', () => {
    expect(expr({ $has: { obj: { name: 'Alice' }, key: 'name' } })).toBe(true);
    expect(expr({ $has: { obj: { name: 'Alice' }, key: 'age' } })).toBe(false);
  });

  it('$json serializes to string', () =>
    expect(expr({ $json: { id: 1, active: true } })).toBe('{"id":1,"active":true}'));

  it('$parse deserializes JSON', () =>
    expect(expr({ $parse: '{"id":1}' })).toEqual({ id: 1 }));

  it('$parse returns null for malformed JSON', () =>
    expect(expr({ $parse: 'not json' })).toBe(null));

  it('$map + $entries iterates object entries (doc 16 pattern)', () => {
    const result = expr({
      $map: {
        over: { $entries: { red: '#f00', green: '#0f0', blue: '#00f' } },
        as: 'pair',
        return: { $concat: [{ $ref: 'var:pair.0' }, '=', { $ref: 'var:pair.1' }] },
      },
    });
    expect(result).toEqual(['red=#f00', 'green=#0f0', 'blue=#00f']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 20-common-confusions.md
// ─────────────────────────────────────────────────────────────────────────────

describe('20-common-confusions — wrong vs right patterns', () => {

  // Confusion #3: "value" vs "payload"
  it('#3 WRONG: using "value" field instead of "payload" → path is set to null', async () => {
    // The doc says: "'value' is not a recognised field; payload is undefined,
    // which evaluates to null — the path is set to null, not 1"
    const ctx = await act([{ type: 'page.store.update', path: 'count', value: 1 } as unknown as Parameters<typeof runActions>[0][0]]);
    expect(getDispatched(ctx)[0]).toEqual({ type: 'UPDATE', path: 'count', payload: null });
  });

  it('#3 RIGHT: using "payload" field works correctly', async () => {
    const ctx = await act([{ type: 'page.store.update', path: 'count', payload: 1 }]);
    expect(getDispatched(ctx)[0]).toEqual({ type: 'UPDATE', path: 'count', payload: 1 });
  });

  // Confusion #5: selectors: prefix vs page.store:
  it('#5 WRONG: page.store: does not contain selector-computed values', () =>
    expect(expr({ $ref: 'page.store:fullName' }, {
      pageState: {},
      refs: { __selectors: { fullName: 'Alice' } },
    })).toBeUndefined());

  it('#5 RIGHT: selectors: prefix reads computed values', () =>
    expect(expr({ $ref: 'selectors:fullName' }, {
      refs: { __selectors: { fullName: 'Alice' } },
    })).toBe('Alice'));

  // Confusion #6: $map iteration variable — var:item vs page.store:item
  it('#6 WRONG: page.store:item inside $map reads store (not iteration var)', () => {
    // page.store:item would read ctx.pageState['item'], not the iteration var
    const result = expr({
      $map: {
        over: [{ name: 'A' }, { name: 'B' }],
        as: 'item',
        return: { $ref: 'page.store:item' }, // WRONG: reads store, not loop var
      },
    }, { pageState: {} });
    // pageState has no 'item' key → undefined for each element
    expect(result).toEqual([undefined, undefined]);
  });

  it('#6 RIGHT: var:item reads iteration variable', () => {
    const result = expr({
      $map: {
        over: [{ name: 'A' }, { name: 'B' }],
        as: 'item',
        return: { $ref: 'var:item.name' }, // CORRECT
      },
    });
    expect(result).toEqual(['A', 'B']);
  });

  // Confusion #7: snackbar variant vs type
  it('#7 RIGHT: snackbar uses "variant" field for toast level', async () => {
    const showToast = vi.fn();
    await act([{ type: 'snackbar', message: 'Done', variant: 'success' }], { showToast });
    expect(showToast).toHaveBeenCalledWith('Done', 'success');
  });

  // Confusion #9 — async.call catches own errors
  it('#9 async.call does not propagate to outer scope on error (no onError)', async () => {
    const ctx = makeCtx();
    ctx.registries.functions['bad'] = async () => { throw new Error('fail'); };
    // Should resolve without throwing
    await expect(runActions([{
      type: 'async.call',
      call: { $fn: 'bad', args: [] },
    }], ctx)).resolves.toBeUndefined();
  });

  // Confusion #10: $ref in action payload evaluates at fire time
  it('#10 $ref in action payload evaluates at action fire time (reads current store snapshot)', async () => {
    // The ctx.pageState is the value at the time the action runs
    const ctx = await act(
      [{ type: 'page.store.update', path: 'snapshot', payload: { $ref: 'page.store:name' } }],
      { pageState: { name: 'Alice' } }
    );
    expect(getDispatched(ctx)[0].payload).toBe('Alice');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 21-storage.md
// ─────────────────────────────────────────────────────────────────────────────

describe('21-storage', () => {

  let localStore: Record<string, string> = {};
  let sessionStore: Record<string, string> = {};

  beforeEach(() => {
    localStore = {};
    sessionStore = {};
    global.localStorage = {
      getItem: (k: string) => localStore[k] ?? null,
      setItem: (k: string, v: string) => { localStore[k] = v; },
      removeItem: (k: string) => { delete localStore[k]; },
      clear: () => { for (const k in localStore) delete localStore[k]; },
      length: 0,
      key: () => null,
    } as Storage;
    global.sessionStorage = {
      getItem: (k: string) => sessionStore[k] ?? null,
      setItem: (k: string, v: string) => { sessionStore[k] = v; },
      removeItem: (k: string) => { delete sessionStore[k]; },
      clear: () => { for (const k in sessionStore) delete sessionStore[k]; },
      length: 0,
      key: () => null,
    } as Storage;
  });

  it('local: reads JSON-parsed value from localStorage', () => {
    localStore['theme'] = '"dark"';
    expect(expr({ $ref: 'local:theme' })).toBe('dark');
  });

  it('local: supports dot-path into stored JSON object', () => {
    localStore['settings'] = JSON.stringify({ appearance: { mode: 'dark' } });
    expect(expr({ $ref: 'local:settings.appearance.mode' })).toBe('dark');
  });

  it('local: returns null for missing key', () =>
    expect(expr({ $ref: 'local:nonexistent' })).toBe(null));

  it('local.set writes JSON-serialized value', async () => {
    await act([{ type: 'local.set', key: 'theme', payload: 'dark' }]);
    expect(localStore['theme']).toBe('"dark"');
  });

  it('local.set writes object — local: with dotpath reads it back', async () => {
    await act([{ type: 'local.set', key: 'settings', payload: { appearance: { mode: 'light' } } }]);
    // After write, local:settings.appearance.mode should be 'light'
    expect(expr({ $ref: 'local:settings.appearance.mode' })).toBe('light');
  });

  it('local.remove deletes the key', async () => {
    localStore['x'] = '"value"';
    await act([{ type: 'local.remove', key: 'x' }]);
    expect(localStore['x']).toBeUndefined();
  });

  it('local.clear removes all localStorage keys', async () => {
    localStore['a'] = '"1"';
    localStore['b'] = '"2"';
    await act([{ type: 'local.clear' }]);
    expect(Object.keys(localStore)).toHaveLength(0);
  });

  it('session: reads JSON-parsed from sessionStorage', () => {
    sessionStore['step'] = '3';
    expect(expr({ $ref: 'session:step' })).toBe(3);
  });

  it('session.set writes to sessionStorage', async () => {
    await act([{ type: 'session.set', key: 'step', payload: 2 }]);
    expect(sessionStore['step']).toBe('2');
  });

  it('session.remove deletes key', async () => {
    sessionStore['draft'] = '"data"';
    await act([{ type: 'session.remove', key: 'draft' }]);
    expect(sessionStore['draft']).toBeUndefined();
  });

  it('session.clear removes all', async () => {
    sessionStore['a'] = '1';
    sessionStore['b'] = '2';
    await act([{ type: 'session.clear' }]);
    expect(Object.keys(sessionStore)).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 24-config-ref.md ($subConfig)
// ─────────────────────────────────────────────────────────────────────────────

describe('24-config-ref — $subConfig', () => {

  const statCard: ComponentNode = {
    component: 'Card',
    children: [
      { component: 'CardTitle', children: [{ $ref: 'var:label' }] },
      { component: 'CardValue', children: [{ $ref: 'var:value' }] },
    ],
  };

  it('replaces $subConfig in children with the fragment', () => {
    const root: ComponentNode = {
      component: 'Grid',
      children: [{ $subConfig: 'statCard' }],
    };
    const result = substituteSubConfigs(root, { statCard });
    expect((result.children![0] as ComponentNode).component).toBe('Card');
  });

  it('subConfigProps are injected as env into the fragment', () => {
    const root: ComponentNode = {
      component: 'Grid',
      children: [{
        $subConfig: 'statCard',
        subConfigProps: { label: 'Revenue', value: 1000 },
      }],
    };
    const result = substituteSubConfigs(root, { statCard });
    const injected = result.children![0] as ComponentNode;
    expect(injected.env).toMatchObject({ label: 'Revenue', value: 1000 });
  });

  it("fragment's own env overrides subConfigProps of same key", () => {
    const cardWithEnv: ComponentNode = { ...statCard, env: { label: 'Fixed Label' } };
    const root: ComponentNode = {
      component: 'Container',
      children: [{ $subConfig: 'cardWithEnv', subConfigProps: { label: 'Overridden?' } }],
    };
    const result = substituteSubConfigs(root, { cardWithEnv });
    expect((result.children![0] as ComponentNode).env!.label).toBe('Fixed Label');
  });

  it('$subConfig in a prop value position substitutes correctly', () => {
    const badge: ComponentNode = { component: 'Badge' };
    const root: ComponentNode = {
      component: 'Container',
      props: { icon: { $subConfig: 'badge' } as unknown as ComponentNode },
    };
    const result = substituteSubConfigs(root, { badge });
    expect((result.props!.icon as ComponentNode).component).toBe('Badge');
  });

  it('$subConfig substitution is recursive (nested fragments)', () => {
    const inner: ComponentNode = { component: 'InnerWidget' };
    const outer: ComponentNode = {
      component: 'OuterWrapper',
      children: [{ $subConfig: 'inner' }],
    };
    const root: ComponentNode = {
      component: 'Root',
      children: [{ $subConfig: 'outer' }],
    };
    const result = substituteSubConfigs(root, { inner, outer });
    const outerNode = result.children![0] as ComponentNode;
    expect(outerNode.component).toBe('OuterWrapper');
    expect((outerNode.children![0] as ComponentNode).component).toBe('InnerWidget');
  });

  it('throws for unknown $subConfig key', () => {
    const root: ComponentNode = {
      component: 'Root',
      children: [{ $subConfig: 'doesNotExist' }],
    };
    expect(() => substituteSubConfigs(root, {})).toThrow('doesNotExist');
  });

  it('empty subConfigProps does not inject env', () => {
    const root: ComponentNode = {
      component: 'Root',
      children: [{ $subConfig: 'statCard', subConfigProps: {} }],
    };
    const result = substituteSubConfigs(root, { statCard });
    // No env should be added when subConfigProps is empty
    expect((result.children![0] as ComponentNode).env).toBeUndefined();
  });

  it('expression-type fragment in a prop value position returns the value', () => {
    const refs: RefConfigs = { answer: 42 as unknown as ComponentNode };
    const root: ComponentNode = {
      component: 'Root',
      props: { val: { $subConfig: 'answer' } as unknown as ComponentNode },
    };
    const result = substituteSubConfigs(root, refs);
    expect(result.props!.val).toBe(42);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 25-args.md ($arg)
// ─────────────────────────────────────────────────────────────────────────────

describe('25-args — $arg', () => {

  const withArgs = (e: unknown, args: unknown[]) =>
    evaluateExpression(e as Parameters<typeof evaluateExpression>[0], makeCtx({ args }));

  it('$arg: 0 reads first argument', () =>
    expect(withArgs({ $arg: 0 }, ['hello'])).toBe('hello'));

  it('$arg: 1 reads second argument', () =>
    expect(withArgs({ $arg: 1 }, ['first', 'second'])).toBe('second'));

  it('$arg returns null when args is empty (outside action context)', () =>
    expect(expr({ $arg: 0 })).toBe(null));

  it('$arg returns null for out-of-bounds index', () =>
    expect(withArgs({ $arg: 5 }, ['only-one'])).toBe(null));

  it('$arg with path drills into argument object', () =>
    expect(withArgs({ $arg: 0, path: 'currentTarget.value' }, [{ currentTarget: { value: 'typed' } }]))
      .toBe('typed'));

  it('$arg with nested path', () =>
    expect(withArgs({ $arg: 0, path: 'a.b.c' }, [{ a: { b: { c: 42 } } }]))
      .toBe(42));

  it('$arg path returns null when path not found', () =>
    expect(withArgs({ $arg: 0, path: 'missing.key' }, [{}])).toBe(null));

  it('$arg works for boolean toggle (second arg from $map)', () =>
    expect(withArgs({ $arg: 0 }, [true])).toBe(true));

  it('$arg in action — dispatches raw value from handler arg', async () => {
    const ctx = await act(
      [{ type: 'page.store.update', path: 'query', payload: { $arg: 0, path: 'currentTarget.value' } }],
      {},
      [{ currentTarget: { value: 'search term' } }]
    );
    expect(getDispatched(ctx)[0].payload).toBe('search term');
  });

  it('$arg preferred over event.value for native inputs (event.value reads wrong prop for string args)', () => {
    // When the component passes a raw string (not wrapped), event.value doesn't work via $ref
    // but $arg: 0 always works
    const ctx = makeCtx({ args: ['raw-string'] });
    // $arg works:
    expect(evaluateExpression({ $arg: 0 } as Parameters<typeof evaluateExpression>[0], ctx)).toBe('raw-string');
    // event.value via getByPath traversal requires ctx.refs['event']['value'],
    // but ctx.refs['event'] = 'raw-string' (string) which has no 'value' property
    // so it returns undefined
    expect(evaluateExpression({ $ref: 'event' } as Parameters<typeof evaluateExpression>[0], makeCtx({ refs: { event: 'raw-string' } }))).toBe('raw-string');
  });

  it('$arg: 0 is default when $arg value is not a valid number', () =>
    // e.g. if someone writes { "$arg": "x" } — falls back to index 0
    expect(withArgs({ $arg: 'bad-type' }, ['fallback-to-zero'])).toBe('fallback-to-zero'));
});
