/**
 * [PRI-3650 — openclaw-deploy (Cold Iron)] signed-IPN → HMAC-verify → (activation)
 *
 * Mirrors the gold template
 *   ai-worker-as-a-service/apps/landing/__tests__/webhooks.test.ts
 * (minimal http.Server → real POST handler; env set before importing route).
 *
 * Route under test (real, unmodified):
 *   apps/landing/app/api/webhooks/nowpayments/route.ts
 *
 * IMPORTANT — scope of what this route actually does (verified against source):
 *   - It HMAC-SHA512-verifies x-nowpayments-sig over the NOWPayments-canonical
 *     (alphabetically key-sorted) JSON body, with a raw-body fallback.
 *   - On verify failure it returns 401 { ok:false, verified:false, error:'invalid_signature' }.
 *   - On verify success for a finished/confirmed IPN it ACTIVATES the Cloud tier:
 *     cloud_tier_activations.status -> 'active', activated_at -> NOW(), at the tier
 *     implied by price_amount ($199/$899/$2400). Idempotent on replay. It then
 *     returns 200 { ok:true, verified:true, order_id, status, activated }.
 *     (PRI-3751: part (c) activation wired in; previously a verify-only stub.)
 *
 * Cloud tier mapping (source of truth: apps/landing/app/api/checkout/nowpayments/route.ts):
 *   cloud-team       => $199
 *   cloud-org        => $899
 *   cloud-enterprise => $2400
 *
 * This test:
 *   1. POSITIVE  — correctly signed finished IPN → 200 verified:true.
 *   2. NEGATIVE  — tampered signature → 401; wrong-secret signature → 401.
 *   3. STORE     — connects to the real sandbox Postgres `openclaw_deploy_pri3650`,
 *                  seeds a pending row per Cloud tier, fires a signed finished IPN,
 *                  and independently reads the row back to assert it transitioned to
 *                  status='active' with activated_at set. Plus an idempotent-replay case.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import http from "node:http";
import postgres from "postgres";
import { ensureSandboxDatabase, ensureSchema } from "./pri3650-setup.mjs";

// Cloud-tier mapping — source of truth: apps/landing/app/api/checkout/nowpayments/route.ts
//   cloud-team => $199, cloud-org => $899, cloud-enterprise => $2400.
const CLOUD_TIERS = {
  "cloud-team": 199,
  "cloud-org": 899,
  "cloud-enterprise": 2400,
} as const;

const TEST_SECRET = "test-ipn-secret-openclaw-pri3650";
const PORT = 3133;
const BASE = `http://localhost:${PORT}`;

// Per-project sandbox DB URL. Canonical PRI-3650 recipe: the runner exports
// PRI3650_DB_URL pointing straight at the per-project sandbox DB. We use it for
// BOTH the fixture client and (for parity with the gold template) the route's
// DATABASE_URL. Fallback: derive from the control-plane DATABASE_URL by swapping
// the db name. inkus is superuser+CREATEDB.
const SANDBOX_DB = "openclaw_deploy_pri3650";
const CONTROL_PLANE_URL =
  process.env.DATABASE_URL ??
  "postgres://inkus:pw@postgres:5432/paperclip";
const SANDBOX_URL =
  process.env.PRI3650_DB_URL ??
  CONTROL_PLANE_URL.replace(/\/paperclip(\?|$)/, `/${SANDBOX_DB}$1`);
// Point the route at the same sandbox DB (no-op for this route, which performs
// no DB access, but keeps the canonical wiring identical to the gold template).
process.env.DATABASE_URL = SANDBOX_URL;

let server: http.Server;
let sql: ReturnType<typeof postgres>;

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortObject((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

/** Valid NOWPayments x-nowpayments-sig: HMAC-SHA512 over key-sorted JSON. */
function sign(payload: Record<string, unknown>, secret: string): string {
  const sorted = JSON.stringify(sortObject(payload));
  return crypto.createHmac("sha512", secret.trim()).update(sorted).digest("hex");
}

