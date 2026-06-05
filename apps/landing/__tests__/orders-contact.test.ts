/**
 * [PRI-5762 — openclaw-deploy (Cold Iron)] order/contact route validation gate.
 *
 * Mirrors the gold test pattern from the existing webhooks.test.ts: stand
 * up a minimal http.Server in front of the real, unmodified
 * apps/landing/app/api/orders/contact/route.ts POST handler and assert the
 * validation contract end-to-end.
 *
 * Contract under test:
 *   1. Empty body     -> 400 missing_buyer_context, no order_id.
 *   2. Invalid email  -> 400 invalid_email, no order_id.
 *   3. Email only     -> 200 ok, order_id, mailto_url.
 *   4. Note only      -> 200 ok, order_id, mailto_url.
 *   5. Plan rejection -> 400 unknown_plan, no order_id.
 *   6. Rate limit     -> 6th request from same client within 10 min -> 429.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import {
  POST as contactPost,
  GET as contactGet,
} from '../app/api/orders/contact/route';

const PORT = 3231;
const BASE = `http://localhost:${PORT}`;

let server: http.Server;

async function postJson(
  path: string,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<{ status: number; body: any; headers: Record<string, string> }> {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(raw).toString(),
          ...extraHeaders,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let parsed: any = data;
          try {
            parsed = JSON.parse(data);
          } catch {
            /* keep as text */
          }
          resolve({
            status: res.statusCode ?? 0,
            body: parsed,
            headers: res.headers as Record<string, string>,
          });
        });
      },
    );
    req.on('error', reject);
    if (raw) req.write(raw);
    req.end();
  });
}

beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url?.startsWith('/api/orders/contact')) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const bodyStr = Buffer.concat(chunks).toString();

      const request = new Request(`http://localhost${req.url}`, {
        method: 'POST',
        headers: new Headers(req.headers as Record<string, string>),
        body: bodyStr || undefined,
      });
      request.text = async () => bodyStr;

      const response = await contactPost(request);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      res.end(await response.text());
    } else if (req.method === 'GET' && req.url?.startsWith('/api/orders/contact')) {
      const response = await contactGet();
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      res.end(await response.text());
    } else {
      res.writeHead(404);
      res.end('not found');
    }
  });

  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
  });
});

describe("openclaw-deploy /api/orders/contact — validation contract", () => {
  it("GET returns the public schema with the validation contract documented", async () => {
    const res = await new Promise<{ status: number; body: any }>((resolve, reject) => {
      const req = http.request(`${BASE}/api/orders/contact`, { method: 'GET' }, (r) => {
        let data = '';
        r.on('data', (c) => (data += c));
        r.on('end', () => {
          try {
            resolve({ status: r.statusCode ?? 0, body: JSON.parse(data) });
          } catch {
            resolve({ status: r.statusCode ?? 0, body: data });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.validation).toContain('email or note is required');
  });

  it('NEGATIVE: empty body -> 400 missing_buyer_context, no order_id', async () => {
    const { status, body } = await postJson('/api/orders/contact', {});
    expect(status).toBe(400);
    expect(body.error).toBe('missing_buyer_context');
    expect(body.order_id).toBeUndefined();
    expect(body.mailto_url).toBeUndefined();
  });

  it('NEGATIVE: invalid email (missing @) -> 400 invalid_email', async () => {
    const { status, body } = await postJson('/api/orders/contact', {
      plan: 'cloud-team',
      email: 'not-an-email',
    });
    expect(status).toBe(400);
    expect(body.error).toBe('invalid_email');
    expect(body.order_id).toBeUndefined();
  });

  it('NEGATIVE: unknown plan -> 400 unknown_plan', async () => {
    const { status, body } = await postJson('/api/orders/contact', {
      plan: 'cloud-platinum',
      email: 'maya@fleet.dev',
    });
    expect(status).toBe(400);
    expect(body.error).toBe('unknown_plan');
    expect(body.order_id).toBeUndefined();
  });

  it('POSITIVE: valid email only -> 200 ok, order_id, mailto_url', async () => {
    const { status, body } = await postJson(
      '/api/orders/contact',
      { plan: 'cloud-team', email: 'maya@fleet.dev' },
      // unique UA so the per-client rate limit window is fresh
      { 'user-agent': 'vitest-email-only/1.0' },
    );
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.plan).toBe('cloud-team');
    expect(typeof body.order_id).toBe('string');
    expect(body.order_id).toMatch(/^ocd-cloud-team-contact-/);
    expect(typeof body.mailto_url).toBe('string');
    expect(body.mailto_url).toMatch(/^mailto:/);
  });

  it('POSITIVE: note only (no email) -> 200 ok, order_id, mailto_url', async () => {
    const { status, body } = await postJson(
      '/api/orders/contact',
      { plan: 'cloud-org', note: '8 NanoClaws on Incus, OAuth rotation needed before EOM.' },
      { 'user-agent': 'vitest-note-only/1.0' },
    );
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.plan).toBe('cloud-org');
    expect(typeof body.order_id).toBe('string');
    expect(typeof body.mailto_url).toBe('string');
    // The note should be reflected in the mailto body.
    expect(body.mailto_url).toContain('NanoClaws');
  });

  it('RATE LIMIT: 6th request from the same client in <10 min -> 429', async () => {
    const ua = 'vitest-rate-limit/1.0';
    // Fire 5 successful requests.
    for (let i = 0; i < 5; i++) {
      const { status, body } = await postJson(
        '/api/orders/contact',
        { plan: 'cloud-team', email: `rate-${i}@example.com` },
        { 'user-agent': ua },
      );
      expect(status).toBe(200);
      expect(body.ok).toBe(true);
    }
    // 6th is throttled.
    const { status, body, headers } = await postJson(
      '/api/orders/contact',
      { plan: 'cloud-team', email: 'rate-6@example.com' },
      { 'user-agent': ua },
    );
    expect(status).toBe(429);
    expect(body.error).toBe('rate_limited');
    expect(headers['retry-after']).toBeDefined();
    expect(parseInt(headers['retry-after'], 10)).toBeGreaterThan(0);
  });

  it('NEGATIVE: invalid JSON body -> 400 invalid_json', async () => {
    const { status, body } = await postJson(
      '/api/orders/contact',
      '{not json',
      { 'user-agent': 'vitest-invalid-json/1.0' },
    );
    expect(status).toBe(400);
    expect(body.error).toBe('invalid_json');
  });
});
