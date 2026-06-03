import { NextResponse } from 'next/server';

// [ORDER_CAPTURE_FALLBACK] /apps/landing/app/api/orders/contact/route.ts
// Durable order/contact capture for the Pricing CTAs. Used when the
// NOWPayments crypto path is unavailable (missing env, sandbox down, network
// error). Returns a pre-populated mailto: URL with the plan, price, cadence,
// and a stable order id so the visitor's mail client opens with a complete
// order request that the operator can act on.
//
// No external SaaS and no DB writes — matches the OpenClaw Plane-B (web
// tier) deploy policy. If a future wave wants durable persistence, plug a
// Postgres write in here without changing the response shape.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CloudPlan = 'cloud-team' | 'cloud-org' | 'cloud-enterprise';

const PLAN_TABLE: Record<CloudPlan, { amount: number; label: string }> = {
  'cloud-team': { amount: 199, label: 'Cloud · Team' },
  'cloud-org': { amount: 899, label: 'Cloud · Org' },
  'cloud-enterprise': { amount: 2400, label: 'Cloud · Enterprise' },
};

const ORDER_CONTACT = 'kee22r@gmail.com';

function generateOrderId(plan: CloudPlan): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `ocd-${plan}-contact-${ts}-${rand}`;
}

function buildMailtoUrl(opts: {
  plan: CloudPlan;
  amount: number;
  label: string;
  orderId: string;
  source: string;
}): string {
  const subject = `OpenClaw Deploy — ${opts.label} order request (${opts.orderId})`;
  const body = [
    `Hi OpenClaw Deploy team,`,
    ``,
    `I'd like to start a ${opts.label} subscription.`,
    ``,
    `Plan:        ${opts.label}`,
    `Amount:      $${opts.amount} / month`,
    `Order id:    ${opts.orderId}`,
    `Source:      ${opts.source}`,
    ``,
    `Please send me the crypto payment details (USDT/USDC/BTC/ETH) and the`,
    `tenant provisioning steps.`,
    ``,
    `—`,
    ``,
  ].join('\n');
  const params = new URLSearchParams({ subject, body });
  return `mailto:${ORDER_CONTACT}?${params.toString()}`;
}

export async function POST(req: Request) {
  let payload: { plan?: string; source?: string } = {};
  try {
    const text = await req.text();
    if (text) {
      payload = JSON.parse(text) as { plan?: string; source?: string };
    }
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Request body must be JSON.' },
      { status: 400 },
    );
  }

  const planInput = (payload.plan ?? 'cloud-team').toString();
  const normalized = planInput === 'cloud' ? 'cloud-team' : planInput;
  const planKey = normalized as CloudPlan;
  const config = PLAN_TABLE[planKey];
  if (!config) {
    return NextResponse.json(
      {
        error: 'unknown_plan',
        message: `Unknown plan "${planInput}". Valid: cloud-team, cloud-org, cloud-enterprise.`,
      },
      { status: 400 },
    );
  }

  const orderId = generateOrderId(planKey);
  const source = (payload.source ?? 'pricing-cta').toString().slice(0, 80);
  const mailto_url = buildMailtoUrl({
    plan: planKey,
    amount: config.amount,
    label: config.label,
    orderId,
    source,
  });

  return NextResponse.json({
    ok: true,
    plan: planKey,
    order_id: orderId,
    contact: ORDER_CONTACT,
    mailto_url,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      route: 'POST /api/orders/contact',
      accepted_plans: Object.keys(PLAN_TABLE),
      example_request: { plan: 'cloud-team' },
      contact: ORDER_CONTACT,
    },
    { status: 200 },
  );
}