async function postWebhook(
  body: Record<string, unknown>,
  signature: string | null,
): Promise<{ status: number; body: any }> {
  const raw = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const url = new URL("/api/webhooks/nowpayments", BASE);
    const req = http.request(
      url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(signature ? { "x-nowpayments-sig": signature } : {}),
          "content-length": Buffer.byteLength(raw).toString(),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: data });
          }
        });
      },
    );
    req.on("error", reject);
    req.write(raw);
    req.end();
  });
}

beforeAll(async () => {
  // Env must be set BEFORE importing the route (route reads it at request time;
  // we set it here for parity with the gold template and to be safe).
  process.env.NOWPAYMENTS_IPN_SECRET = TEST_SECRET;

  // Idempotently materialize the per-project sandbox DB + activation schema.
  // (Safe to re-run; guarded by pg_database / CREATE TABLE IF NOT EXISTS.)
  await ensureSandboxDatabase();
  await ensureSchema(SANDBOX_URL);

  sql = postgres(SANDBOX_URL, { max: 1 });
  // Prove the sandbox DB is reachable and is NOT the control-plane DB.
  const [{ db }] = await sql`SELECT current_database() AS db`;
  if (db !== SANDBOX_DB) {
    throw new Error(`Refusing to run against db="${db}"; expected "${SANDBOX_DB}"`);
  }

  const { POST } = await import("../app/api/webhooks/nowpayments/route");

  server = http.createServer(async (req, res) => {
    if (req.method === "POST" && req.url?.startsWith("/api/webhooks/nowpayments")) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const bodyStr = Buffer.concat(chunks).toString();

      const request = new Request(`http://localhost${req.url}`, {
        method: "POST",
        headers: new Headers(req.headers as Record<string, string>),
        body: bodyStr || undefined,
      });
      request.text = async () => bodyStr;

      const response = await POST(request);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      res.end(await response.text());
    } else {
      res.writeHead(404);
      res.end("not found");
    }
  });

  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
  });
  await sql?.end({ timeout: 1 });
});

