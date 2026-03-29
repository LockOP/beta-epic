import type { HttpCallExpr, RuntimeContext } from '../types';
import { evaluateExpression } from '../compiler/expr';

export interface ResolvedHttpConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Resolve an $http expression into a fetch call and return the parsed response.
 */
export const executeHttp = async (
  httpExpr: HttpCallExpr['$http'],
  ctx: RuntimeContext
): Promise<unknown> => {
  const method  = String(httpExpr.method ?? 'GET').toUpperCase();
  const url     = String(evaluateExpression(httpExpr.url as Parameters<typeof evaluateExpression>[0], ctx) ?? httpExpr.url);

  // Resolve headers — Content-Type is only added when a body will be sent,
  // to avoid triggering a CORS preflight on simple GET/HEAD requests.
  const headerExprs = httpExpr.headers ?? {};
  const hasBody = httpExpr.data !== undefined && method !== 'GET' && method !== 'HEAD';
  const headers: Record<string, string> = hasBody ? { 'Content-Type': 'application/json' } : {};
  for (const [k, v] of Object.entries(headerExprs)) {
    headers[k] = String(evaluateExpression(v as Parameters<typeof evaluateExpression>[0], ctx) ?? '');
  }

  // Resolve params → append to URL
  let finalUrl = url;
  if (ctx.baseUrl && !url.startsWith('http')) {
    finalUrl = ctx.baseUrl.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
  }
  if (httpExpr.params) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(httpExpr.params)) {
      const resolved = evaluateExpression(v as Parameters<typeof evaluateExpression>[0], ctx);
      if (resolved !== null && resolved !== undefined) {
        params.set(k, String(resolved));
      }
    }
    const qs = params.toString();
    if (qs) finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}${qs}`;
  }

  // Resolve body
  let body: string | undefined;
  if (httpExpr.data !== undefined) {
    const resolved = evaluateExpression(httpExpr.data as Parameters<typeof evaluateExpression>[0], ctx);
    body = JSON.stringify(resolved);
  }

  // Auth token
  if (ctx.getToken) {
    const token = await ctx.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(finalUrl, {
    method,
    headers,
    body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
  });

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try { const j = await response.json(); msg = j.message ?? j.error ?? msg; } catch { /* noop */ }
    const err = new Error(msg) as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};
