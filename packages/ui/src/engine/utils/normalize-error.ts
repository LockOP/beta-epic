import type { NormalizedError } from '../types';

/**
 * Normalize any thrown value into a consistent error shape.
 */
export const normalizeError = (err: unknown): NormalizedError => {
  if (err === null || err === undefined) {
    return { message: 'Unknown error' };
  }
  if (typeof err === 'string') {
    return { message: err };
  }
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const status = typeof e['status'] === 'number' ? e['status'] : undefined;
    let message = 'Unknown error';
    if (typeof e['message'] === 'string') {
      message = e['message'];
    } else if (typeof e['error'] === 'string') {
      message = e['error'];
    } else {
      try { message = JSON.stringify(err); } catch { /* noop */ }
    }
    if (status !== undefined) {
      message = `${status}: ${message}`;
    }
    return { message, status };
  }
  return { message: String(err) };
};
