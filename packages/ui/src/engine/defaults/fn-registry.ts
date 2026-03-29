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
export const defaultFnRegistry: Record<string, (...args: unknown[]) => unknown> = {
  // ── Date — no operator equivalent ─────────────────────────────────────────
  now:   () => Date.now(),
  today: () => new Date().toISOString().slice(0, 10),
  /** formatDate(value, "YYYY-MM-DD HH:mm:ss") — tokens: YYYY MM DD HH mm ss */
  formatDate: (value: unknown, fmt: unknown) => {
    try {
      const d   = new Date(value as string | number);
      const str = String(fmt ?? 'YYYY-MM-DD');
      return str
        .replace('YYYY', String(d.getFullYear()))
        .replace('MM',   String(d.getMonth() + 1).padStart(2, '0'))
        .replace('DD',   String(d.getDate()).padStart(2, '0'))
        .replace('HH',   String(d.getHours()).padStart(2, '0'))
        .replace('mm',   String(d.getMinutes()).padStart(2, '0'))
        .replace('ss',   String(d.getSeconds()).padStart(2, '0'));
    } catch {
      return String(value ?? '');
    }
  },

  // ── Formatting — no operator equivalent ───────────────────────────────────
  /** formatNumber(value, decimals?, locale?) */
  formatNumber: (v: unknown, decimals?: unknown, locale?: unknown) => {
    const num = Number(v);
    if (isNaN(num)) return String(v ?? '');
    return num.toLocaleString(String(locale ?? 'en-US'), {
      minimumFractionDigits: Number(decimals ?? 0),
      maximumFractionDigits: Number(decimals ?? 2),
    });
  },
  /** formatCurrency(value, currency?, locale?) — e.g. formatCurrency(1234, "USD") → "$1,234.00" */
  formatCurrency: (v: unknown, currency?: unknown, locale?: unknown) => {
    const num = Number(v);
    if (isNaN(num)) return String(v ?? '');
    return num.toLocaleString(String(locale ?? 'en-US'), {
      style: 'currency',
      currency: String(currency ?? 'USD'),
    });
  },

  // ── CSS — no operator equivalent ──────────────────────────────────────────
  /** cn(...classes) — merge class names, filter falsy values. Equivalent to clsx. */
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
};
