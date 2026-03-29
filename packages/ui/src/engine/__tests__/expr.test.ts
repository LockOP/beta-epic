import { describe, it, expect, vi } from 'vitest';
import { evaluateExpression } from '../compiler/expr';
import { makeCtx } from './setup';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const e = (expr: unknown, overrides = {}) =>
  evaluateExpression(expr as Parameters<typeof evaluateExpression>[0], makeCtx(overrides));

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

describe('primitives', () => {
  it('returns null as-is', () => expect(e(null)).toBe(null));
  it('returns boolean as-is', () => { expect(e(true)).toBe(true); expect(e(false)).toBe(false); });
  it('returns number as-is', () => { expect(e(0)).toBe(0); expect(e(42)).toBe(42); expect(e(-1.5)).toBe(-1.5); });
  it('returns string as-is', () => { expect(e('hello')).toBe('hello'); expect(e('')).toBe(''); });
  it('evaluates array elements', () => expect(e([1, 'x', null])).toEqual([1, 'x', null]));
});

// ─────────────────────────────────────────────────────────────────────────────
// $ref
// ─────────────────────────────────────────────────────────────────────────────

describe('$ref', () => {
  it('page.store: reads top-level key', () =>
    expect(e({ $ref: 'page.store:count' }, { pageState: { count: 7 } })).toBe(7));

  it('page.store: reads nested path', () =>
    expect(e({ $ref: 'page.store:user.name' }, { pageState: { user: { name: 'Alice' } } })).toBe('Alice'));

  it('page.store: empty path returns full state', () => {
    const state = { a: 1, b: 2 };
    expect(e({ $ref: 'page.store:' }, { pageState: state })).toEqual(state);
  });

  it('selectors: reads from __selectors ref', () =>
    expect(e({ $ref: 'selectors:total' }, { refs: { __selectors: { total: 99 } } })).toBe(99));

  it('var: reads iteration variable', () =>
    expect(e({ $ref: 'var:item' }, { refs: { item: 'apple' } })).toBe('apple'));

  it('var: reads nested path', () =>
    expect(e({ $ref: 'var:user.name' }, { refs: { user: { name: 'Bob' } } })).toBe('Bob'));

  it('refs: reads registered hook value', () =>
    expect(e({ $ref: 'refs:isMobile' }, { refs: { isMobile: true } })).toBe(true));

  it('bare ref falls through to refs first', () =>
    expect(e({ $ref: 'result' }, { refs: { result: 42 } })).toBe(42));

  it('bare ref falls through to pageState if not in refs', () =>
    expect(e({ $ref: 'count' }, { pageState: { count: 5 } })).toBe(5));

  it('$$ bare string resolves from refs', () =>
    expect(evaluateExpression('$$', makeCtx({ refs: { '$$': 'pipe-acc' } }))).toBe('pipe-acc'));
});

// ─────────────────────────────────────────────────────────────────────────────
// $arg
// ─────────────────────────────────────────────────────────────────────────────

describe('$arg', () => {
  it('reads first arg by index 0', () =>
    expect(e({ $arg: 0 }, { args: ['hello'] })).toBe('hello'));

  it('reads second arg by index 1', () =>
    expect(e({ $arg: 1 }, { args: ['a', 'b'] })).toBe('b'));

  it('returns null when args is empty', () =>
    expect(e({ $arg: 0 }, {})).toBe(null));

  it('reads dot-path into arg', () =>
    expect(e({ $arg: 0, path: 'currentTarget.value' }, {
      args: [{ currentTarget: { value: 'typed text' } }],
    })).toBe('typed text'));

  it('returns null when path not found in arg', () =>
    expect(e({ $arg: 0, path: 'missing.key' }, { args: [{}] })).toBe(null));

  it('defaults to index 0 when $arg is not a number', () =>
    expect(e({ $arg: 'bad' }, { args: ['first'] })).toBe('first'));
});

// ─────────────────────────────────────────────────────────────────────────────
// $fn
// ─────────────────────────────────────────────────────────────────────────────

