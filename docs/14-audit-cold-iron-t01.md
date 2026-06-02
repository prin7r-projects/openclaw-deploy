# 14 · Cold Iron T01 — Repository Audit (Wave 2 Track A)

> **Source issue:** PRI-3280 — Cold Iron T01: Audit repository structure and current implementation
> (Track A, Wave 2, parent PRI-2910).
> **Mode:** discovery — produce an implementation map for a clean OpenClaw Deploy and
> identify the missing pieces before editing.
> **Last verified:** 2026-06-02, `main @ 909b083` (`bd init: initialize beads issue tracking`).
> **Live:** https://openclaw-deploy.prin7r.com (HTTP/2 200; operator UI + API surface live).

## 1. Repo at a glance

```
openclaw-deploy/
├─ apps/
│  ├─ landing/        Next.js 15 marketing site (DEPLOYED)
│  ├─ api/            Hono + tsx control plane on :8787 (DEPLOYED)
│  ├─ occ/            Bun-compiled CLI binary "occ" (source only)
│  └─ operator-ui/    Next.js 15 admin dashboard at /operator (DEPLOYED)
├─ docs/              01–13 strategy/design docs + DESIGN.md + screenshots
├─ examples/          fleet.yaml manifest example (14 lines)
├─ games/             starfall.py + rover_quest.py (Python stdlib games)
├─ tests/             pytest suite for the Python games (9/9 pass)
├─ monitoring/        grafana-dashboard.json
├─ scripts/           capture-screenshots.mjs (Playwright)
├─ install.sh         curl-pipe-bash one-liner that clones + compose-builds
├─ docker-compose.yml landing + api + operator-ui behind Traefik (LE TLS)
├─ Dockerfile.{landing,api,operator-ui}  multistage Node 22 / 20 images
├─ .github/workflows/ landing-build.yml only (apps/api + operator-ui have no CI)
├─ .beads/            bd issues + Dolt sync config
├─ .env.example       NOWPAYMENTS, VAULT, RECONCILE knobs
├─ AGENTS.md          agent rules; bd workflow, non-interactive shell rules
├─ CLAUDE.md          same agent rules under the Claude name
├─ DESIGN.md          canonical Cold Iron design + style guide (15 sections)
├─ README.md          repo summary + deploy steps
└─ LICENSE            MIT
```

Top-level `package.json` has a single root dep on `ssh2` for the VPS executor — there is no
monorepo workspace tool (no pnpm-workspace.yaml, no turbo, no nx). Each app pins its own
package manager: `apps/landing` and `apps/operator-ui` use **pnpm@9.15.4**; `apps/api` uses
**npm**; `apps/occ` uses **bun**. Be aware before adding cross-app scripts.

## 2. App entrypoints

