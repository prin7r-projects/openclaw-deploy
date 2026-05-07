# 08 — Marketing Strategy

## Positioning (one sentence)

> **OpenClaw Deploy is the declarative control plane for OpenClaw, Hermes, and NanoClaw agent fleets across mixed Incus / Docker / VPS targets — manifest in, reconciled fleet out, no 03:00 OAuth incidents.**

## Messaging hierarchy

### Primary message (above the fold)
> **Declare what you want. We reconcile until you have it.**
> *14 lines of YAML. Three agent types. Five hosts. Reconciled.*

### Three supporting messages (feature triad)

1. **Manifest-driven, not click-driven.**
   *YAML in, fleet out. Diff before you apply. Roll back like git.*

2. **One control plane. Three target types.**
   *Incus, Docker, fresh VPS. Same manifest. Same drain semantics. Same audit log.*

3. **OAuth rotation that doesn't fail at 3 AM.**
   *Dependency-ordered, in-flight-task-aware, zero-overlap. 19 agents in 47 seconds.*

### Proof points (below the fold)
- *We run our own fleet on this.* Prin7r's production agent fleet — the system that built this site — is managed by OpenClaw Deploy.
- *Open-source, MIT.* Manifests are YAML. State is your Postgres or SQLite.
- *Idempotent reconciler.* Safe to interrupt. Safe to re-apply. Safe to delete and re-apply.

## Content pillars

We will produce content under five recurring pillars. Each pillar maps to a pain in `04-pain-points.md`.

### Pillar 1 — *The 03:00 Story* (P1: OAuth)
Long-form essays and short threads about real-world rotation incidents. Format: anonymized timelines, what failed, how a manifest-driven plane would have handled it.
- Cadence: 1 long-form / quarter; 1 X-thread / month.

### Pillar 2 — *Mixed-target patterns* (P2: placement)
Technical posts that show how to lay out fleets across heterogeneous hosts. Format: real `fleet.yaml` examples, diagrams.
- Cadence: 1 post / 6 weeks.

### Pillar 3 — *Cost calendars* (P3: cost)
Posts that tie agent counts to dollars. Format: "What does it cost to run 50 NanoClaws for a month?"
- Cadence: 1 post / quarter; the reconciler's cost-meter is the data source.

### Pillar 4 — *Drift diaries* (P4: drift)
Short posts about the times the reconciler caught something the operator missed. Format: timeline screenshots from the audit log (anonymized).
- Cadence: 1 X / month; 1 long-form / quarter.

### Pillar 5 — *Operator's notebook* (P5 + P6: onboarding + recovery)
The widest pillar — runbooks, recovery playbooks, host-onboarding scripts. Format: docs-style posts.
- Cadence: 1 / month.

## Visual content shapes that perform

- **Manifest screenshots** (with the JetBrains Mono palette) — high reshare on X, Mastodon.
- **Reconciler timeline GIFs** (phosphor-green dots flipping state) — high engagement on HN comments.
- **Architecture mermaid diagrams** — credibility signal for SREs.
- **Cost-meter rolling charts** (one number, big) — CTO-friendly.

## Voice in marketing copy

Match `01-brand-identity.md`. Operator verbs. Specific numbers. No purple gradients. No hype.

**Bad** (what every other AI-tool landing says):
> "Revolutionize your AI agent deployments with our intelligent platform."

**Good** (what we say):
> "Twelve OpenClaws on dev2, two Hermes on 144, one NanoClaw drained for upgrade — declared in 14 lines, reconciled in 2.4s."

## Launch sequence (T-30 to T+30)

| Day | Action | Channel |
|---|---|---|
| T-30 | Repo public, README + 3 docs live | GitHub |
| T-21 | First X / Mastodon screenshot of manifest | X, Mastodon |
| T-14 | "Coming soon" page + email capture | landing |
| T-7 | Show HN draft reviewed; Tuesday 8:00 AM PT submission slot booked | HN |
| **T** (launch) | Show HN goes live; landing live; install.sh live; X / Mastodon / IH cross-posts | All |
| T+1 | Reply to every HN / IH / X comment within 60 minutes during business hours | All |
| T+3 | First "drift diary" post — captures one bug fixed live during launch week | Blog + X |
| T+7 | Newsletter pitches sent (Bytes, *Pointer*, *DevOps Weekly*) | Email |
| T+14 | First "03:00 Story" essay | Blog + X |
| T+30 | Stats post: signups, installs, fleets, agents reconciled | Blog + HN Ask HN |

## Landing-page IA (information architecture)

The Wave 2 landing page implements:
1. **Hero** — one sentence, one manifest, one "Install" CTA, one "Read the docs" CTA.
2. **Status pulse band** — three live-feel status pills showing "5 healthy, 0 drift, 0 down" — purely visual.
3. **Feature triad** — the three supporting messages above, each with a tiny code or screenshot.
4. **The 14-line manifest** — full, copy-pastable.
5. **Proof point row** — "we run our own fleet on this" + GitHub stars + MIT badge.
6. **Pricing card** — Solo free / Team $199 / Org $899 / Enterprise.
7. **FAQ** — five questions from `07-sales-strategy.md` objection handling.
8. **Footer** — repo link, docs link, status page, contact email.

## Measurement

| Metric | Source | Cadence |
|---|---|---|
| Landing → GitHub click-through | landing analytics | weekly |
| GitHub stars | gh API | daily |
| `install.sh` runs | install endpoint logs | daily |
| First-apply success rate | control plane analytics (opt-in) | weekly |
| Free → Team conversion | Stripe + control plane | monthly |
| Show HN front-page status | manual | launch week |
| Newsletter inclusions | tracked links | monthly |

## What we will not market on
- We will not generate AI-bot Twitter chatter on launch.
- We will not buy upvotes, ever.
- We will not run tone-deaf "AI for AI" headlines.
- We will not promise SLAs we have not earned.
