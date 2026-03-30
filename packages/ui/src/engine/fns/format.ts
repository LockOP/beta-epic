/** format.ts — number/currency formatting helpers for the default fn-registry */

export const formatFns: Record<string, (...args: unknown[]) => unknown> = {
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
};

export const formatFnsContext = {
  formatFns: `
  formatNumber(value, decimals?, locale?) → string — e.g. formatNumber(1234.5, 2) → "1,234.50"
  formatCurrency(value, currency?, locale?) → string — e.g. formatCurrency(1234, "USD") → "$1,234.00"
  ---
  example config:
    { "$fn": "formatNumber", "args": [{ "$ref": "page.store:price" }, 2] }
    { "$fn": "formatCurrency", "args": [{ "$ref": "page.store:total" }, "USD"] }
    { "$fn": "formatCurrency", "args": [{ "$ref": "page.store:amount" }, "EUR", "de-DE"] }
  `.trim(),
};
