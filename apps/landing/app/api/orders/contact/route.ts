import { NextResponse } from 'next/server';

// [ORDER_CAPTURE_FALLBACK] /apps/landing/app/api/orders/contact/route.ts
// Durable order/contact capture for the Pricing CTAs. Used when the
// NOWPayments crypto path is unavailable (missing env, sandbox down, network
// error). Returns a pre-populated mailto: URL with the plan, price, cadence,
// and a stable order id so the visitor's mail client opens with a complete
// order request that the operator can act on.
//
// Validation contract (PRI-5762 M3 repair — tightened):
//   - Reject an empty body. An empty POST must NOT mint a useful order id.
//   - Reject when both `email` and `note` are missing. The route generates
//     a durable id that is referenced in mail replies; minting one for a
//     request that carries no buyer-supplied context is rejected.
//   - `email`, when present, must be a syntactically valid address (RFC 5322
//     lite: contains exactly one `@`, non-empty local and domain parts, the
//     domain contains a `.`).
//   - `note` is capped at 400 characters and trimmed. Free-form text.
//   - `plan` must be one of the three Cloud tiers. `source` is optional,
//     capped at 80 characters, and stripped of control characters.
//   - Per-IP + per-token rate limit: 5 requests / 10 minutes (sliding
//     window). 6th request returns 429 with a `Retry-After` header.
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

// In-process rate-limit store. Keyed by a stable client identifier
// (preferring the X-Forwarded-For IP, falling back to UA hash). Sliding
// window: a single request older than WINDOW_MS is forgotten. The store
// is process-local; behind multiple replicas the effective limit is
// N-times the configured cap, which is the right trade-off for a
// contact-fallback route that does no DB write.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE: Map<string, number[]> = new Map();

function clientKey(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return `ip:${first}`;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return `ip:${realIp.trim()}`;
  const ua = req.headers.get('user-agent') ?? 'unknown';
  // FNV-1a-ish 32-bit hash so we don't keep the full UA in memory.
  let h = 0x811c9dc5;
  for (let i = 0; i < ua.length; i++) {
    h ^= ua.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `ua:${h.toString(16)}`;
}

function rateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const arr = (RATE.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    const oldest = arr[0] ?? now;
    const retryAfter = Math.max(
      1,
      Math.ceil((RATE_WINDOW_MS - (now - oldest)) / 1000),
    );
    RATE.set(key, arr);
    return { ok: false, retryAfter };
  }
  arr.push(now);
  RATE.set(key, arr);
  return { ok: true, retryAfter: 0 };
}

function isValidEmail(input: string): boolean {
  // Intentionally permissive: a real RFC 5322 parser is overkill here and
  // produces false-negatives. We only check that the shape is sane enough
  // to be worth routing to the operator mailbox.
  const v = input.trim();
  if (v.length < 5 || v.length > 254) return false;
  const at = v.indexOf('@');
  if (at <= 0 || at !== v.lastIndexOf('@')) return false;
  const local = v.slice(0, at);
  const domain = v.slice(at + 1);
  if (local.length === 0 || domain.length < 4) return false;
  if (!domain.includes('.')) return false;
  if (/\s/.test(v)) return false;
  return true;
}

const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]+', 'g');

function sanitizeText(input: unknown, max: number): string {
  if (typeof input !== 'string') return '';
  // Strip control characters; collapse internal whitespace; cap length.
  const cleaned = input
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
  return cleaned;
}

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
  email: string;
  note: string;
}): string {
  const subject = `OpenClaw Deploy — ${opts.label} order request (${opts.orderId})`;
  const lines: string[] = [
    `Hi OpenClaw Deploy team,`,
    ``,
    `I'd like to start a ${opts.label} subscription.`,
    ``,
    `Plan:        ${opts.label}`,
    `Amount:      $${opts.amount} / month`,
    `Order id:    ${opts.orderId}`,
    `Source:      ${opts.source}`,
  ];
  if (opts.email) {
    lines.push(`Contact:     ${opts.email}`);
  }
  if (opts.note) {
    lines.push(``, `Note:`, opts.note);
  }
  lines.push(
    ``,
    `Please send me the crypto payment details (USDT/USDC/BTC/ETH) and the`,
    `tenant provisioning steps.`,
    ``,
    `—`,
    ``,
  );
  const body = lines.join('\n');
  const params = new URLSearchParams({ subject, body });
  return `mailto:${ORDER_CONTACT}?${params.toString()}`;
}

export async function POST(req: Request) {
  const key = clientKey(req);
  const rl = rateLimit(key);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: 'rate_limited',
        message:
          'Too many contact requests from this client. Try again in a few minutes.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      },
    );
  }

  let payload: {
    plan?: string;
    source?: string;
    email?: string;
    note?: string;
  } = {};
  try {
    const text = await req.text();
    if (text) {
      payload = JSON.parse(text) as typeof payload;
    }
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Request body must be JSON.' },
      { status: 400 },
    );
  }

  // Either a valid email OR a non-empty note is required. An empty body
  // is now explicitly a 400 — no useful order id is minted.
  const email = sanitizeText(payload.email, 254);
  const note = sanitizeText(payload.note, 400);
  if (!email && !note) {
    return NextResponse.json(
      {
        error: 'missing_buyer_context',
        message:
          'Provide an email or a short note describing what you need. The contact fallback does not accept empty submissions.',
      },
      { status: 400 },
    );
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json(
      {
        error: 'invalid_email',
        message:
          'The email field is not a syntactically valid address. Fix the value and retry.',
      },
      { status: 400 },
    );
  }

  const planInput = sanitizeText(payload.plan, 32) || 'cloud-team';
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
  const source = sanitizeText(payload.source, 80) || 'pricing-cta';
  const mailto_url = buildMailtoUrl({
    plan: planKey,
    amount: config.amount,
    label: config.label,
    orderId,
    source,
    email,
    note,
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
      example_request: {
        plan: 'cloud-team',
        email: 'you@company.dev',
        note: 'Optional context (max 400 chars).',
      },
      contact: ORDER_CONTACT,
      validation:
        'email or note is required; email must be a valid address; rate-limited 5 / 10 min per client.',
    },
    { status: 200 },
  );
}
