# PRI-3778 — Wave2+ Opus Product Audit: Cold Iron / openclaw-deploy

**Target:** https://openclaw-deploy.prin7r.com  ·  **Date:** 2026-06-03  ·  **Auditor:** Opus Architect (gimafamila #4)
**Scope:** landing, app/API, payment/contact/order/user paths. Read-only audit per AGENTS.md (no live money/KYC/legal actions; only unpaid/test invoice creation; no secret printing; no Docker changes — fixes deferred to `patches/<id>/`).

> **Verdict: NOT production-ready. One P0 revenue-blocking defect cluster on the live checkout/webhook path, plus 2 security info-disclosure issues.** Landing UI/design/copy is otherwise solid.

---

## P0 — Cloud checkout & tier activation are broken in production (revenue-blocking)

The **deployed** `/api/*` paths are split between two backends, and the revenue-critical ones resolve to the **legacy Hono API** (`apps/api/src/...`), not the corrected landing Next routes (`apps/landing/app/api/...`) shipped in PRI-3725 / PRI-3751. Result: the Pricing CTAs cannot complete a crypto purchase, and even a manually-completed payment never activates a tenant.

### P0-1 — Every Cloud CTA's primary checkout call returns HTTP 400 (plan-ID mismatch)
- The CTA posts hyphenated plan IDs (`Pricing.tsx:110-114` → `{plan:'cloud-team'|'cloud-org'|'cloud-enterprise'}`).
- The live backend is the Hono route (`apps/api/src/routes/checkout.ts:5-15`) which **only accepts underscored** IDs (`cloud_team|cloud_org|cloud_enterprise`).
- **Repro (live):**
  ```
  curl -X POST https://openclaw-deploy.prin7r.com/api/checkout/nowpayments \
    -H 'content-type: application/json' -d '{"plan":"cloud-team"}'
  → 400 {"error":"Invalid plan. Must be: cloud_team, cloud_org, cloud_enterprise"}
  ```
  (That exact string exists only in `apps/api/src/routes/checkout.ts:15` — proves the Hono backend serves this path.)
- The landing's correct route (`apps/landing/app/api/checkout/nowpayments/route.ts`, which accepts hyphenated IDs and is wired to the live `NOWPAYMENTS_API_KEY`) is **never reached** in production.

### P0-2 — CTA silently degrades 100% of Cloud sales to a personal-Gmail mailto
- On the 400, `Pricing.tsx:129-150` falls back to `/api/orders/contact`, which **does** resolve to the landing route and returns a `mailto:kee22r@gmail.com` link, then shows the user: *"Crypto checkout is offline on this server…"*.
- This message is **false** — crypto checkout is live and working (see P0-3); it is only unreachable due to the plan-ID + routing mismatch. So every prospective Cloud customer is bounced from a one-click crypto purchase to a manual email to a **personal Gmail address** — a conversion and trust catastrophe for a $199–$2,400/mo product.

### P0-3 — Live checkout charges the WRONG prices (pricing-integrity / revenue leak)
- The working underscore path creates a **real (unpaid) NOWPayments invoice** at the Hono price table — which does not match the displayed prices:

  | Plan (display) | Landing price shown | Live Hono invoice price (`checkout.ts:5-9`) |
  |---|---|---|
  | Cloud · Team | **$199** | **$49** |
  | Cloud · Org | **$899** | **$199** |
  | Cloud · Enterprise | **From $2,400** | **$499** |

- **Repro (live, unpaid — within "test invoice creation" scope):**
  ```
  curl -X POST .../api/checkout/nowpayments -d '{"plan":"cloud_team"}'
  → 200 {"invoice_url":"https://nowpayments.io/payment/?iid=4794495026"}   # unpaid invoice, $49
  ```
  A buyer who reaches the working path pays **up to 80% less than the advertised price** (Enterprise $499 vs $2,400). Evidence invoice `iid=4794495026` is unpaid; no money moved.

### P0-4 — Post-payment redirect is a 404
- Hono checkout sets `success_url=/success`, `cancel_url=/pricing` (`checkout.ts:37-38`). **Both are 404 live** (`/success`→404, `/pricing`→404). The corrected landing route uses `/?checkout=success` (200). A paying customer lands on a broken page.

### P0-5 — IPN webhook → tier activation pipeline is dead in production
- The IPN webhook also resolves to the **Hono** backend: `POST /api/webhooks/nowpayments` → `{"error":"Missing signature"}` (string unique to `apps/api/src/routes/nowpayments-webhook.ts:8`).
- The Hono webhook only logs and returns `{ok:true}` — it performs **no DB activation**. The landing webhook (`apps/landing/app/api/webhooks/nowpayments/route.ts`, PRI-3751) that activates `cloud_tier_activations` is **unreachable**.
- Net: even if a customer pays, **no tenant is ever activated**. PRI-3751 is non-functional as deployed.
- Compounding: landing webhook maps activation by amount `{199,899,2400}`, but Hono invoices are `{49,199,499}` → amounts would never map correctly even if it were reached.

### P0 Root cause
The deployed Traefik routing (and/or container images) sends revenue paths to the stale Hono API. `docker-compose.yml` declares a single `PathPrefix(/api)`→api router (priority 2), which does **not** explain why `/api/orders/contact` reaches the landing while `/api/checkout/*`, `/api/webhooks/*`, `/api/v1/*`, `/api/healthz`, `/api` reach Hono. **The live routing config is not represented in the repo** — a config-drift/opacity risk that is itself a finding. The two checkout/webhook implementations must be reconciled to ONE (the landing Next versions are the correct, current ones) and routing made explicit + repo-tracked.

