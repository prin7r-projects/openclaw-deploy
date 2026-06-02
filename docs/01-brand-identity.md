# 01 — Brand Identity

**Project**: OpenClaw Deploy
**Working name**: `openclaw-deploy`
**Tagline**: *Declarative agent fleets. Reconciled.*

---

## Brand pyramid

| Layer | Value |
|---|---|
| **Essence (1 word)** | Reconciled. |
| **Personality (3 traits)** | Precise. Calm. Operator-grade. |
| **Values (3)** | Determinism over guessing. Visibility over surprise. Recovery over panic. |
| **Attributes (5)** | Declarative. Multi-target. Self-healing. Observable. Cost-aware. |

OpenClaw Deploy is the **reconciliation loop** an agent fleet operator needs in their hand at 03:00 when an OAuth token expires across nineteen NanoClaw containers and three Incus profiles. Calm because the surface is small. Precise because every change is diffable. Operator-grade because nothing is "magic" — the underlying compose / Incus profile / cloud-init script is one click away.

## Positioning statement

> For **agent-fleet operators** who **run dozens of OpenClaw, Hermes, or NanoClaw workers across mixed Incus / Docker / VPS targets**, **OpenClaw Deploy** is a **declarative control plane** that **reconciles desired state into running agents** — health, OAuth rotation, autoscale, cost telemetry — **unlike one-off bash scripts and ad-hoc dashboards** because **it is target-agnostic, manifest-driven, and was forged on the fleet that runs Prin7r itself**.

## Audience persona

### Primary — *Maya, the Fleet SRE*
- **Title**: Lead Platform Engineer / DevOps lead at a 12–80 person AI-native company
- **Goals**: keep agent uptime above 99.5%, rotate keys without downtime, give her CTO a single numerical answer to "what is our agent fleet costing us per day"
- **Frustrations**: bespoke deploy scripts written by "whoever was on call last quarter", Incus and Docker drift, tokens that "just stopped working at 04:11 UTC", no per-agent attribution of LLM spend
- **Channels**: Hacker News new-tab, the *Platform Engineering* and *r/devops* corners of Reddit, GitHub trending, indie-hacker Discord servers, mid-week dev newsletters (Bytes, This Week in TS), `lobste.rs`

### Secondary — *Sasha, the Solo Builder With Three Servers*
- **Title**: Indie founder / staff engineer running a side fleet of agents for a vertical product
- **Goals**: spin up an agent in under 60 seconds, never re-learn provisioning when a server gets retired, keep the monthly cloud bill predictable
- **Frustrations**: each VPS provider has its own quirks; "just use Kubernetes" is not the answer; existing PaaS hides the kernel and breaks for stateful sessions
- **Channels**: X / Mastodon, Indie Hackers, Show HN, niche subreddits (r/selfhosted, r/homelab adjacent), small podcasts, GitHub stars

## Voice & tone

**Do's**
- Lead with the operator's verb: *deploy, rotate, scale, drain, drift, reconcile*.
- Quote specific numbers (containers, ms, $). Vague is hostile.
- Show the manifest. Code samples are the marketing.

**Don'ts**
- No "AI-powered". Every product page on the internet says that.
- No "magic". Operators distrust magic. Every action is auditable.
- No purple/pink gradients. We are not selling a chat companion.

**Sample sentence (correct register)**
> Twelve OpenClaws on `dev2`, two Hermes on `144`, one NanoClaw drained for upgrade — declared in a 14-line manifest, reconciled in 2.4 seconds, observed forever.

## Visual system

### Palette — "Cold Iron" (monochrome, PRI-3519 retokenization)

The palette was retokenized in PRI-3519 to apply the Wave One white/neutral/taste standard: chromatic brand accents (phosphor green / amber / coral / violet) were removed from CTA, badge, border, and state surfaces. State meaning is now carried by the **label next to the dot**, not by hue. The near-black background and off-white body text are unchanged because they are the operator-on-terminal lineage and pass WCAG AAA on their own.

| Role | Hex | Usage |
|---|---|---|
| `surface.0` | `#0B0E12` | Page background (near-black, slight blue cast) |
| `surface.1` | `#11161D` | Card / panel background |
| `surface.2` | `#1B232E` | Hover / elevated surface |
| `border` | `#27313F` | Hairline dividers (1px) |
| `border.subtle` | `#1F2733` | Inner divider, lower contrast |
| `text.primary` | `#E6ECF2` | Body text on dark |
| `text.muted` | `#7E8A9A` | Secondary text, captions, labels |
| `accent.signal` | `#E6ECF2` | Primary CTA + "healthy / running" — off-white. Was `#7CFFA1` phosphor green. |
| `accent.warn` | `#B8B8B8` | Drift / draining / pending — light neutral gray. Was `#FFC857` amber. |
| `accent.alert` | `#6B6B6B` | Error / down — dim neutral gray. Was `#FF6B6B` coral. |
| `tok.ref` | `#B8B8B8` | Manifest snippet `ref(...)` token. Was `#C4B5FD` violet. |