| App | Entrypoint | Port | Build | Dev | Notes |
|---|---|---|---|---|---|
| `apps/landing` | `app/page.tsx` | 3000 | `pnpm build` (Next standalone) | `pnpm dev` | Next 15 / React 19 / Tailwind 3.4 |
| `apps/api` | `src/index.ts` | 8787 | `tsc` (noEmit) | `pnpm dev` → `tsx watch src/index.ts` | Hono 4.6 + libSQL/Turso (file://) + Drizzle 0.38 |
| `apps/occ` | `src/index.ts` | — | `bun build --compile --outfile dist/occ` | `bun run src/index.ts` | CLI: `login` / `apply` / `plan` / `targets add` / `rotate` / `status` |
| `apps/operator-ui` | `app/page.tsx` | 3001 | `pnpm build` (Next standalone, `basePath:/operator`) | `pnpm dev` | Mirrors landing tokens; reads `NEXT_PUBLIC_API_URL` |

API routes (`apps/api/src/routes/`):

```
GET    /                                  -> service descriptor
GET    /healthz                           -> {status:"ok"}
POST   /api/auth/login                    -> {token, user}
POST   /api/auth/tokens                   -> {token}
GET    /api/v1/fleets                     -> list fleets (auth)
GET    /api/v1/fleets/:id                 -> fleet + agents + pods + targets
POST   /api/v1/fleets/:id/apply           -> {reconcile_id, plan_diff}
POST   /api/v1/fleets/:id/rotate          -> {reconcile_id}
GET    /api/v1/reconciles/:id             -> {status, events}
GET    /api/v1/reconciles/events          -> audit log
POST   /api/v1/webhooks                   -> {webhook_id}     [STUB — not persisted]
GET    /api/v1/secrets                    -> list secrets
GET    /api/v1/secrets/agent/:agentId     -> agent secrets
GET    /api/v1/secrets/expiring           -> T-24h list
POST   /api/v1/secrets/:secretId/rotate   -> rotate one secret
GET    /api/v1/secrets/cost/fleet/:id     -> cost summary    [namespace oddity]
GET    /api/v1/secrets/cost/summary       -> totals          [namespace oddity]
GET    /api/v1/secrets/cost/agent/:id/can-schedule
GET    /api/v1/events/stream              -> SSE all events
GET    /api/v1/events/stream/:reconcileId -> SSE per-reconcile
GET    /api/v1/metrics                    -> Prometheus text
GET    /api/v1/metrics/json               -> JSON
POST   /api/checkout/nowpayments          -> hosted invoice (apps/api copy)
POST   /api/webhooks/nowpayments          -> IPN, x-nowpayments-sig HMAC-SHA512
```

Landing-side payment routes also exist at:

```
POST /api/checkout/nowpayments    apps/landing/app/api/checkout/nowpayments/route.ts
POST /api/webhooks/nowpayments    apps/landing/app/api/webhooks/nowpayments/route.ts
```

Note the **duplicate checkout endpoint** — the landing route is canonical (it ships the cloud
tier CTAs); the API copy was added later and is reachable through Traefik's `PathPrefix(/api)`
router (higher priority than the landing). Traefik routes `/api/*` to `apps/api` first, so
the landing's `POST /api/checkout/nowpayments` is currently **shadowed** in prod. Pricing
component still works because it posts to `/api/checkout/nowpayments` which lands on the
control-plane API (which returns the same `{invoice_url}` shape, with different plan IDs:
`cloud_team` / `cloud_org` / `cloud_enterprise` vs the landing's `cloud-team` etc.). **This
is a real divergence to file in a follow-up.**

## 3. Database & state

- libSQL/Turso file at `/app/data/coldiron.db` in the container, volume-mounted to
  `api-data` (see `docker-compose.yml`).
- Schema in `apps/api/src/db/schema.ts`: `users`, `fleets`, `agents`, `targets`, `pods`,
  `secrets`, `reconciles`, `events`, `api_tokens`. Indexes on `fleets.user_id`,
  `pods.agent_id`, `secrets.expires_at`, `events.at`.
- Raw `CREATE TABLE IF NOT EXISTS` mirrors the schema in `db/index.ts:initDatabase()` so a
  fresh deploy bootstraps without drizzle-kit migrations. Drizzle is used at the query layer
  only.
- Secrets encrypted with AES-GCM via Web Crypto, master key derived from
  `COLD_IRON_KEY_PASSPHRASE` via PBKDF2 (100k SHA-256, salt `coldiron-vault-salt`).

## 4. Deploy assets

| Asset | Purpose |
|---|---|
| `Dockerfile.landing` | 3-stage; Node 22 alpine + pnpm; produces Next standalone server on :3000 |
| `Dockerfile.operator-ui` | 3-stage; Node 22 alpine + pnpm; Next standalone on :3001 with `basePath=/operator` |
| `Dockerfile.api` | Node 20 slim + npm; `npx tsx src/index.ts` on :8787; volume `/app/data` for SQLite |
| `docker-compose.yml` | 3 services + 1 named volume; Traefik labels for `openclaw-deploy.prin7r.com` |
| `install.sh` | `curl -sSL .../install.sh \| bash`: clones repo to `${COLD_IRON_INSTALL_DIR:-/opt/coldiron}`, writes a default `.env`, `docker compose up -d` |
| `apps/landing/public/install.sh` | Static copy served at `/install.sh` — currently a smaller stub than the root one |
| `.github/workflows/landing-build.yml` | Only the landing has CI; runs `pnpm build` on push/PR |
| `scripts/capture-screenshots.mjs` | Re-runnable Playwright capture (1440×900 + 390×844) → `docs/screenshots/` |

Production deploy: `storage-contabo` VPS at `/opt/prin7r-deploys/openclaw-deploy/`, behind a
Dokploy-managed Traefik with Let's Encrypt R12 cert and wildcard `*.prin7r.com` DNS already in
place. Traefik routing rules (from `docker-compose.yml`):

- `Host(openclaw-deploy.prin7r.com)` → landing:3000 (priority default).
- `Host(...) && PathPrefix(/api)` → api:8787 (priority 2).
- `Host(...) && PathPrefix(/operator)` → operator:3001 (priority 2).

Live smoke (just verified):

```
$ curl -sI https://openclaw-deploy.prin7r.com           # → HTTP/2 200 (Cloudflare in front)
$ curl -sI https://openclaw-deploy.prin7r.com/operator  # → HTTP/2 200
$ curl -s  https://openclaw-deploy.prin7r.com/api       # → 200 application/json {service: "openclaw-deploy-api", ...}
$ curl -s  -o /dev/null -w "%{http_code}\n" https://openclaw-deploy.prin7r.com/api/v1/fleets
                                                          # → 401 (authMiddleware reachable)
$ curl -sI https://openclaw-deploy.prin7r.com/install.sh # → HTTP/2 200
```

## 5. Test commands

| Surface | Command | Status |
|---|---|---|
| Python games | `python3 -m pytest tests/ -q` | **9/9 pass** (verified 2026-06-02) |
| Starfall smoke | `python3 games/starfall.py --demo --seed 7 --turns 5` | **pass** (deterministic) |
| Rover Quest smoke | `python3 games/rover_quest.py --demo --seed 12 --turns 5` | not re-run this audit |
| API E2E | `cd apps/api && pnpm test:e2e` → `playwright test` | requires running API at `:8787` + operator at `:3001`; CI not wired |
| Landing build | `cd apps/landing && pnpm install && pnpm build` | runs in `.github/workflows/landing-build.yml` on every push |
| API build | `cd apps/api && tsc` (noEmit typecheck) | not in CI |
| operator-ui build | `cd apps/operator-ui && pnpm build` | not in CI |
| occ build | `cd apps/occ && bun build src/index.ts --compile --outfile dist/occ` | not in CI; produces a standalone binary |
| Lint | `cd apps/landing && pnpm lint`; `cd apps/operator-ui && pnpm lint` | wired in package.json; not enforced in CI |

There are **no unit/integration tests** for the TypeScript code — only Playwright HTTP-level
E2E specs (`coldiron.spec.ts` + scenarios A/C/E). A unit-test layer (vitest or bun:test) is a
gap for any non-trivial refactor of the reconciler or executors.

## 6. Implementation map vs. docs/02-architecture.md & docs/13-implementation-plan.md

The implementation plan calls Phase 0 (landing + crypto checkout) DONE and asks for Phases 1–6.
**What is actually shipped in `main` is closer to "all 6 phases scaffolded + landing + UI live".**

| Phase | Plan goal | Status in repo |
|---|---|---|
| 0 | Landing + NOWPayments | ✅ Live; `docs/screenshots/landing-{desktop,mobile}.png` checked in |
| 1 | `occ` CLI + control plane skeleton | ✅ `apps/occ/` and `apps/api/` exist with the spec'd verbs |
| 2 | Incus + Docker drivers + reconciler v0 | ✅ `apps/api/src/executors/{docker,incus}.ts` + `reconciler/index.ts` exist; reconciler runs every 30s, detects drift, scales pods up/down |
| 3 | VPS bootstrap driver | ✅ `apps/api/src/executors/vps.ts` (ssh2-based; cloud-init Docker install) |
| 4 | Vault + cost meter | ✅ `apps/api/src/vault/index.ts` (AES-GCM via Web Crypto) + `cost/index.ts` (in-memory) |
| 5 | Operator UI | ✅ `apps/operator-ui/` with dashboard / fleets / audit / costs / secrets + SSE consumer |
| 6 | Autoscale + metrics + Grafana | ✅ `coldiron_*` metrics + `monitoring/grafana-dashboard.json`; **dashboard expressions use `_` but `lib/metrics.ts` emits `.` separators — see §8 gap** |

Git log on `main` (most recent first) reflects the same sequence:

```
909b083 bd init: initialize beads issue tracking
beeaa2a Add rover quest Python game
21db257 Add Python terminal game
99c34e0 chore: update package-lock.json with playwright dep
5f59018 fix: deploy operator-ui + add E2E specs for scenarios A/C/E
71eeb20 feat: Phase 6 — autoscale, metrics, Grafana, E2E tests
56b9b56 feat: complete Phase 5 operator UI + add SSE streaming + drift detection
1c05480 Phase 4: Secret rotation + cost meter
28eac1b Phase 3: VPS bootstrap driver
2c98435 Remove stray file
```

So the README's "Wave 2 batch 1 — control plane API stubbed" line is **stale**: every phase up
through 6 is committed, and the control plane is fully scaffolded behind the live deploy.

## 7. Current gaps (must-fix-before-shipping list)

Ordered by blocking severity for a "clean OpenClaw Deploy plan + operator kit" delivery.

1. **`occ` distribution path is broken.**
   - `install.sh` prints `npm install -g @openclaw-deploy/occ`, but the package is **not
     published to npm** and `apps/occ/dist/occ` is **not committed**.
   - Self-hosters following `curl -sSL .../install.sh | bash` finish with a control plane
     they can't drive without manually `cd apps/occ && bun install && bun build ...`.
   - **Fix files:** `install.sh` (add a `bun`/`npm` build step or fetch from a GitHub Release),
     `apps/occ/package.json` (add a `build:release` script for the GitHub Actions artifact),
     and add a new `.github/workflows/occ-release.yml`.

2. **Webhook outbound dispatcher is a stub.**
   - `POST /api/v1/webhooks` returns a `webhook_id` but **does not persist** it. There is no
     `webhooks` table in `schema.ts` and no fan-out worker that signs `x-coldiron-sig`
     (HMAC-SHA256 over `t=<unix>,v1=...`) and POSTs to the registered URLs on
     `applied / drifted / reconciled / secret_rotated / cost_threshold_breached` events.
   - **Fix files:** `apps/api/src/db/schema.ts` (add `webhooks` table), `apps/api/src/routes/webhooks.ts` (persist + GET + DELETE), new `apps/api/src/lib/webhook-dispatcher.ts`, and wire it from `reconciler/index.ts` event-insert sites.

3. **Duplicate `POST /api/checkout/nowpayments` between landing and API; plan IDs diverge.**
   - Landing accepts `cloud-team / cloud-org / cloud-enterprise` (kebab) with prices
     199 / 899 / 2400; the API accepts `cloud_team / cloud_org / cloud_enterprise` (snake)
     with prices 49 / 199 / 499. Production traffic from the landing's `<Pricing>` button is
     served by the API route via Traefik's `/api/*` rule, so the landing form sends
     `cloud-team` but the API rejects it with `Invalid plan`. Hosted-invoice flow is **broken
     in production** for the cloud tiers.
   - **Fix files:** decide canonical owner (recommend `apps/landing/.../checkout` because the
     pricing tiers live there and the API has no UI), then delete `apps/api/src/routes/checkout.ts`
     (and remove the route registration in `apps/api/src/index.ts`) and update the
     `apps/api/src/routes/nowpayments-webhook.ts` to be the sole control-plane-side webhook
     receiver.

4. **Grafana dashboard / Prometheus metric-name mismatch.**
   - `apps/api/src/lib/metrics.ts` emits names like `coldiron.reconcile.duration_s`
     (dots). Prometheus rejects dots in metric names; even if the scrape parses the dotted
     line, Grafana panel expressions in `monitoring/grafana-dashboard.json` use
     `coldiron_reconcile_duration_s` (underscores). The metric route also has hand-written
     HELP/TYPE headers that list the underscore names, but the actual rendered lines have
     dots. So the dashboard panels will all read **No data**.
   - **Fix files:** `apps/api/src/lib/metrics.ts` (translate `.` → `_` at render time) and
     `apps/api/src/routes/metrics.ts` (make HELP/TYPE match the rendered names exactly).

5. **CI covers landing only.**
   - `.github/workflows/landing-build.yml` builds the landing on every push. There is **no
     workflow** to typecheck `apps/api`, build/lint `apps/operator-ui`, or run the
     Playwright E2E suite on PRs. A typo in the reconciler will currently ship to production
     unless caught by `docker compose build`.
   - **Fix files:** new `.github/workflows/api-typecheck.yml`, `operator-ui-build.yml`, and
     `e2e.yml` (the latter needs a Docker-compose'd API + operator-ui in CI).

6. **In-memory cost meter loses data on restart.**
   - `apps/api/src/cost/index.ts` keeps `costEntries: Array<...>` in module-level memory.
     `docker compose restart api` wipes the daily totals and the cost-cap reconciler will let
     scheduling resume even after a previously-tripped cap.
   - **Fix files:** add a `cost_entries` table to `schema.ts`, swap the array for a Drizzle
     insert/select; keep the in-memory accumulator as a per-process cache.

7. **`/api/v1/secrets/cost/*` namespace oddity.**
   - Cost endpoints are mounted under the `secrets` Hono sub-app because the cost-meter code
     lives next to the vault. The contract is now baked into operator-ui (`/cost/summary`)
     and the E2E specs, so this is a **deferred rename**, but flag it for a v0.5 cleanup with
     a 301 redirect.
   - **Fix files (deferred):** `apps/api/src/index.ts` (mount a new `/api/v1/costs` sub-app),
     plus matching client updates in `apps/operator-ui/app/page.tsx`,
     `apps/operator-ui/app/costs/page.tsx`, and `apps/api/e2e/coldiron.spec.ts`.

8. **README's status section is out of date.**
   - It still says "Wave 2 batch 1, May 2026 — landing live, docs complete, control plane
     API stubbed". The control plane API is no longer a stub; all of Phases 1–6 are committed.
   - **Fix files:** `README.md` lines 100-108.

9. **`docs/13-implementation-plan.md` Phase markers are stale.**
   - The plan still lists Phases 1–6 as TBD. Update to reflect that all are committed and
     re-scope the remaining work to: distribution (occ CLI), webhook fan-out, cost
     persistence, CI matrix, metric-name fix, Grafana dashboard, and any v2 features
     (multi-region, customer-bring-image, etc.).
   - **Fix files:** `docs/13-implementation-plan.md`.

10. **No unit/integration tests for TypeScript code.**
    - Only Playwright E2E exists. Reconciler logic (drift detection, replica diff, cost-cap
      gating) has no unit coverage.
    - **Fix files:** add `vitest.config.ts` and `apps/api/src/**/__tests__/*` (e.g.
      `reconciler.test.ts`, `cost.test.ts`, `vault.test.ts`).

11. **Drift target lookup edge case.**
    - `Reconciler.checkFleetDrift()` calls `executorManager.checkTargetHealth(target.id)`,
      but `executorManager.addTarget()` is only invoked inside `reconcileFleet()` for fleets
      with status `'pending'`. On a process restart with all fleets at `'applied'`, the
      executor-manager has no driver registered for the stored target IDs and
      `checkTargetHealth` returns `false`, marking every target `unreachable` on the first
      drift sweep until the next apply.
    - **Fix files:** `apps/api/src/reconciler/index.ts` — in `detectDrift()`, call
      `addTarget()` for each stored target before health-checking.

12. **`apps/landing/public/install.sh` shadows the canonical `install.sh`.**
    - Two install scripts exist (`/install.sh` at repo root, and a static copy at
      `apps/landing/public/install.sh`). The one served from `openclaw-deploy.prin7r.com/install.sh`
      is the static landing copy, which is **shorter** (683 bytes vs the root's 2358) and
      probably out of date.
    - **Fix files:** delete `apps/landing/public/install.sh` and either (a) add a Next
      rewrite rule that serves the repo-root one or (b) bake the canonical install script
      into the landing's `public/` via a `predeploy` script.

## 8. Exact next implementation files (T02 hand-off)

The next bd issue (T02) should pick from the gap list above and edit these files first. If
the workstream is "ship a clean OpenClaw Deploy + operator kit", the smallest blocking edit
set is:

1. **`install.sh`** — make `occ` available end-to-end (build via bun in-place, or fetch from
   a GitHub Release artifact). Without this, "clean self-hosted deploy" is a half-deploy.
2. **`apps/landing/app/api/checkout/nowpayments/route.ts`** *vs* **`apps/api/src/routes/checkout.ts`** —
   collapse to one and align plan IDs with the landing's `<Pricing>` so the prod cloud-tier
   buttons work. (Recommended: keep the landing route, delete the API copy.)
3. **`apps/api/src/db/schema.ts`** + **`apps/api/src/routes/webhooks.ts`** + new
   `apps/api/src/lib/webhook-dispatcher.ts` — turn the webhook stub into a real
   register/persist/dispatch path with HMAC-SHA256 signing.
4. **`apps/api/src/lib/metrics.ts`** + **`apps/api/src/routes/metrics.ts`** — rename
   `coldiron.x.y_s` to `coldiron_x_y_s` so the Grafana dashboard reads non-empty.
5. **`apps/api/src/reconciler/index.ts`** — register stored targets with `executorManager` on
   startup so drift detection survives a restart.
6. **`README.md`** + **`docs/13-implementation-plan.md`** — refresh the status sections so the
   next operator reading the repo sees an accurate picture.

## 9. Decisions and conventions worth preserving

These came up while reading the repo and are worth captioning for the T02 hand-off:

- **MIT license**; self-hosted stays free per `apps/landing/components/Pricing.tsx`.
- **Cold Iron design system** lives in `DESIGN.md` (15 sections, tokens in
  `apps/landing/tailwind.config.ts`). New surfaces must reuse the token names
  (`surface-0/1/2`, `signal`, `warn`, `alert`, `text-primary`, `text-muted`, mono caption
  `// label`). The operator UI's `tailwind.config.ts` already mirrors them.
- **No external paid SaaS** beyond NOWPayments (per Prin7r infra rule) — Hashicorp Vault
  remains optional; the local-file vault is the default.
- **Beads (bd) is the single task tracker** — no TodoWrite, no MEMORY.md files. `.beads/`
  holds the Dolt-backed issues + sync config. The bd CLI is **not installed in this
  workspace** (this audit used file inspection only); session-close requires running
  `bd dolt push` and `git push` on a machine where bd is available.
- **Three different package managers** across apps (pnpm / npm / bun). Resist the urge to
  unify in T02; each was chosen for a reason (Next standalone needs pnpm corepack;
  drizzle-kit prefers npm; bun --compile is for the single-binary CLI).
- **The control plane is single-binary deployable** via the existing `docker-compose.yml`.
  Don't introduce Kubernetes — `docs/02-architecture.md §Non-goals` explicitly excludes it.

## 10. Verification artifacts (this audit)

- `git status` clean on `main @ 909b083`.
- `python3 -m pytest tests/ -q` → 9/9 pass.
- Live HTTP smoke: `/`, `/operator`, `/api`, `/install.sh` all 200; `/api/v1/fleets` returns
  401 (auth wall reachable).
- Listed file paths, route handlers, and Dockerfiles read end-to-end; no dead-code paths
  spotted in the reconciler beyond the gaps in §7.
- No secrets in the repo (verified `.env.example` only; `.env` is gitignored).

## 11. Final disposition

- T01 **complete**: this audit note (committed) is the artifact called for in the issue's
  Definition of Done.
- T02 starts at gap #1 (`occ` distribution) — see §8 for the file list.
- Outstanding follow-ups are filed as gaps #1–12 in §7; pick whichever has the lowest blast
  radius for your next heartbeat.

— Droid M3 Engineer #1, 2026-06-02.