---

## P2 — Security / info-disclosure

- **P2-1 Unauthenticated metrics exposure.** `GET /api/v1/metrics` → **200, no auth**, leaking ops data (reconcile duration, unhealthy pods, daily cost in cents, secret-rotation lead hours). Other `/api/v1/*` correctly 401. Gate metrics behind auth or restrict by network. Evidence: body returns `coldiron_*` gauges.
- **P2-2 Operator console publicly reachable.** `/operator`, `/operator/fleets`, `/operator/secrets`, `/operator/audit`, `/operator/costs` all return **200** unauthenticated (page shells). No token leaked in HTML (good), and data calls appear to 401 client-side, but the secrets/audit console should not be publicly routable. Put `/operator` behind auth or an allowlist.
- **P2-3 Missing security headers.** Landing returns **no** HSTS / CSP / X-Frame-Options / X-Content-Type-Options / Referrer-Policy. Clickjacking + MIME-sniffing exposure.
- **P2-4 Personal Gmail as billing contact.** `kee22r@gmail.com` is hardcoded as the order-capture contact (`orders/contact/route.ts:25`) and is currently the ONLY working path to buy Cloud (P0-2). Use a role address.

## P3 — Lower severity
- **P3-1** Wildcard CORS (`access-control-allow-origin: *`) on the API (`apps/api/src/index.ts:20`). Low risk (bearer-token, not cookie auth) but pairs badly with P2-1 to let any origin scrape metrics.
- **P3-2** Hono webhook signature compare is **non-timing-safe** string `!==` (`nowpayments-webhook.ts:38`); the landing webhook is correctly `timingSafeEqual`. Another reason to retire the Hono copy.
- **P3-3** Hono checkout sets no `ipn_callback_url`, so IPNs rely on the NOWPayments dashboard global setting — fragile vs the landing route which sets it per-invoice.

---

## Pass/Fail Matrix

| Area | Path | Result |
|---|---|---|
| Landing | `/` desktop 1440×1000 | ✅ PASS — clean mono UI, h1 within viewport |
| Landing | `/` mobile 390×844 | ✅ PASS — no horizontal scroll (`_report.json`) |
| Landing | install.sh / robots / sitemap | ✅ PASS — 200 |
| Landing | `/pricing`, `/docs`, `/faq`, `/success` | ⚠️ 404 (in-page anchors only; but P0-4 relies on `/success`/`/pricing`) |
| Payment | CTA → checkout (hyphenated, real) | ❌ **FAIL (P0-1)** — 400 invalid plan |
| Payment | checkout (underscore) | ❌ **FAIL (P0-3)** — works but wrong prices |
| Payment | post-pay redirect | ❌ **FAIL (P0-4)** — 404 |
| Payment | IPN webhook → activation | ❌ **FAIL (P0-5)** — wrong backend, no activation |
| Order/Contact | `/api/orders/contact` | ✅ functional — but is a forced fallback (P0-2) + P2-4 |
| API auth | `/api/v1/fleets`,`/secrets` | ✅ PASS — 401 without token |
| API auth | `/api/v1/metrics` | ❌ **FAIL (P2-1)** — 200 no auth |
| Operator | `/operator/*` | ⚠️ public 200 (P2-2) |
| Security | headers / CORS | ⚠️ none / wildcard (P2-3, P3-1) |

## Evidence
- Screenshots: `docs/screenshots/wave2-design-gate/{desktop,mobile,payment}.png`, `_report.json`
- Live invoice (unpaid, evidence only): NOWPayments `iid=4794495026`
- This report: `docs/audit/PRI-3778-cold-iron-product-audit.md`

---

## M3 Repair Checklist (deferred — no implementation in this audit per policy)
1. **[P0] Pick ONE checkout/webhook implementation** = the landing Next routes (`apps/landing/app/api/checkout/nowpayments`, `.../webhooks/nowpayments`, `.../orders/contact`). **Decommission** `apps/api/src/routes/checkout.ts` + `nowpayments-webhook.ts` and their `index.ts` mounts.
2. **[P0] Fix deployed routing** so `/api/checkout/*` and `/api/webhooks/nowpayments` resolve to the **landing** container, OR (if the Hono API must own `/api/*`) make Hono accept hyphenated IDs, the correct prices `{199,899,2400}`, set `success_url=/?checkout=success`, set per-invoice `ipn_callback_url`, and perform DB activation. Commit the real Traefik config to the repo via `patches/<id>/`.
3. **[P0] Add an E2E gate** that POSTs each displayed plan to the live checkout and asserts `invoice price == displayed price` and `success_url` returns 200.
4. **[P2] Gate `/api/v1/metrics`** behind auth/network allowlist.
5. **[P2] Put `/operator/*`** behind auth or IP allowlist.
6. **[P2] Add** HSTS/CSP/X-Frame-Options/X-Content-Type-Options/Referrer-Policy on landing + operator.
7. **[P2] Replace** `kee22r@gmail.com` with a role/billing address.
8. **[P3] Tighten** API CORS off `*` for any authenticated route.

## Residual risk
The exact deployed Traefik/routing config is not in the repo, so the per-path backend split could shift again on redeploy. Until routing is repo-tracked and a price/redirect E2E gate exists, checkout integrity cannot be guaranteed across deploys.