**Forbidden brand hues** (PRI-3519): `orange`, `violet`, `coral`, `fuchsia`, `indigo`, and any other chromatic accent on CTA, badge, border, or state surfaces. The only colors allowed for status are the three neutral grays above. If a future feature genuinely needs a chromatic cue (e.g., a red action button that performs a destructive op), it must be reviewed against the Wave One taste standard first.

**Why monochrome works for the audience**: operators stare at terminals. Off-white-on-near-black is the lineage of `man` pages, `less`, `tig`, every dry-run diff, every pager ack screen. State is carried by the *word next to the indicator*, which is what dashboards in NOCs have always done (a green "OK" pill and a red "ALERT" pill both still read at 03:00 because the words are what the operator is parsing). The previous chromatic version was a Wave 2 placeholder; the Wave One taste standard wins.

### Typography pairing

- **Display**: **Space Grotesk** (700 / 600 / 500) — geometric sans, slight machinic angularity. Used for hero, section headings, big numbers.
- **Body**: **Inter** (400 / 500) — quietly excellent reading sans.
- **Mono**: **JetBrains Mono** (400 / 600) — for manifests, command snippets, status badges. Critical: real engineers read code samples on landing pages, so the mono face matters.

All three are Google Fonts.

### Logo concept

A **bracketed claw** — square brackets `[ ]` with three short tick marks inside, suggesting a clamp gripping three rows (the three agent types: OpenClaw, Hermes, NanoClaw). The brackets read as code (declarative manifest); the ticks read as fleet members; the whole mark reads as "a structured grip on a list of things".

Inline SVG sketch (used as the favicon and site mark):

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="OpenClaw Deploy">
  <rect x="0" y="0" width="64" height="64" fill="#0B0E12" rx="10"/>
  <!-- left bracket (was #7CFFA1 phosphor green; now off-white per PRI-3519) -->
  <path d="M18 14 H10 V50 H18" fill="none" stroke="#E6ECF2" stroke-width="3" stroke-linecap="square"/>
  <!-- right bracket (was #7CFFA1 phosphor green; now off-white per PRI-3519) -->
  <path d="M46 14 H54 V50 H46" fill="none" stroke="#E6ECF2" stroke-width="3" stroke-linecap="square"/>
  <!-- three fleet ticks (last tick was #7CFFA1; now off-white per PRI-3519) -->
  <rect x="22" y="22" width="20" height="3" fill="#E6ECF2"/>
  <rect x="22" y="30.5" width="20" height="3" fill="#E6ECF2"/>
  <rect x="22" y="39" width="20" height="3" fill="#E6ECF2"/>
</svg>
```

### Spacing & radius

- **Radius scale**: `2px` (badges), `6px` (inputs / buttons), `10px` (cards), `14px` (modals). No fully-rounded "pill" buttons — operators don't want consumer-app shapes.
- **Spacing scale**: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px`.
- **Hairlines**: 1px borders at `border` color, never thicker. Avoids the "boxed-in" SaaS look.

### Motion

- **Principle**: reveal state, never decorate. A button hover changes border color and adds a 1px inset glow in `accent.signal` (now off-white, see PRI-3519) — that's the maximum motion. No swooping sections, no parallax.
- **Duration**: 120ms ease-out for hovers, 200ms ease-out for state transitions, 0ms for status changes (status updates should *snap* — not animate).
- **Status pulse**: a healthy-agent dot pulses at 1.6Hz with a fixed 6px outer halo. The pulse animates off-white only — no chromatic hue. Drift dots are static light gray. Down dots blink at 0.5Hz in dim gray.

## What this brand is *not*

- It is not a chat product. No bubbles, no avatars, no "Hi, I'm your AI assistant".
- It is not a Vercel / Linear / Anthropic mimic. Cold-iron off-white-on-black is deliberately industrial-control-room (Wave One taste standard, PRI-3519).
- It is not playful. The audience does not want playful at 03:00.

## Anti-personas (will not design for)

- The non-technical founder who wants "AI agents in 5 clicks" — they should buy a different product.
- The agency owner reselling chatbots — out of scope for the manifest workflow.
- Hyperscaler buyers comparing against EKS / GKE — not our target until v2.
