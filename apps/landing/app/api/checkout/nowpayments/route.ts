import { NextResponse } from 'next/server';

// [NOWPAYMENTS_INTEGRATION] /apps/landing/app/api/checkout/nowpayments/route.ts
// Creates a hosted-invoice via NOWPayments. Self-hosted/install.sh path stays
// free; only the Cloud tier should hit this endpoint.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CloudPlan = 'cloud-team' | 'cloud-org' | 'cloud-enterprise';

type PlanConfig = {
  id: CloudPlan;
  amount: number; // USD
  description: string;
};

const PLAN_TABLE: Record<CloudPlan, PlanConfig> = {
  'cloud-team': {
    id: 'cloud-team',
    amount: 199,
    description: 'OpenClaw Deploy — Team (cloud) — 1 month',
  },
  'cloud-org': {
    id: 'cloud-org',
    amount: 899,
    description: 'OpenClaw Deploy — Org (cloud) — 1 month',
  },
  'cloud-enterprise': {
    id: 'cloud-enterprise',
    amount: 2400,
    description: 'OpenClaw Deploy — Enterprise (cloud) — 1 month deposit',
  },
};

function siteOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (env) return env;
  try {
    return new URL(req.url).origin;
  } catch {
    return 'https://openclaw-deploy.prin7r.com';
  }
}

function generateOrderId(plan: CloudPlan): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `ocd-${plan}-${ts}-${rand}`;
}

export async function POST(req: Request) {
  let payload: { plan?: string };
  try {
    payload = (await req.json()) as { plan?: string };
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Request body must be JSON.' },
      { status: 400 },
    );
  }

  const planInput = (payload.plan ?? 'cloud-team').toString();
  const normalized = planInput === 'cloud' ? 'cloud-team' : planInput;
  const config = PLAN_TABLE[normalized as CloudPlan];

  if (!config) {
    return NextResponse.json(
      {
        error: 'unknown_plan',
        message: `Unknown plan "${planInput}". Valid: cloud-team, cloud-org, cloud-enterprise.`,
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'missing_env',
        message:
          'NOWPAYMENTS_API_KEY is not set on the server. Add it to /opt/prin7r-deploys/openclaw-deploy/.env and redeploy.',
      },
      { status: 503 },
    );
  }

  const baseUrl = siteOrigin(req);
  const orderId = generateOrderId(config.id);

  const sandbox = process.env.NOWPAYMENTS_SANDBOX === 'true';
  const apiBase = sandbox
    ? 'https://api-sandbox.nowpayments.io/v1'
    : 'https://api.nowpayments.io/v1';

  const body = {
    price_amount: config.amount,
    price_currency: 'usd',
    pay_currency: 'usdttrc20',
    ipn_callback_url: `${baseUrl}/api/webhooks/nowpayments`,
    order_id: orderId,
    order_description: config.description,
    success_url: `${baseUrl}/?checkout=success&order=${orderId}`,
    cancel_url: `${baseUrl}/?checkout=cancelled&order=${orderId}`,
    is_fixed_rate: false,
    is_fee_paid_by_user: false,
  };

  let providerResponse: Response;
  try {
    providerResponse = await fetch(`${apiBase}/invoice`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'provider_unreachable',
        message: 'Could not reach NOWPayments API.',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  const text = await providerResponse.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!providerResponse.ok) {
    return NextResponse.json(
      {
        error: 'provider_error',
        status: providerResponse.status,
        provider_response: data,
      },
      { status: 502 },
    );
  }

  const invoiceUrl =
    typeof data.invoice_url === 'string'
      ? data.invoice_url
      : typeof data.payment_url === 'string'
      ? data.payment_url
      : '';
  const providerId =
    typeof data.id === 'string' || typeof data.id === 'number'
      ? String(data.id)
      : '';

  if (!invoiceUrl) {
    return NextResponse.json(
      {
        error: 'missing_invoice_url',
        message: 'NOWPayments accepted the request but did not return an invoice_url.',
        provider_response: data,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    plan: config.id,
    order_id: orderId,
    provider_invoice_id: providerId,
    invoice_url: invoiceUrl,
    sandbox,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      route: 'POST /api/checkout/nowpayments',
      accepted_plans: Object.keys(PLAN_TABLE),
      example_request: { plan: 'cloud-team' },
    },
    { status: 200 },
  );
}
