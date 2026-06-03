/**
 * [PRI-3650 — openclaw-deploy (Cold Iron)] sandbox DB bootstrap.
 *
 * Idempotent loader used by the Tier-A sandbox proof. It:
 *   1. Connects to the control-plane Postgres via $DATABASE_URL.
 *   2. Creates the per-project sandbox DB `openclaw_deploy_pri3650` if absent
 *      (guarded by a pg_database existence check — safe to re-run).
 *   3. Materializes an idempotent `cloud_tier_activations` table in the sandbox.
 *
 * NOTE ON SCOPE (PRI-3751):
 *   The production route apps/landing/app/api/webhooks/nowpayments/route.ts now
 *   HMAC-SHA512-verifies the IPN AND, on a finished/confirmed payment, activates
 *   the matching cloud_tier_activations row (status->'active', activated_at->NOW())
 *   at the tier implied by price_amount ($199/$899/$2400), idempotently. This table
 *   is the activation store the route writes to and the test reads back from.
 *
 * Run standalone:
 *   DATABASE_URL=... node __tests__/pri3650-setup.mjs
 * It is also import-safe (no top-level side effects on import).
 */
import postgres from "postgres";

export const SANDBOX_DB = "openclaw_deploy_pri3650";

export function sandboxUrl() {
  const ctrl =
    process.env.PRI3650_DB_URL ??
    process.env.DATABASE_URL ??
    "postgres://inkus:pw@postgres:5432/paperclip";
  if (process.env.PRI3650_DB_URL) return process.env.PRI3650_DB_URL;
  return ctrl.replace(/\/paperclip(\?|$)/, `/${SANDBOX_DB}$1`);
}

/** Create the sandbox DB on the control-plane host if it does not exist. */
export async function ensureSandboxDatabase() {
  const ctrl =
    process.env.DATABASE_URL ?? "postgres://inkus:pw@postgres:5432/paperclip";
  const admin = postgres(ctrl, { max: 1 });
  try {
    const exists = await admin`SELECT 1 FROM pg_database WHERE datname = ${SANDBOX_DB}`;
    if (exists.length === 0) {
      await admin.unsafe(`CREATE DATABASE ${SANDBOX_DB}`);
    }
  } finally {
    await admin.end({ timeout: 5 });
  }
}

/**
 * Idempotent DDL inside the sandbox DB. Creates the activation table the route
 * writes to on a verified finished/confirmed IPN; the test reads it back to
 * assert the row transitioned to status='active' with activated_at set.
 */
export async function ensureSchema(url = sandboxUrl()) {
  const sql = postgres(url, { max: 1 });
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS cloud_tier_activations (
        id            bigserial PRIMARY KEY,
        order_id      text NOT NULL,
        plan          text,
        amount_usd    integer,
        status        text NOT NULL DEFAULT 'pending',
        activated_at  timestamptz,
        created_at    timestamptz NOT NULL DEFAULT now()
      )
    `);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function bootstrap() {
  await ensureSandboxDatabase();
  await ensureSchema();
}

// Allow `node __tests__/pri3650-setup.mjs` to run the bootstrap directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrap()
    .then(() => {
      console.log(`[pri3650-setup] sandbox ready: ${SANDBOX_DB}`);
    })
    .catch((err) => {
      console.error("[pri3650-setup] FAILED:", err);
      process.exit(1);
    });
}
