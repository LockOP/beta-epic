/** css.ts — CSS class helpers for the default fn-registry */

export const cssFns: Record<string, (...args: unknown[]) => unknown> = {
  /** cn(...classes) — merge class names, filter falsy values. Equivalent to clsx. */
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
};
