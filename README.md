# OpenClaw Deploy

> **Declarative agent fleets. Reconciled.**

OpenClaw Deploy is a declarative control plane for OpenClaw, Hermes, and NanoClaw agent fleets — across mixed Incus, Docker, and VPS targets. You hand it a 14-line `fleet.yaml`. It reconciles your running fleet to match. OAuth rotation, multi-target placement, per-agent cost telemetry — included.

- **Live landing**: <https://openclaw-deploy.prin7r.com>
- **Notion opportunity**: <https://www.notion.so/OpenClaw-deployment-management-3593ceec26198160be33c7a88f5abcac>
- **License**: MIT

## Clean OpenClaw deploy gate

Current fallback work is gated by [`docs/14-audit-cold-iron-t01.md`](./docs/14-audit-cold-iron-t01.md).
That runbook is the only authorized deployment slice in this repository until
the older control-plane/fleet material is reconciled with the Prin7r policy.

Allowed deployment modes for OpenClaw production are:

- bare-metal systemd running a plain OpenClaw gateway with MCP servers, skills,
  tools, and the native Telegram channel;
- a plain Incus container running the same clean OpenClaw shape.

Forbidden deployment layers are listed in the audit runbook. Alex/Katya
production is server 171 only from `/Users/keer/projects/simple-agent-deploy`;
the old host is decommissioned.

## Why this exists

Today, spinning up an OpenClaw / Hermes / NanoClaw fleet means: manual Incus or Docker provisioning, manual env-key wiring, per-agent OAuth-token wiring, and bash scripts that fail at 03:00 during quarterly token rotation. There is no unified surface to declare "I want N agents of type X with profile Y" and have them appear, scale, and report health.

OpenClaw Deploy is that surface. It is the **reconciliation loop** that an agent-fleet operator needs at 03:00 when an OAuth token expires across nineteen NanoClaw containers and three Incus profiles.

## Repo layout

```
openclaw-deploy/
├─ apps/
│  ├─ landing/        Next.js 15 + Tailwind + ShadCN-style components (this wave)
│  └─ api/            Bun + Hono control plane stub (Wave 2 placeholder)
├─ docs/              Strategy/design docs, pitch deck, and clean deploy audit gate
├─ Dockerfile.landing Multistage Next.js standalone build
├─ docker-compose.yml Single-service deploy with Traefik labels
└─ .github/workflows/ landing-build CI
```

The full reconciler, manifest validation, and driver layer described in [`docs/02-architecture.md`](./docs/02-architecture.md) are scaffolded for a follow-up wave. This wave ships the brand, the docs, the marketing landing, and an API stub.

## Documentation

The `/docs/` folder contains the strategy and design documents that drive this project:

1. [`01-brand-identity.md`](./docs/01-brand-identity.md) — Cold Iron palette, Space Grotesk + Inter + JetBrains Mono, brand pyramid
2. [`02-architecture.md`](./docs/02-architecture.md) — System diagram, components, data flow, deploy topology
3. [`03-user-journeys.md`](./docs/03-user-journeys.md) — Discovery → first value → recurring use
4. [`04-pain-points.md`](./docs/04-pain-points.md) — Root-cause analysis of operator pain
5. [`05-audience-profile.md`](./docs/05-audience-profile.md) — ICP, Maya the Fleet SRE, Sasha the Solo Builder
6. [`06-sales-channels.md`](./docs/06-sales-channels.md) — Channel mix and ramp by quarter
7. [`07-sales-strategy.md`](./docs/07-sales-strategy.md) — Pricing, motion, objection handling
8. [`08-marketing-strategy.md`](./docs/08-marketing-strategy.md) — Positioning, content pillars, launch sequence
9. [`09-go-to-market.md`](./docs/09-go-to-market.md) — 90-day plan
10. [`10-pitch-deck.md`](./docs/10-pitch-deck.md) — 10-slide deck (with companion `pitch-deck.html`)
11. [`14-audit-cold-iron-t01.md`](./docs/14-audit-cold-iron-t01.md) — Clean OpenClaw deployment preflight, command gates, and blocker list

## Local development

### Landing site

```bash
cd apps/landing
pnpm install
pnpm dev
# → http://localhost:3000
```

### Control plane API stub

```bash
cd apps/api
bun install
bun run dev
# → http://localhost:8787
curl -s http://localhost:8787/healthz
# → {"status":"ok","service":"openclaw-deploy-api"}
```

### Python game

```bash
python3 games/starfall.py
python3 games/starfall.py --demo --seed 7 --turns 5
```

### Docker artifacts

Docker and compose artifacts exist in the repository from the older landing
deployment path, but they are not an authorized OpenClaw production deployment
path. Do not edit `Dockerfile*`, `docker-compose.yml`, `install.sh`, or
deploy/runtime scripts as part of the clean OpenClaw fallback slice.

## Deployment

Production deployment from this repository is blocked until the gates in
[`docs/14-audit-cold-iron-t01.md`](./docs/14-audit-cold-iron-t01.md) pass.

The authorized path is plain OpenClaw only:

1. Choose bare-metal systemd or a plain Incus container.
2. Load required secrets from `/Users/keer/.nth-kir-keys.env` without copying
   them into this repository.
3. Verify OpenClaw gateway, MCP servers, skills, tools, and native Telegram
   channel directly.
4. Prove behavior with loopback/OpenClaw command smoke tests before any public
   channel test.

Do not deploy this project through any forbidden layer listed in the audit
runbook.

## Brand

OpenClaw Deploy uses the **Cold Iron** palette (near-black + phosphor green) with Space Grotesk display, Inter body, and JetBrains Mono for code. The full system is documented in [`docs/01-brand-identity.md`](./docs/01-brand-identity.md), and the canonical design + style guide is at [`DESIGN.md`](./DESIGN.md).

## Screenshots

Captured from the live deploy with Playwright. Re-runnable via `node scripts/capture-screenshots.mjs`.

**Desktop** (1440×900):

![OpenClaw Deploy — desktop landing](./docs/screenshots/landing-desktop.png)

**Mobile** (390×844):

![OpenClaw Deploy — mobile landing](./docs/screenshots/landing-mobile.png)

## Payments

Cloud tiers route through NOWPayments hosted invoices. Self-hosted (the `install.sh` path) is free. The integration lives at:

- `apps/landing/app/api/checkout/nowpayments/route.ts` — creates the hosted invoice, returns `{invoice_url}` for the browser to redirect to.
- `apps/landing/app/api/webhooks/nowpayments/route.ts` — IPN webhook stub that verifies `x-nowpayments-sig` HMAC-SHA512.

Required env (set on the server's `/opt/prin7r-deploys/openclaw-deploy/.env`, NEVER committed):

```bash
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
NOWPAYMENTS_SANDBOX=false
```

Without these vars, the route returns a clear 503 with `{error: 'missing_env'}` and the Pricing CTAs surface a tasteful inline error.

## Status

Wave 2 batch 1, May 2026 — landing live, docs complete, control plane API stubbed.
June 2, 2026 fallback slice added a clean OpenClaw deployment gate and marked
the older control-plane/fleet deployment story as blocked until policy cleanup.

The reconciler, manifest validator, drivers (Incus / Docker / VPS), CLI binary `occ`, and operator dashboard are scheduled for a follow-up wave.

## License

MIT — see [`LICENSE`](./LICENSE).
