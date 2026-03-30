/** css.ts — CSS class helpers for the default fn-registry */

export const cssFns: Record<string, (...args: unknown[]) => unknown> = {
  /** cn(...classes) — merge class names, filter falsy values. Equivalent to clsx. */
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
};

export const cssFnsContext = {
  cssFns: `
  cn(...classes) → string — joins truthy class names with a space (clsx-equivalent)
  ---
  example config:
    { "$fn": "cn", "args": ["base-class", { "$ref": "page.store:extraClass" }] }
    { "$fn": "cn", "args": ["px-4", { "$if": { "cond": { "$ref": "page.store:active" }, "then": "bg-primary", "else": "bg-muted" } }] }
  `.trim(),
};
