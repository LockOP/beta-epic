/**
 * Read a nested value from an object using a dot-path string.
 * Supports numeric segments for array index access.
 *
 * getByPath({ a: { b: [1, 2] } }, 'a.b.1') → 2
 */
export const getByPath = (obj: unknown, path: string): unknown => {
  if (obj === null || obj === undefined) return undefined;
  if (!path) return obj;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object' && !Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
};

/**
 * Set a nested value on an object using a dot-path string.
 * Creates intermediate objects as needed. Mutates the object.
 *
 * setByPath(obj, 'a.b.c', 42) — sets obj.a.b.c = 42
 */
export const setByPath = (obj: Record<string, unknown>, path: string, value: unknown): void => {
  if (!path) return;
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === null || current[part] === undefined || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
};

/**
 * Get a value from localStorage (JSON-parsed). Supports dot-path into stored JSON.
 * Returns null if key not found or JSON parse fails.
 *
 * getLocalStorage('user.preferences.language') →
 *   parses localStorage['user'], then reads .preferences.language
 */
export const getLocalStorage = (keyPath: string): unknown => {
  try {
    const dotIdx = keyPath.indexOf('.');
    const rootKey = dotIdx === -1 ? keyPath : keyPath.slice(0, dotIdx);
    const rest    = dotIdx === -1 ? ''      : keyPath.slice(dotIdx + 1);
    const raw = localStorage.getItem(rootKey);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return rest ? getByPath(parsed, rest) ?? null : parsed;
  } catch {
    return null;
  }
};

/**
 * Get a value from sessionStorage (JSON-parsed). Same dot-path semantics.
 */
export const getSessionStorage = (keyPath: string): unknown => {
  try {
    const dotIdx = keyPath.indexOf('.');
    const rootKey = dotIdx === -1 ? keyPath : keyPath.slice(0, dotIdx);
    const rest    = dotIdx === -1 ? ''      : keyPath.slice(dotIdx + 1);
    const raw = sessionStorage.getItem(rootKey);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return rest ? getByPath(parsed, rest) ?? null : parsed;
  } catch {
    return null;
  }
};