describe("openclaw-deploy NOWPayments IPN — signed → HMAC-verify", () => {
  // Cloud-tier "Org" order at $899 (one of the three Cloud tiers).
  const finishedPayload: Record<string, unknown> = {
    payment_id: 778899,
    payment_status: "finished",
    order_id: "ocd-cloud-org-pri3650",
    invoice_id: "inv-ocd-3650",
    price_amount: 899,
    price_currency: "usd",
    pay_currency: "usdttrc20",
  };

  it("POSITIVE: correctly-signed finished IPN → 200 verified:true", async () => {
    const sig = sign(finishedPayload, TEST_SECRET);
    const { status, body } = await postWebhook(finishedPayload, sig);
    expect(status).toBe(200);
    expect(body).toHaveProperty("ok", true);
    expect(body).toHaveProperty("verified", true);
    expect(body).toHaveProperty("status", "finished");
    expect(body).toHaveProperty("order_id", finishedPayload.order_id);
  });

  it("NEGATIVE: tampered signature → 401 invalid_signature", async () => {
    const tampered = "deadbeef".repeat(16); // hex but wrong digest
    const { status, body } = await postWebhook(finishedPayload, tampered);
    expect(status).toBe(401);
    expect(body).toHaveProperty("verified", false);
    expect(body).toHaveProperty("error", "invalid_signature");
  });

  it("NEGATIVE: wrong-secret signature → 401 invalid_signature", async () => {
    const wrong = sign(finishedPayload, "totally-wrong-secret");
    const { status, body } = await postWebhook(finishedPayload, wrong);
    expect(status).toBe(401);
    expect(body).toHaveProperty("verified", false);
    expect(body).toHaveProperty("error", "invalid_signature");
  });

  // Each of the three Cloud tiers, signed + verified at its real price.
  // This proves the route accepts/verifies a finished IPN for every Cloud tier
  // amount ($199 / $899 / $2400) and echoes the order_id + status back.
  for (const [plan, amount] of Object.entries(CLOUD_TIERS)) {
    it(`POSITIVE: verified finished IPN for ${plan} ($${amount})`, async () => {
      const payload: Record<string, unknown> = {
        payment_id: 100000 + amount,
        payment_status: "finished",
        order_id: `ocd-${plan}-pri3650`,
        invoice_id: `inv-${plan}-3650`,
        price_amount: amount,
        price_currency: "usd",
        pay_currency: "usdttrc20",
      };
      const { status, body } = await postWebhook(payload, sign(payload, TEST_SECRET));
      expect(status).toBe(200);
      expect(body).toHaveProperty("verified", true);
      expect(body).toHaveProperty("status", "finished");
      expect(body).toHaveProperty("order_id", payload.order_id);
    });
  }

  // STORE read-back: per-tier affirmative activation asserted by direct DB read.
  // For each Cloud tier, we seed a pending row, fire a correctly signed finished
  // IPN, then independently read back the row and verify it transitioned to
  // status='active' with activated_at set.
  for (const [plan, amount] of Object.entries(CLOUD_TIERS)) {
    it(`STORE: verified finished IPN activates ${plan} ($${amount}) — DB read-back`, async () => {
      const orderId = `ocd-${plan}-pri3650-store`;

      // Seed a pending activation row (as checkout would create it).
      await sql`DELETE FROM cloud_tier_activations WHERE order_id = ${orderId}`;
      await sql`
        INSERT INTO cloud_tier_activations (order_id, plan, amount_usd, status)
        VALUES (${orderId}, ${plan}, ${amount}, 'pending')
      `;

      const ipnPayload: Record<string, unknown> = {
        payment_id: 200000 + amount,
        payment_status: "finished",
        order_id: orderId,
        invoice_id: `inv-${plan}-store`,
        price_amount: amount,
        price_currency: "usd",
        pay_currency: "usdttrc20",
      };

      const { status: httpStatus, body } = await postWebhook(ipnPayload, sign(ipnPayload, TEST_SECRET));
      expect(httpStatus).toBe(200);
      expect(body).toHaveProperty("verified", true);

      // Read the row back independently from the DB.
      const [row] = await sql<
        { order_id: string; plan: string; amount_usd: number; status: string; activated_at: Date | null }[]
      >`
        SELECT order_id, plan, amount_usd, status, activated_at
        FROM cloud_tier_activations
        WHERE order_id = ${orderId}
      `;

      expect(row).toBeDefined();
      expect(row.plan).toBe(plan);
      expect(Number(row.amount_usd)).toBe(amount);

      // Route MUST have activated the row.
      expect(row.status).toBe("active");
      expect(row.activated_at).not.toBeNull();

      await sql`DELETE FROM cloud_tier_activations WHERE order_id = ${orderId}`;
    });
  }

  // Idempotency: replaying a finished IPN on an already-active row must not error.
  it("STORE: replay of finished IPN on already-active row is idempotent", async () => {
    const orderId = "ocd-cloud-org-idempotent";
    await sql`DELETE FROM cloud_tier_activations WHERE order_id = ${orderId}`;
    await sql`
      INSERT INTO cloud_tier_activations (order_id, plan, amount_usd, status, activated_at)
      VALUES (${orderId}, 'cloud-org', 899, 'active', NOW())
    `;

    const ipnPayload: Record<string, unknown> = {
      payment_id: 999001,
      payment_status: "finished",
      order_id: orderId,
      price_amount: 899,
      price_currency: "usd",
      pay_currency: "usdttrc20",
    };

    const { status: httpStatus, body } = await postWebhook(ipnPayload, sign(ipnPayload, TEST_SECRET));
    expect(httpStatus).toBe(200);
    expect(body).toHaveProperty("verified", true);

    const [row] = await sql<{ status: string; activated_at: Date | null }[]>`
      SELECT status, activated_at FROM cloud_tier_activations WHERE order_id = ${orderId}
    `;
    expect(row.status).toBe("active");
    expect(row.activated_at).not.toBeNull();

    await sql`DELETE FROM cloud_tier_activations WHERE order_id = ${orderId}`;
  });
});
