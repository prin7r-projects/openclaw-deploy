/**
 * [PRI-5762 — openclaw-deploy (Cold Iron)] security-header baseline gate.
 *
 * Stands up the landing's `middleware.ts` against a synthetic NextRequest
 * and asserts that every production security header is set on the
 * returned NextResponse. This is the agreed production baseline that
 * matches the operator-ui middleware.
 *
 * Header set under test:
 *   - Content-Security-Policy
 *   - Strict-Transport-Security
 *   - X-Frame-Options
 *   - X-Content-Type-Options
 *   - Referrer-Policy
 *   - Permissions-Policy
 *   - Cross-Origin-Opener-Policy
 *   - Cross-Origin-Resource-Policy
 */

import { describe, it, expect } from 'vitest';
import { middleware } from '../middleware';

function makeReq(path: string): Parameters<typeof middleware>[0] {
  const url = new URL(path, 'https://openclaw-deploy.prin7r.com');
  const headers = new Headers({
    'x-forwarded-proto': 'https',
    host: url.host,
  });
  return {
    nextUrl: {
      pathname: url.pathname,
      search: url.search,
      searchParams: url.searchParams,
      clone: () => url,
    } as any,
    url: url.toString(),
    headers,
    cookies: { get: () => undefined, getAll: () => [] } as any,
    geo: undefined,
    ip: undefined,
    method: 'GET',
    body: null,
    cache: 'default' as const,
    credentials: 'same-origin' as const,
    destination: 'document' as const,
    integrity: '',
    keepalive: false,
    mode: 'same-origin' as const,
    redirect: 'manual' as const,
    referrer: 'no-referrer' as const,
    referrerPolicy: 'no-referrer' as const,
    signal: new AbortController().signal,
  } as any;
}

describe('openclaw-deploy middleware — security header baseline', () => {
  it('sets every required security header on a GET / response', async () => {
    const res = await middleware(makeReq('/'));
    const csp = res.headers.get('Content-Security-Policy') ?? '';
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(csp).toMatch(/script-src 'self'/);
    expect(csp).toMatch(/https:\/\/fonts\.gstatic\.com/);

    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Referrer-Policy')).toBe('no-referrer');

    const hsts = res.headers.get('Strict-Transport-Security') ?? '';
    expect(hsts).toMatch(/max-age=63072000/);
    expect(hsts).toMatch(/includeSubDomains/);
    expect(hsts).toMatch(/preload/);

    const pp = res.headers.get('Permissions-Policy') ?? '';
    expect(pp).toMatch(/camera=\(\)/);
    expect(pp).toMatch(/microphone=\(\)/);
    expect(pp).toMatch(/geolocation=\(\)/);
    expect(pp).toMatch(/payment=\(\)/);

    expect(res.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
  });

  it('applies headers to API routes too (checkout, webhooks, contact)', async () => {
    for (const path of [
      '/api/checkout/nowpayments',
      '/api/webhooks/nowpayments',
      '/api/orders/contact',
    ]) {
      const res = await middleware(makeReq(path));
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('Strict-Transport-Security')).toMatch(/max-age=/);
    }
  });
});
