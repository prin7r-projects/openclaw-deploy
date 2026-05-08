# 13 · Implementation plan

> **Hand-off ready.** Read `01`, `02`, `11`, `12` first. Phase 0 (landing + crypto checkout) is
> COMPLETE. Phases 1–6 ship the control plane and executors.
>
> **Repo:** https://github.com/prin7r-projects/openclaw-deploy
> **Live:** https://openclaw-deploy.prin7r.com (landing live; control plane TBD)
> **Deploy:** storage-contabo `/opt/prin7r-deploys/openclaw-deploy` (landing); customer-managed for
> control-plane self-hosted installs.
> **Secrets:** NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET, POSTMARK_SERVER_TOKEN,
> COLD_IRON_KEY_PASSPHRASE, INCUS_TLS_CERT, DOCKER_SOCK_PATH, DATABASE_URL.
> **Tone:** Cold Iron. Lampblack #0B0E12. Linear-ref dark. See `01-brand-identity.md` §Voice.

## Phase 0 — Wave 2 landing + checkout (DONE)

- ✅ Public landing, NOWPayments invoice flow, branded 503, screenshots in `/docs/screenshots/`,
  title verified `OpenClaw Deploy — Declarative agent fleets. Reconciled.`

## Phase 1 — `occ` CLI v0 + control-plane API skeleton

- **Goal.** `occ login`, `occ targets add`, `occ apply` (no real reconciler yet — just persists
  yaml + diffs).
- **Tasks.**
  1. Bun + Hono control-plane scaffold; SQLite default; Drizzle for the `12 §2` schema.
  2. Bun-compiled binary `occ` with `login`, `apply`, `plan`, `targets add`, `rotate`.
  3. `POST /api/v1/fleets/:id/apply` persists yaml; computes diff against prior `yaml_revision`.
  4. install.sh: curl-pipe-bash for fresh VPS; provisions control plane container.
- **Deps.** Phase 0.
- **Effort.** 200 tool-uses, 10h.
- **DoD.**
  - Sasha scenario B partial: `occ install` on fresh CX11 produces a running control plane in <5
    min.
  - `occ apply` persists; plan diff visible.
- **Hand-off.** Reuse Bun + Hono patterns from `lead-enrichment` repo. Bun-binary distribution via
  GitHub releases.

## Phase 2 — Incus + Docker executors + reconciler v0

- **Goal.** Reconciler observes a fleet on Incus + Docker targets and ensures pods match desired
  count.
- **Tasks.**
  1. Incus driver: TLS-cert-auth client, `instance create / start / stop / delete` verbs.
  2. Docker driver: socket-based; `docker run` with the agent image + healthcheck.
  3. Reconciler: every 30s, observe pods on each target, compare to desired, take action.
  4. Drift events emitted; webhook dispatcher fires.
- **Deps.** Phase 1; Incus + Docker test hosts (use Prin7r's own internal fleet for dogfood).
- **Effort.** 250 tool-uses, 12h.
- **DoD.**
  - Maya scenario A end-to-end: 12-agent fleet up in <4 min.
  - Edge E end-to-end: kill an agent → reconciler replaces in <60s.

## Phase 3 — VPS bootstrap driver

- **Goal.** Run an agent on a bare VPS via cloud-init + SSH.
- **Tasks.**
  1. SSH-based driver: bootstrap a Docker daemon on first connect, then run agents via Docker
     verbs.
  2. cloud-init template per cloud provider (Hetzner, DO, Contabo, Vultr).
  3. Re-uses Phase 2's Docker driver after bootstrap.
- **Deps.** Phase 2.
- **Effort.** 150 tool-uses, 7h.
- **DoD.**
  - Sasha scenario B end-to-end on a bare VPS.

## Phase 4 — Secret rotation + cost meter

- **Goal.** OAuth + API-key rotation as `occ rotate`; per-agent cost surfaced.
- **Tasks.**
  1. Vault adapter: libsodium-encrypted column for secrets.
  2. Rotation engine: T-24h detector + `rotate` action (provision new token, push to running pods,
     revoke old).
  3. Cost meter: pull from LLM provider billing API + per-pod runtime; aggregate per fleet/day.
  4. Cost-cap reconciler: when daily cost > cap, stop new scheduling.
- **Deps.** Phase 2.
- **Effort.** 200 tool-uses, 10h.
- **DoD.**
  - Maya scenario C end-to-end: T-24h detection → all 4 rotated before expiry.
  - Maya scenario F end-to-end.

## Phase 5 — Operator UI (Next.js + ShadCN)

- **Goal.** Read-mostly UI: fleets, agents, pods, drift, cost, audit log.
- **Tasks.**
  1. Next.js 15 app (`apps/operator-ui`).
  2. Auth via Cold Iron account (magic link).
  3. Pages: fleet list, fleet detail, audit log, cost panel, secrets panel.
  4. Streamed reconcile progress (SSE).
- **Deps.** Phase 1.
- **Effort.** 200 tool-uses, 10h.
- **DoD.**
  - Maya can monitor a 12-agent fleet from the UI; drift shows yellow/red within 60s.

## Phase 6 — Autoscale + production polish + license tiers

- **Goal.** Hit perf budgets; autoscale per-agent; commercial license tiers wired.
- **Tasks.**
  1. Autoscale rules per agent (`min_replicas / max_replicas / pool_capacity`).
  2. Self-hosted vs managed-starter vs managed-pro license tiers via NOWPayments subscription.
  3. Lighthouse pass; LCP < 2.0s.
  4. Loki + Grafana dashboard; pager wired.
- **Deps.** Phases 1–5.
- **Effort.** 180 tool-uses, 9h.
- **DoD.**
  - Maya scenario D end-to-end: autoscale at peak.
  - p95 budgets in `12 §9` met.
  - Tier upgrade unlocks `managed_pro` features.

## Cross-cutting concerns

- **Accessibility:** WCAG AA on operator UI.
- **i18n:** EN-only.
- **Mobile:** UI is desktop-first (operators); mobile usable but not optimized.
- **Telemetry:** Phase 1 logs; Phase 6 metrics + alerts.

## Risk register

| Risk | Owner | Mitigation |
|---|---|---|
| Incus/Docker API breaks | Eng | Pin versions; CI matrix tests against last 3 minor versions. |
| Secret leak via webhook payload | Eng | Webhook payloads exclude secret values (only `key_name`). |
| Cost meter inaccuracy | Eng | Mark `stale=true` on source error; UI surfaces. |
| Reconciler thundering herd | Eng | Per-fleet rate limit; reconciler interval jittered. |
| Customer self-hosted upgrade pain | Eng | Cold-Iron-vendored migrations; `occ upgrade` command. |

## Resume instructions

1. `git clone https://github.com/prin7r-projects/openclaw-deploy && cd openclaw-deploy`
2. Read `01`, `02`, `11`, `12`.
3. Pick the next phase whose DoD is unmet.
