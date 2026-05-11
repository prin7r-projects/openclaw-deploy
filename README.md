# OpenClaw Deploy

> **Declarative agent fleets. Reconciled.**

OpenClaw Deploy is a declarative control plane for OpenClaw, Hermes, and NanoClaw agent fleets — across mixed Incus, Docker, and VPS targets. You hand it a 14-line `fleet.yaml`. It reconciles your running fleet to match. OAuth rotation, multi-target placement, per-agent cost telemetry — included.

- **Live landing**: <https://openclaw-deploy.prin7r.com>
- **Notion opportunity**: <https://www.notion.so/OpenClaw-deployment-management-3593ceec26198160be33c7a88f5abcac>
- **License**: MIT

## Why this exists

Today, spinning up an OpenClaw / Hermes / NanoClaw fleet means: manual Incus or Docker provisioning, manual env-key wiring, per-agent OAuth-token wiring, and bash scripts that fail at 03:00 during quarterly token rotation. There is no unified surface to declare "I want N agents of type X with profile Y" and have them appear, scale, and report health.

OpenClaw Deploy is that surface. It is the **reconciliation loop** that an agent-fleet operator needs at 03:00 when an OAuth token expires across nineteen NanoClaw containers and three Incus profiles.

## Repo layout

```
openclaw-deploy/
├─ apps/
│  ├─ landing/        Next.js 15 + Tailwind + ShadCN-style components (this wave)
│  └─ api/            Bun + Hono control plane stub (Wave 2 placeholder)
├─ docs/              The 10 strategy/design docs + pitch deck
├─ Dockerfile.landing Multistage Next.js standalone build
├─ docker-compose.yml Single-service deploy with Traefik labels
└─ .github/workflows/ landing-build CI
```

The full reconciler, manifest validation, and driver layer described in [`docs/02-architecture.md`](./docs/02-architecture.md) are scaffolded for a follow-up wave. This wave ships the brand, the docs, the marketing landing, and an API stub.

## Documentation

The `/docs/` folder contains the 10 strategy and design documents that drive this project:

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

### Docker (production-style local)

```bash
docker compose build
docker compose up -d
# Landing → http://localhost (when behind Traefik)
```

## Deployment

The landing is deployed to `openclaw-deploy.prin7r.com` on `storage-contabo` (Contabo VPS, 161.97.99.120) via Docker Compose behind a Dokploy-managed Traefik with Let's Encrypt TLS. Wildcard DNS for `*.prin7r.com` is already in place — no per-subdomain DNS work is required.

```bash
ssh storage-contabo
sudo mkdir -p /opt/prin7r-deploys/openclaw-deploy
cd /opt/prin7r-deploys/openclaw-deploy
git clone https://github.com/prin7r-projects/openclaw-deploy.git .
docker compose build
docker compose up -d
curl -sI https://openclaw-deploy.prin7r.com  # → HTTP/2 200
```

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

The reconciler, manifest validator, drivers (Incus / Docker / VPS), CLI binary `occ`, and operator dashboard are scheduled for a follow-up wave.

## License

MIT — see [`LICENSE`](./LICENSE).
