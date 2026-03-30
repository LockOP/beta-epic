/** date.ts — date helpers for the default fn-registry */

export const dateFns: Record<string, (...args: unknown[]) => unknown> = {
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
};
