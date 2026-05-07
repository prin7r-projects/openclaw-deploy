# 05 — Audience Profile

## Ideal Customer Profile (ICP)

A team that is:
- Running **6+ agents** of any kind (OpenClaw / Hermes / NanoClaw or compatible) in production, today.
- Distributed across **2+ hosts** (any combination of Incus / Docker / bare VPS).
- Operated by a **dedicated platform / infra person** (full-time or fractional) who currently owns deploy scripts.
- Spending at least **$500 / month** on LLM API calls per agent fleet (otherwise pain is not yet acute).
- Comfortable with **YAML manifests** and **CLI-first workflows**.

## Primary persona — *Maya, the Fleet SRE*

| Field | Value |
|---|---|
| Role | Lead Platform / DevOps Engineer |
| Company stage | Series A, 12–80 people, AI-native product |
| Years experience | 6–12, mostly backend + infra |
| Tools she lives in | Linear, GitHub, Grafana, Tailscale, 1Password, K9s |
| Stack hints | Postgres, Redis, Bun or Go services, mix of Docker hosts and 1–2 Incus boxes |
| What "good day" looks like | She closes Slack at 17:30 with the fleet green and zero open incidents |
| What "bad day" looks like | A 04:11 AM page about token rotation; 2-hour incident; postmortem tomorrow |
| Decision authority | Can approve $500–$5k/mo tooling without finance loop |
| Buying triggers | Recent fleet-wide incident; new host being added; quarterly token rotation due |
| Channels | HN, lobste.rs, Tailscale blog, *Last Week in AWS*, X tech-infra cluster, niche Discord/Slack communities |

### Maya's quote (synthetic)
> "I don't want another dashboard to babysit. I want one place I can `apply` a manifest and walk away."

## Secondary persona — *Sasha, the Solo Builder*

| Field | Value |
|---|---|
| Role | Indie founder / staff engineer running a side fleet |
| Stage | Pre-seed or bootstrapped, $0–$15k MRR product |
| Years experience | 8–15, frequently a former platform engineer at a larger company |
| Tools | GitHub, Vercel for frontend, 1–3 personal VPS, Cloudflare, Fly.io occasionally |
| What "good day" | Ships a feature, agents run themselves, no manual ops |
| What "bad day" | One of his three VPS providers has an outage and he doesn't know which agents went down |
| Decision authority | Spends his own money — price-sensitive |
| Buying triggers | "I just lost an hour debugging which container died on which host" |
| Channels | Indie Hackers, Show HN, X / Mastodon, niche Discord, GitHub Sponsors of related tools |

### Sasha's quote (synthetic)
> "I want the Tailscale of agent deploys — install once, never think about it, pay $9 if I have to."

## Anti-personas (do not optimize for)

### A1 — *The non-technical AI founder*
Wants to "deploy AI agents without code". OpenClaw Deploy is a **manifest-driven** tool. Wrong product. We will not add a no-code builder.

### A2 — *The hyperscaler buyer*
Comparing against EKS, GKE, Azure AKS. They have Kubernetes muscle and budget. OpenClaw Deploy can integrate as a thin layer above their k8s, but they are not the v1 buyer.

### A3 — *The agency owner reselling chatbots*
Their workflow is "spin up a bot per client, hand over login". They do not need a fleet plane. Wrong product.

### A4 — *The hobbyist with one agent on one VPS*
One agent does not justify a control plane. OpenClaw alone (no `-deploy`) is the right answer for them. We will say so on the landing.

## Segmentation strategy

We will price and position for **Maya** (primary). Sasha will get a free / generous tier so the Show HN funnel works. Anti-personas we will deflect kindly with a "this might not be for you" callout in the docs.

## Buying committee

For Maya's company:
- **Champion**: Maya (platform lead).
- **Economic buyer**: VP Engineering or CTO.
- **User**: 1–3 platform / infra engineers on Maya's team.
- **Blocker risk**: Security team (will ask about secret handling) — addressed by Vault / OpenBao integration and audit logs.

For Sasha:
- He is all four roles.

## Where they hang out (channel detail)

| Channel | Maya | Sasha |
|---|---|---|
| Hacker News (front page) | High | Very high |
| `lobste.rs` | High | Medium |
| `r/devops`, `r/sre`, `r/selfhosted` | Medium | High |
| Tailscale / Fly.io / Cloudflare blog comments | Medium | Medium |
| X (tech-infra cluster) | Medium | High |
| LinkedIn (Platform Engineering hashtag) | Medium | Low |
| Indie Hackers | Low | High |
| Mid-week newsletters (Bytes, Pointer, This Week in TS) | Medium | Medium |
| Conferences (KubeCon, OSCON, Monitorama) | High | Low |

This grid drives the channel mix in `06-sales-channels.md`.
