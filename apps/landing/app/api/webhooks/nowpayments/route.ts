import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import postgres from 'postgres';

// [NOWPAYMENTS_INTEGRATION] /apps/landing/app/api/webhooks/nowpayments/route.ts
// IPN webhook: verifies x-nowpayments-sig HMAC-SHA512, then activates the
// cloud_tier_activations row on finished/confirmed payment status.

const AMOUNT_TO_PLAN: Record<number, string> = {
  199: 'cloud-team',
  899: 'cloud-org',
  2400: 'cloud-enterprise',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortObject(obj[k]);
        return acc;
      }, {});
  }
  return value;
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right || left.length !== right.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(left, 'hex'),
      Buffer.from(right, 'hex'),
    );
  } catch {
    return false;
  }
}

function verifySignature(
  rawBody: string,
  payload: unknown,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const sorted = JSON.stringify(sortObject(payload));
  const expected = crypto
    .createHmac('sha512', secret.trim())
    .update(sorted)
    .digest('hex');
  if (timingSafeHexEqual(expected, signature)) return true;
  // Defensive fallback: some IPN flows hash the raw body directly.
  const rawExpected = crypto
    .createHmac('sha512', secret.trim())
    .update(rawBody)
    .digest('hex');
  return timingSafeHexEqual(rawExpected, signature);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400 },
    );
  }

  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  const signature = req.headers.get('x-nowpayments-sig');

  if (!secret) {
    // Acknowledge but mark unverified so the provider stops retrying.
    console.warn(
      '[NOWPAYMENTS_WEBHOOK] received IPN with no NOWPAYMENTS_IPN_SECRET configured',
    );
    return NextResponse.json(
      {
        ok: true,
        verified: false,
        warning: 'NOWPAYMENTS_IPN_SECRET not set; signature not verified.',
        order_id: payload.order_id ?? null,
      },
      { status: 200 },
    );
  }

  const verified = verifySignature(rawBody, payload, signature, secret);
  const orderId =
    typeof payload.order_id === 'string'
      ? payload.order_id
      : typeof payload.payment_id === 'string'
      ? payload.payment_id
      : null;
  const status =
    typeof payload.payment_status === 'string'
      ? payload.payment_status
      : null;

  if (!verified) {
    console.warn(
      '[NOWPAYMENTS_WEBHOOK] signature verification FAILED order=%s status=%s',
      orderId,
      status,
    );
    return NextResponse.json(
      { ok: false, verified: false, error: 'invalid_signature' },
      { status: 401 },
    );
  }

  console.info(
    '[NOWPAYMENTS_WEBHOOK] verified IPN order=%s status=%s',
    orderId,
    status,
  );

  const isPaid = ['finished', 'confirmed'].includes(
    (status ?? '').toLowerCase(),
  );

  let activated = false;
  if (isPaid && orderId) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const sql = postgres(dbUrl, { max: 1, idle_timeout: 5 });
      try {
        const rawAmount =
          typeof payload.price_amount === 'number'
            ? payload.price_amount
            : typeof payload.price_amount === 'string'
            ? parseFloat(payload.price_amount)
            : 0;
        const amountUsd = Math.round(rawAmount) || null;
        const plan = (amountUsd ? AMOUNT_TO_PLAN[amountUsd] : null) ?? null;

        // Activate existing pending row. Idempotent: no-op if already active.
        const result = await sql`
          UPDATE cloud_tier_activations
             SET status       = 'active',
                 activated_at = NOW()
           WHERE order_id = ${orderId}
             AND status != 'active'
        `;
        activated = result.count > 0;

        if (!activated) {
          // Check if row exists but was already active (replay case).
          const [existing] = await sql<{ status: string }[]>`
            SELECT status FROM cloud_tier_activations WHERE order_id = ${orderId} LIMIT 1
          `;
          activated = existing?.status === 'active';
        }

        if (!activated) {
          // No checkout row — insert directly so the payment is never lost.
          await sql`
            INSERT INTO cloud_tier_activations (order_id, plan, amount_usd, status, activated_at)
            VALUES (${orderId}, ${plan}, ${amountUsd}, 'active', NOW())
          `;
          activated = true;
        }

        console.info(
          '[NOWPAYMENTS_WEBHOOK] activation order=%s plan=%s amount=%s activated=%s',
          orderId, plan, amountUsd, activated,
        );
      } catch (err) {
        console.error('[NOWPAYMENTS_WEBHOOK] db_error:', err);
      } finally {
        await sql.end({ timeout: 3 });
      }
    } else {
      console.warn('[NOWPAYMENTS_WEBHOOK] DATABASE_URL not set; skipping activation');
    }
  }

  return NextResponse.json(
    {
      ok: true,
      verified: true,
      order_id: orderId,
      status,
      activated,
    },
    { status: 200 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      route: 'POST /api/webhooks/nowpayments',
      verifies: 'x-nowpayments-sig HMAC-SHA512',
      env_required: ['NOWPAYMENTS_IPN_SECRET'],
    },
    { status: 200 },
  );
}
