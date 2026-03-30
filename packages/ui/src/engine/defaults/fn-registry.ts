/**
 * Default function registry.
 * Available via { "$fn": "name", "args": [...] } in DSL expressions.
 *
 * Only functions with NO equivalent DSL operator live here.
 * String/array/object/type-coercion/null-check utilities should use their
 * dedicated expression operators instead of `$fn`.
 *
 * Add domain-specific functions via GuiProvider:
 *   <GuiProvider functions={{ myAnalytics, fetchUser }}>
 */

import { dateFns }   from '../utils/date';
import { formatFns } from '../utils/format';
import { cssFns }    from '../utils/css';

export const defaultFnRegistry: Record<string, (...args: unknown[]) => unknown> = {
  ...dateFns,
  ...formatFns,
  ...cssFns,
};
