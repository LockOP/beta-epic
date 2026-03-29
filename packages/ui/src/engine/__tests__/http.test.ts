import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeHttp } from '../utils/http';
import { makeCtx } from './setup';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type FetchArgs = [string, RequestInit];

const mockFetch = (
  body: unknown,
  status = 200,
  contentType = 'application/json'
) => {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (_: string) => contentType },
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(String(body)),
  };
  global.fetch = vi.fn().mockResolvedValue(response);
  return response;
};

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Basic requests
// ─────────────────────────────────────────────────────────────────────────────

describe('executeHttp — basic requests', () => {
  it('makes a GET request to the given URL', async () => {
    mockFetch({ items: [] });
    const ctx = makeCtx();
    await executeHttp({ method: 'GET', url: 'https://api.example.com/items' }, ctx);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    expect(url).toBe('https://api.example.com/items');
    expect(init.method).toBe('GET');
  });

  it('returns parsed JSON response', async () => {
    mockFetch({ name: 'Alice' });
    const ctx = makeCtx();
    const result = await executeHttp({ method: 'GET', url: 'https://api.example.com/user' }, ctx);
    expect(result).toEqual({ name: 'Alice' });
  });

  it('returns text for non-JSON content type', async () => {
    mockFetch('plain text', 200, 'text/plain');
    const ctx = makeCtx();
    const result = await executeHttp({ method: 'GET', url: 'https://api.example.com/file' }, ctx);
    expect(result).toBe('plain text');
  });

  it('uppercases method', async () => {
    mockFetch({});
    const ctx = makeCtx();
    await executeHttp({ method: 'get' as 'GET', url: 'https://api.example.com' }, ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    expect(init.method).toBe('GET');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS — Content-Type header behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('Content-Type header (CORS fix)', () => {
  it('does NOT set Content-Type on GET requests', async () => {
    mockFetch({});
    const ctx = makeCtx();
    await executeHttp({ method: 'GET', url: 'https://api.example.com/data' }, ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('does NOT set Content-Type on HEAD requests', async () => {
    mockFetch({});
    const ctx = makeCtx();
    await executeHttp({ method: 'HEAD' as 'GET', url: 'https://api.example.com' }, ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('does NOT set Content-Type on GET even when data is somehow present', async () => {
    // data field present but method is GET — body is NOT sent, no Content-Type
    mockFetch({});
    const ctx = makeCtx();
    await executeHttp({ method: 'GET', url: 'https://api.example.com', data: { x: 1 } }, ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
    expect(init.body).toBeUndefined();
  });

  it('DOES set Content-Type: application/json on POST with data', async () => {
    mockFetch({});
    const ctx = makeCtx();
    await executeHttp({ method: 'POST', url: 'https://api.example.com/create', data: { name: 'Alice' } }, ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"name":"Alice"}');
  });

  it('DOES set Content-Type: application/json on PATCH with data', async () => {
    mockFetch({});
    const ctx = makeCtx();
    await executeHttp({ method: 'PATCH', url: 'https://api.example.com/update', data: { id: 1 } }, ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('does NOT set Content-Type on POST without data', async () => {
    mockFetch({});
    const ctx = makeCtx();
    await executeHttp({ method: 'POST', url: 'https://api.example.com/trigger' }, ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
    expect(init.body).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Query params
// ─────────────────────────────────────────────────────────────────────────────

describe('query params', () => {
  it('appends params as query string', async () => {
    mockFetch([]);
    const ctx = makeCtx();
    await executeHttp({ method: 'GET', url: 'https://api.example.com/search', params: { q: 'alice', page: '2' } }, ctx);
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    const parsed = new URL(url);
    expect(parsed.searchParams.get('q')).toBe('alice');
    expect(parsed.searchParams.get('page')).toBe('2');
  });

  it('omits null/undefined params', async () => {
    mockFetch([]);
    const ctx = makeCtx();
    await executeHttp({
      method: 'GET',
      url: 'https://api.example.com/items',
      params: { include: null as unknown as string, limit: '10' },
    }, ctx);
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    const parsed = new URL(url);
    expect(parsed.searchParams.has('include')).toBe(false);
    expect(parsed.searchParams.get('limit')).toBe('10');
  });

  it('appends to existing query string', async () => {
    mockFetch([]);
    const ctx = makeCtx();
    await executeHttp({ method: 'GET', url: 'https://api.example.com/items?tab=all', params: { page: '1' } }, ctx);
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    expect(url).toContain('tab=all');
    expect(url).toContain('page=1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// baseUrl
// ─────────────────────────────────────────────────────────────────────────────

describe('baseUrl', () => {
  it('prepends baseUrl to relative paths', async () => {
    mockFetch({});
    const ctx = makeCtx({ baseUrl: 'https://api.example.com' });
    await executeHttp({ method: 'GET', url: '/users/1' }, ctx);
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    expect(url).toBe('https://api.example.com/users/1');
  });

  it('does not prepend baseUrl when URL starts with http', async () => {
    mockFetch({});
    const ctx = makeCtx({ baseUrl: 'https://api.example.com' });
    await executeHttp({ method: 'GET', url: 'https://other.example.com/data' }, ctx);
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    expect(url).toBe('https://other.example.com/data');
  });

  it('handles trailing slash on baseUrl', async () => {
    mockFetch({});
    const ctx = makeCtx({ baseUrl: 'https://api.example.com/' });
    await executeHttp({ method: 'GET', url: '/items' }, ctx);
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    expect(url).toBe('https://api.example.com/items');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Authorization header
// ─────────────────────────────────────────────────────────────────────────────

describe('auth token', () => {
  it('adds Authorization header when getToken returns a token', async () => {
    mockFetch({});
    const ctx = makeCtx({ getToken: async () => 'my-jwt-token' });
    await executeHttp({ method: 'GET', url: 'https://api.example.com/secure' }, ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-jwt-token');
  });

  it('does not add Authorization header when getToken returns null', async () => {
    mockFetch({});
    const ctx = makeCtx({ getToken: async () => null });
    await executeHttp({ method: 'GET', url: 'https://api.example.com/public' }, ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('does not add Authorization when getToken is not provided', async () => {
    mockFetch({});
    const ctx = makeCtx();
    await executeHttp({ method: 'GET', url: 'https://api.example.com/public' }, ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Custom headers
// ─────────────────────────────────────────────────────────────────────────────

describe('custom headers', () => {
  it('evaluates and adds custom headers', async () => {
    mockFetch({});
    const ctx = makeCtx({ pageState: { locale: 'en-US' } });
    await executeHttp({
      method: 'GET',
      url: 'https://api.example.com',
      headers: { 'Accept-Language': { $ref: 'page.store:locale' } },
    }, ctx);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    expect((init.headers as Record<string, string>)['Accept-Language']).toBe('en-US');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────────────────────────────────────

describe('error handling', () => {
  it('throws an error with HTTP status for non-ok responses', async () => {
    const response = {
      ok: false,
      status: 404,
      headers: { get: () => 'application/json' },
      json: vi.fn().mockResolvedValue({ message: 'Not found' }),
    };
    global.fetch = vi.fn().mockResolvedValue(response);

    const ctx = makeCtx();
    await expect(executeHttp({ method: 'GET', url: 'https://api.example.com/missing' }, ctx))
      .rejects.toThrow('Not found');
  });

  it('throws HTTP status message when body is not JSON', async () => {
    const response = {
      ok: false,
      status: 500,
      headers: { get: () => 'text/plain' },
      json: vi.fn().mockRejectedValue(new Error('not json')),
    };
    global.fetch = vi.fn().mockResolvedValue(response);

    const ctx = makeCtx();
    const err = await executeHttp({ method: 'GET', url: 'https://api.example.com' }, ctx).catch(e => e);
    expect((err as Error & { status: number }).status).toBe(500);
    expect((err as Error).message).toBe('HTTP 500');
  });

  it('attaches status to thrown error', async () => {
    const response = {
      ok: false,
      status: 403,
      headers: { get: () => 'application/json' },
      json: vi.fn().mockResolvedValue({ error: 'Forbidden' }),
    };
    global.fetch = vi.fn().mockResolvedValue(response);

    const ctx = makeCtx();
    const err = await executeHttp({ method: 'GET', url: 'https://api.example.com/secret' }, ctx).catch(e => e);
    expect((err as Error & { status: number }).status).toBe(403);
    expect((err as Error).message).toBe('Forbidden');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// URL expression evaluation
// ─────────────────────────────────────────────────────────────────────────────

describe('URL expression evaluation', () => {
  it('evaluates $ref expression in url field', async () => {
    mockFetch({});
    const ctx = makeCtx({ pageState: { endpoint: 'https://api.example.com/dynamic' } });
    await executeHttp({ method: 'GET', url: { $ref: 'page.store:endpoint' } }, ctx);
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as FetchArgs;
    expect(url).toBe('https://api.example.com/dynamic');
  });
});
