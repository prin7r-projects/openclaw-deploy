# 10 — Pitch Deck

A 10-slide investor / partner deck for OpenClaw Deploy. The accompanying `pitch-deck.html` renders these as a self-contained HTML deck (no build step).

---

## Slide 1 — Cover

**OpenClaw Deploy**
Declarative agent fleets. Reconciled.

*Wave 2 Prin7r project — May 2026*

---

## Slide 2 — The pain

It is 03:00 UTC.

- An OAuth token rotates.
- 19 agents go red.
- Bash scripts didn't drain in-flight tasks.
- A platform engineer is awake.

This is a recurring quarterly tax on every team running agent fleets.

---

## Slide 3 — Why now

- AI agents are no longer "one bot per company". Production fleets routinely run **10–100 agents**.
- The agents are heterogeneous: OpenClaw, Hermes, NanoClaw, and counterparts.
- The hosts are heterogeneous: Incus, Docker, raw VPS.
- The result: each company is reinventing a deploy plane, badly.
- No incumbent owns this layer.

---

## Slide 4 — The product

- A control plane that takes a 14-line `fleet.yaml` and **reconciles** the running fleet to match.
- One manifest, three target types (Incus / Docker / VPS).
- Reconciler runs every 5s. Idempotent. Auditable.
- First-class operations: `apply`, `drain`, `rotate-keys`, `cost`.

---

## Slide 5 — The 14-line manifest

```yaml
apiVersion: openclaw.deploy/v1
fleet: prin7r-prod
agents:
  - name: nanoclaw-pool
    type: NanoClaw
    image: ghcr.io/openclaw/nanoclaw:1.4.2
    target: incus://dev2
    replicas: 5
    auth:
      claude_oauth: ref(vault://oauth/claude_main)
  - name: hermes-bridge
    type: Hermes
    image: ghcr.io/openclaw/hermes:0.9.1
    target: docker://144
    replicas: 2
```

That's it. That's the API.

---

## Slide 6 — Why we will win

1. **Domain depth**: built on the lessons of operating Prin7r's own fleet — we are operator zero.
2. **Multi-target**: no incumbent supports Incus + Docker + VPS in one manifest.
3. **Operator-grade UX**: phosphor-green status, JetBrains Mono manifests, no purple gradients.
4. **Open by default**: MIT license, manifests are YAML, state is in your DB.

---

## Slide 7 — Market

**Bottom-up TAM**:
- ~12,000 companies running 5+ AI agents in production today (estimate, mid-2026).
- 30% are AI-native and will pay for fleet tooling.
- ARPA target: **$2,400/year** (Team tier average).
- Reachable revenue: **~$8.6M/year** at 12% market share within 2 years.

**Adjacencies**: integrations with OpenBao, Coolify, Dokploy, Tailscale.

---

## Slide 8 — Business model

| Tier | Price | Limits |
|---|---|---|
| Solo | Free | 5 agents, 2 hosts |
| Team | $199 / mo / fleet | 50 agents, 10 hosts |
| Org | $899 / mo flat | 200 agents, unlimited fleets |
| Enterprise | Custom | Unlimited; SOC-2; CSM |

PLG funnel + light sales-assist on Team+ tiers.

---

## Slide 9 — Traction (90-day target)

- **400** GitHub stars
- **100** self-serve installs
- **15** paying Team-tier fleets
- **1** reference customer
- Internal proof: Prin7r itself (the system that built this site) runs on OpenClaw Deploy.

---

## Slide 10 — Ask / contact

- **Looking for**: 5 design-partner fleets running 10+ agents today.
- **Offer**: 6 months of Team-tier free for design partners + co-built feature roadmap.
- **Contact**: `kee22r@gmail.com` · `github.com/prin7r-projects/openclaw-deploy`

---

*Built and deployed by the Prin7r Wave 2 pipeline.*
