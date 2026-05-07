import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

// [NOWPAYMENTS_INTEGRATION] /apps/landing/app/api/webhooks/nowpayments/route.ts
// IPN webhook stub. Verifies x-nowpayments-sig HMAC-SHA512 over the JSON body
// after NOWPayments' canonical key sort. Stub does not yet persist orders —
// that is the job of the Wave 3 control plane.

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

  // TODO (Wave 3 control plane): persist order, mark paid on `finished`/`confirmed`,
  // emit downstream provisioning event for the cloud tenant.
  return NextResponse.json(
    {
      ok: true,
      verified: true,
      order_id: orderId,
      status,
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
