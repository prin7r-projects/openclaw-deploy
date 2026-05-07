# 07 — Sales Strategy

## Motion: **Product-Led, with a thin Sales-Assist on top**

OpenClaw Deploy is an infrastructure tool sold to engineers. The dominant motion is **PLG (product-led growth)**: operators install, run a manifest, and upgrade themselves when the fleet crosses a threshold. A light sales-assist layer exists for teams that want SOC-2 conversations or annual contracts.

```
discovery (HN/IH/lobste.rs/conference)
   ↓
GitHub repo / docs visit
   ↓
self-install (curl install.sh)
   ↓
first manifest applied — "first value"
   ↓
fleet crosses 10 agents OR 30 days OR 3 hosts
   ↓
upgrade prompt → Team plan
   ↓
(optional) sales-assist for annual + SOC-2 questions
```

## Pricing tiers

| Tier | Audience | Price | Limits | What's included |
|---|---|---|---|---|
| **Solo** (free) | Sasha | $0 | 1 fleet, 5 agents, 2 hosts, community support | Full reconciler, manifest, multi-target, audit log (7-day retention) |
| **Team** | Maya's company | **$199 / month / fleet** | 50 agents, 10 hosts, 30-day audit retention, email support 24h | Vault adapter, OAuth rotation, cost meter, RBAC |
| **Org** | Multi-fleet companies | **$899 / month** flat | Unlimited fleets, 200 agents, 90-day audit retention, Slack support | Above + SAML SSO, audit log export, priority bug triage |
| **Enterprise** | Hyperscaler / SOC-2-bound buyers | Custom | Unlimited everything | Above + dedicated control plane, custom integrations, named CSM, MSA + DPA |

### Pricing rationale
- **Solo free** is generous on purpose: it is the conversion engine.
- **Team $199** is the median sweet spot between Tailscale ($6/user/mo) and Datadog ($15+/host/mo). We are priced "per fleet" not per agent because per-agent feels punitive on a tool that *manages* agents.
- **Org $899** for multi-fleet is the upgrade ceiling for product-led purchases.
- **Enterprise** triggers when buyer asks for SAML, dedicated infra, or signed MSA.

## Free tier guard-rails
- 5 agents / 2 hosts is enough to run a real side project, not enough to run a real company fleet.
- Audit retention 7 days only — companies will hit a compliance need quickly.
- No SLA, no email support — community Discord only.
- These guard-rails are **deliberate value-fences** not nag-screens. Operators respect honest fences, hate paywalled features they expected to be free.

## Sales-assist layer

For Team / Org / Enterprise:
- A "Talk to us" link on the pricing page (not a popup).
- Shared calendar slot for 30-min infra-architecture call.
- One-page security overview (PDF + web) that pre-empts the most common security review questions.
- A `SECURITY.md` in the repo with disclosure flow.

For Enterprise only:
- Dedicated single-tenant control plane on customer infra.
- Custom MSA / DPA (signed).
- Named CSM included for $40k+/year contracts.

## Objection handling

### "We already have Kubernetes."
> Run OpenClaw Deploy as a thin layer on top — it talks to your k8s cluster as one of its targets. Most teams use it specifically because their agents are *not* a good fit for k8s pods (they are stateful, sub-1k in count, and re-deploy frequently).

### "Why not just bash + Ansible?"
> Bash + Ansible is fine until your first 03:00 OAuth incident. We exist for the day after that incident. Try the free tier — if your bash scripts are still fine in 90 days, you didn't need us.

### "How is this different from Coolify / Dokploy?"
> Coolify and Dokploy are **deployment** tools — they deploy services. We are a **fleet reconciliation** tool — we manage *running populations* of agents with health, OAuth, drain semantics. We integrate with Dokploy as one of our Docker drivers.

### "Is this safe to run in production?"
> The reconciler is idempotent and append-only at the audit layer. We dogfood it on Prin7r's own production fleet. The roadmap is conservative — no "rewrite" on the v1 schema for at least 18 months.

### "What about vendor lock-in?"
> The manifest is YAML, plain. The state store is SQLite or Postgres — yours. The drivers are open-source. If you ever leave OpenClaw Deploy, your manifests still describe your fleet for any successor tool.

### "How do I get my CFO to sign $199/mo?"
> Show him the $/day cost-meter export. Most teams find $199 is recovered by the **first** rotation incident they avoid.

## Conversion funnels (targets)

| Stage | Target conversion | Notes |
|---|---|---|
| Visitor → GitHub view | 35% | landing must show the manifest in hero |
| GitHub view → install | 18% | quickstart must work in <5 min |
| Install → first apply | 60% | docs and CLI UX matter most |
| First apply → 7-day retention | 50% | reconciler reliability gate |
| 7-day retention → 30-day | 70% | quality of OAuth rotation gate |
| 30-day retention → upgrade trigger | 25% | typically: cross 5-agent free limit |
| Upgrade trigger → paid | 35% | Team tier is single-step |

## Renewals / expansion
- Annual prepay discount: 2 months free.
- Expansion lever: add hosts / agents above tier limits.
- Churn signal: 14-day inactivity on apply commands → automatic check-in email.

## Discounting policy
- Annual: 2 months free (16.7% off).
- Open-source maintainers: free Team tier on application.
- Education: 50% off Team tier for verified educators.
- No other discounts — keeps the market clean.

## What we will NOT do
- No "request a demo" gating on the pricing page — operators hate it.
- No price hiding for Team / Org tiers.
- No usage-based billing on agents (penalizes growth, the opposite of our value).
- No multi-year contracts before our v1 anniversary.