describe('$fn', () => {
  it('calls a registered sync function with args', () => {
    const ctx = makeCtx({ pageState: { x: 3 } });
    ctx.registries.functions['double'] = (n: unknown) => (n as number) * 2;
    const result = evaluateExpression(
      { $fn: 'double', args: [{ $ref: 'page.store:x' }] },
      ctx
    );
    expect(result).toBe(6);
  });

  it('drills path into return value', () => {
    const ctx = makeCtx();
    ctx.registries.functions['getObj'] = () => ({ items: [1, 2, 3] });
    const result = evaluateExpression({ $fn: 'getObj', path: 'items.1' }, ctx);
    expect(result).toBe(2);
  });

  it('warns and returns undefined for unknown $fn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = e({ $fn: 'nope' });
    expect(result).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// $pipe
// ─────────────────────────────────────────────────────────────────────────────

describe('$pipe', () => {
  it('threads $$ accumulator through steps', () =>
    expect(e({ $pipe: [5, { $add: [{ $ref: 'var:$$' }, 3] }, { $mul: [{ $ref: 'var:$$' }, 2] }] })).toBe(16));

  it('returns undefined from empty pipe', () =>
    expect(e({ $pipe: [] })).toBeUndefined());
});

// ─────────────────────────────────────────────────────────────────────────────
// $if
// ─────────────────────────────────────────────────────────────────────────────

describe('$if', () => {
  it('returns then when cond is truthy', () =>
    expect(e({ $if: { cond: true, then: 'yes', else: 'no' } })).toBe('yes'));

  it('returns else when cond is falsy', () =>
    expect(e({ $if: { cond: false, then: 'yes', else: 'no' } })).toBe('no'));

  it('returns null when else is omitted and cond is false', () =>
    expect(e({ $if: { cond: false, then: 'yes' } })).toBe(null));

  it('evaluates nested expressions in branches', () =>
    expect(e({ $if: { cond: { $gt: { a: 5, b: 3 } }, then: 'big', else: 'small' } })).toBe('big'));
});

// ─────────────────────────────────────────────────────────────────────────────
// $switch
// ─────────────────────────────────────────────────────────────────────────────

describe('$switch', () => {
  const sw = (val: unknown) => e({
    $switch: {
      on: val,
      cases: { paid: 'green', pending: 'yellow', failed: 'red' },
      default: 'grey',
    },
  });

  it('matches a case', () => expect(sw('paid')).toBe('green'));
  it('uses default for unmatched', () => expect(sw('unknown')).toBe('grey'));
  it('returns null when no default and unmatched', () =>
    expect(e({ $switch: { on: 'x', cases: { a: 1 } } })).toBe(null));
});

// ─────────────────────────────────────────────────────────────────────────────
// Logic
// ─────────────────────────────────────────────────────────────────────────────

describe('logic', () => {
  it('$not negates', () => { expect(e({ $not: true })).toBe(false); expect(e({ $not: false })).toBe(true); });
  it('$and — all true', () => expect(e({ $and: [true, true, true] })).toBe(true));
  it('$and — one false', () => expect(e({ $and: [true, false, true] })).toBe(false));
  it('$or — one true', () => expect(e({ $or: [false, true, false] })).toBe(true));
  it('$or — all false', () => expect(e({ $or: [false, false] })).toBe(false));
  it('$in — value in array', () => expect(e({ $in: { value: 2, array: [1, 2, 3] } })).toBe(true));
  it('$in — value not in array', () => expect(e({ $in: { value: 4, array: [1, 2, 3] } })).toBe(false));
  it('$has — key exists', () => expect(e({ $has: { obj: { a: 1 }, key: 'a' } })).toBe(true));
  it('$has — key missing', () => expect(e({ $has: { obj: { a: 1 }, key: 'b' } })).toBe(false));
});

// ─────────────────────────────────────────────────────────────────────────────
// Type checks
// ─────────────────────────────────────────────────────────────────────────────

describe('type checks', () => {
  it('$isEmpty — empty string', () => expect(e({ $isEmpty: '' })).toBe(true));
  it('$isEmpty — null', () => expect(e({ $isEmpty: null })).toBe(true));
  it('$isEmpty — empty array', () => expect(e({ $isEmpty: [] })).toBe(true));
  it('$isEmpty — non-empty', () => expect(e({ $isEmpty: 'x' })).toBe(false));
  it('$isNil — null', () => expect(e({ $isNil: null })).toBe(true));
  it('$isNil — 0 is not nil', () => expect(e({ $isNil: 0 })).toBe(false));
  it('$isNotNil — value exists', () => expect(e({ $isNotNil: 'x' })).toBe(true));
  it('$isArray — array', () => expect(e({ $isArray: [1, 2] })).toBe(true));
  it('$isArray — not array', () => expect(e({ $isArray: 'x' })).toBe(false));
});

// ─────────────────────────────────────────────────────────────────────────────
// Comparison
// ─────────────────────────────────────────────────────────────────────────────

describe('comparison', () => {
  it('$eq', () => { expect(e({ $eq: { a: 1, b: 1 } })).toBe(true); expect(e({ $eq: { a: 1, b: 2 } })).toBe(false); });
  it('$neq', () => { expect(e({ $neq: { a: 1, b: 2 } })).toBe(true); expect(e({ $neq: { a: 1, b: 1 } })).toBe(false); });
  it('$gt', () => { expect(e({ $gt: { a: 5, b: 3 } })).toBe(true); expect(e({ $gt: { a: 3, b: 5 } })).toBe(false); });
  it('$gte', () => { expect(e({ $gte: { a: 3, b: 3 } })).toBe(true); expect(e({ $gte: { a: 2, b: 3 } })).toBe(false); });
  it('$lt', () => { expect(e({ $lt: { a: 2, b: 5 } })).toBe(true); expect(e({ $lt: { a: 5, b: 2 } })).toBe(false); });
  it('$lte', () => { expect(e({ $lte: { a: 3, b: 3 } })).toBe(true); expect(e({ $lte: { a: 4, b: 3 } })).toBe(false); });
});

// ─────────────────────────────────────────────────────────────────────────────
// Math
// ─────────────────────────────────────────────────────────────────────────────

describe('math', () => {
  it('$add', () => expect(e({ $add: [1, 2, 3] })).toBe(6));
  it('$sub', () => expect(e({ $sub: [10, 4] })).toBe(6));
  it('$mul', () => expect(e({ $mul: [2, 3, 4] })).toBe(24));
  it('$div', () => expect(e({ $div: [10, 4] })).toBe(2.5));
  it('$div by zero returns 0', () => expect(e({ $div: [5, 0] })).toBe(0));
  it('$mod', () => expect(e({ $mod: [7, 3] })).toBe(1));
  it('$pow — array form', () => expect(e({ $pow: [2, 8] })).toBe(256));
  it('$pow — object form', () => expect(e({ $pow: { base: 3, exp: 3 } })).toBe(27));
  it('$abs', () => { expect(e({ $abs: -5 })).toBe(5); expect(e({ $abs: 5 })).toBe(5); });
  it('$negate', () => expect(e({ $negate: 7 })).toBe(-7));
  it('$sqrt', () => expect(e({ $sqrt: 16 })).toBe(4));
  it('$ceil', () => expect(e({ $ceil: 1.1 })).toBe(2));
  it('$floor', () => expect(e({ $floor: 1.9 })).toBe(1));
  it('$round no decimals', () => expect(e({ $round: 2.6 })).toBe(3));
  it('$round with decimals', () => expect(e({ $round: [2.345, 2] })).toBeCloseTo(2.35));
  it('$sum — array of numbers', () => expect(e({ $sum: [1, 2, 3, 4] })).toBe(10));
  it('$sum — over/as/return', () =>
    expect(e({ $sum: { over: [{ v: 1 }, { v: 2 }, { v: 3 }], as: 'x', return: { $ref: 'var:x.v' } } })).toBe(6));
  it('$min', () => expect(e({ $min: [5, 1, 3] })).toBe(1));
  it('$max', () => expect(e({ $max: [5, 1, 3] })).toBe(5));
  it('$clamp', () => {
    expect(e({ $clamp: { value: -5, min: 0, max: 10 } })).toBe(0);
    expect(e({ $clamp: { value: 15, min: 0, max: 10 } })).toBe(10);
    expect(e({ $clamp: { value: 5, min: 0, max: 10 } })).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// String
// ─────────────────────────────────────────────────────────────────────────────

describe('string', () => {
  it('$concat', () => expect(e({ $concat: ['hello', ' ', 'world'] })).toBe('hello world'));
  it('$length — string', () => expect(e({ $length: 'abc' })).toBe(3));
  it('$length — array', () => expect(e({ $length: [1, 2] })).toBe(2));
  it('$length — object', () => expect(e({ $length: { a: 1, b: 2 } })).toBe(2));
  it('$trim', () => expect(e({ $trim: '  hi  ' })).toBe('hi'));
  it('$lower', () => expect(e({ $lower: 'HELLO' })).toBe('hello'));
  it('$upper', () => expect(e({ $upper: 'hello' })).toBe('HELLO'));
  it('$replace', () => expect(e({ $replace: { value: 'aabbcc', from: 'b', to: 'X' } })).toBe('aaXXcc'));
  it('$padStart', () => expect(e({ $padStart: { value: '5', len: 3, char: '0' } })).toBe('005'));
  it('$padEnd', () => expect(e({ $padEnd: { value: '5', len: 3, char: '0' } })).toBe('500'));
  it('$split', () => expect(e({ $split: { value: 'a,b,c', sep: ',' } })).toEqual(['a', 'b', 'c']));
  it('$join — arr form', () => expect(e({ $join: { arr: ['a', 'b', 'c'], sep: '-' } })).toBe('a-b-c'));
  it('$join — parts form', () => expect(e({ $join: { parts: ['x', 'y'], sep: '/' } })).toBe('x/y'));
  it('$includes', () => {
    expect(e({ $includes: { value: 'foobar', search: 'bar' } })).toBe(true);
    expect(e({ $includes: { value: 'foobar', search: 'baz' } })).toBe(false);
  });
  it('$startsWith', () => {
    expect(e({ $startsWith: { value: 'hello', prefix: 'hel' } })).toBe(true);
    expect(e({ $startsWith: { value: 'hello', prefix: 'llo' } })).toBe(false);
  });
  it('$endsWith', () => {
    expect(e({ $endsWith: { value: 'hello', suffix: 'llo' } })).toBe(true);
    expect(e({ $endsWith: { value: 'hello', suffix: 'hel' } })).toBe(false);
  });
  it('$contains — case-insensitive', () => {
    expect(e({ $contains: { value: 'Hello World', search: 'world' } })).toBe(true);
    expect(e({ $contains: { value: 'Hello', search: 'xyz' } })).toBe(false);
  });
  it('$contains — empty search returns true', () =>
    expect(e({ $contains: { value: 'anything', search: '' } })).toBe(true));
  it('$charAt', () => expect(e({ $charAt: { value: 'hello', index: 1 } })).toBe('e'));
});

// ─────────────────────────────────────────────────────────────────────────────
// Type coercion
// ─────────────────────────────────────────────────────────────────────────────

describe('type coercion', () => {
  it('$string converts number', () => expect(e({ $string: 42 })).toBe('42'));
  it('$number converts string', () => expect(e({ $number: '3.14' })).toBe(3.14));
  it('$bool converts 0 to false', () => expect(e({ $bool: 0 })).toBe(false));
  it('$bool converts 1 to true', () => expect(e({ $bool: 1 })).toBe(true));
  it('$nullish — returns value if not null', () =>
    expect(e({ $nullish: { value: 'x', default: 'fallback' } })).toBe('x'));
  it('$nullish — returns default if null', () =>
    expect(e({ $nullish: { value: null, default: 'fallback' } })).toBe('fallback'));
});

// ─────────────────────────────────────────────────────────────────────────────
// Array operators
// ─────────────────────────────────────────────────────────────────────────────

describe('array operators', () => {
  const nums = [3, 1, 4, 1, 5, 9];

  it('$map returns mapped values', () =>
    expect(e({ $map: { over: [1, 2, 3], as: 'n', return: { $mul: [{ $ref: 'var:n' }, 2] } } }))
      .toEqual([2, 4, 6]));

  it('$map exposes index as nIndex', () =>
    expect(e({ $map: { over: ['a', 'b'], as: 'x', return: { $ref: 'var:xIndex' } } }))
      .toEqual([0, 1]));

  it('$filter keeps matching items', () =>
    expect(e({ $filter: { over: nums, as: 'n', where: { $gt: { a: { $ref: 'var:n' }, b: 3 } } } }))
      .toEqual([4, 5, 9]));

  it('$reduce sums array', () =>
    expect(e({ $reduce: { over: [1, 2, 3, 4], as: 'n', acc: 'sum', init: 0, return: { $add: [{ $ref: 'var:sum' }, { $ref: 'var:n' }] } } }))
      .toBe(10));

  it('$find returns first match', () =>
    expect(e({ $find: { over: [{ id: 1 }, { id: 2 }], as: 'x', where: { $eq: { a: { $ref: 'var:x.id' }, b: 2 } } } }))
      .toEqual({ id: 2 }));

  it('$find returns null when not found', () =>
    expect(e({ $find: { over: [1, 2], as: 'x', where: { $eq: { a: { $ref: 'var:x' }, b: 99 } } } }))
      .toBe(null));

  it('$findIndex returns correct index', () =>
    expect(e({ $findIndex: { over: [10, 20, 30], as: 'x', where: { $eq: { a: { $ref: 'var:x' }, b: 20 } } } }))
      .toBe(1));

  it('$some returns true when one matches', () =>
    expect(e({ $some: { over: [1, 2, 3], as: 'n', where: { $gt: { a: { $ref: 'var:n' }, b: 2 } } } }))
      .toBe(true));

  it('$every returns false when one fails', () =>
    expect(e({ $every: { over: [1, 2, 3], as: 'n', where: { $gt: { a: { $ref: 'var:n' }, b: 0 } } } }))
      .toBe(true));

  it('$sort ascending (default)', () =>
    expect(e({ $sort: { over: [3, 1, 2] } })).toEqual([1, 2, 3]));

  it('$sort descending', () =>
    expect(e({ $sort: { over: [3, 1, 2], dir: 'desc' } })).toEqual([3, 2, 1]));

  it('$sort by field', () =>
    expect(
      e({ $sort: { over: [{ n: 'banana' }, { n: 'apple' }, { n: 'cherry' }], by: { $ref: 'refs:item.n' } } })
    ).toEqual([{ n: 'apple' }, { n: 'banana' }, { n: 'cherry' }]));

  it('$count — array', () => expect(e({ $count: [1, 2, 3] })).toBe(3));
  it('$count — string', () => expect(e({ $count: 'hello' })).toBe(5));
  it('$first', () => expect(e({ $first: [10, 20, 30] })).toBe(10));
  it('$last', () => expect(e({ $last: [10, 20, 30] })).toBe(30));
  it('$flat', () => expect(e({ $flat: [[1, 2], [3, 4]] })).toEqual([1, 2, 3, 4]));
  it('$reverse', () => expect(e({ $reverse: [1, 2, 3] })).toEqual([3, 2, 1]));
  it('$compact removes falsy', () => expect(e({ $compact: [0, 1, null, 2, false, 3] })).toEqual([1, 2, 3]));
  it('$uniq removes duplicates', () => expect(e({ $uniq: [1, 2, 2, 3, 1] })).toEqual([1, 2, 3]));
  it('$slice — array', () => expect(e({ $slice: { over: [1, 2, 3, 4, 5], start: 1, end: 3 } })).toEqual([2, 3]));
  it('$slice — string', () => expect(e({ $slice: { value: 'hello', start: 1, end: 4 } })).toBe('ell'));
  it('$at — index', () => expect(e({ $at: { arr: [10, 20, 30], index: 1 } })).toBe(20));
  it('$at — fallback', () => expect(e({ $at: { arr: [10], index: 5, fallback: 99 } })).toBe(99));
  it('$append adds to end', () => expect(e({ $append: { to: [1, 2], item: 3 } })).toEqual([1, 2, 3]));
  it('$prepend adds to start', () => expect(e({ $prepend: { to: [2, 3], item: 1 } })).toEqual([1, 2, 3]));
});

// ─────────────────────────────────────────────────────────────────────────────
// Object operators
// ─────────────────────────────────────────────────────────────────────────────

describe('object operators', () => {
  it('$merge merges objects left to right', () =>
    expect(e({ $merge: [{ a: 1 }, { b: 2 }, { a: 99 }] })).toEqual({ a: 99, b: 2 }));

  it('$get retrieves nested key', () =>
    expect(e({ $get: { from: { x: { y: 42 } }, path: 'x.y' } })).toBe(42));

  it('$keys returns object keys', () =>
    expect(e({ $keys: { a: 1, b: 2, c: 3 } })).toEqual(['a', 'b', 'c']));

  it('$values returns object values', () =>
    expect(e({ $values: { a: 1, b: 2 } })).toEqual([1, 2]));

  it('$entries returns [key, value] pairs', () =>
    expect(e({ $entries: { a: 1 } })).toEqual([['a', 1]]));

  it('$pick selects subset of keys', () =>
    expect(e({ $pick: { from: { a: 1, b: 2, c: 3 }, keys: ['a', 'c'] } })).toEqual({ a: 1, c: 3 }));

  it('$omit excludes keys', () =>
    expect(e({ $omit: { from: { a: 1, b: 2, c: 3 }, keys: ['b'] } })).toEqual({ a: 1, c: 3 }));

  it('$json serializes to string', () =>
    expect(e({ $json: { x: 1 } })).toBe('{"x":1}'));

  it('$parse deserializes JSON string', () =>
    expect(e({ $parse: '{"x":1}' })).toEqual({ x: 1 }));

  it('$parse returns null for invalid JSON', () =>
    expect(e({ $parse: 'not-json' })).toBe(null));
});

// ─────────────────────────────────────────────────────────────────────────────
// Plain object pass-through
// ─────────────────────────────────────────────────────────────────────────────

describe('plain object evaluation', () => {
  it('evaluates each value in a plain object', () =>
    expect(e({ label: 'count', value: { $add: [1, 2] } })).toEqual({ label: 'count', value: 3 }));
});
