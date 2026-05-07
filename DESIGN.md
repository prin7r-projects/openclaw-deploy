# DESIGN.md — OpenClaw Deploy

> Canonical design + style guide for the OpenClaw Deploy landing site and the
> control plane surfaces that follow. Owned by Chief of Design. Kept in sync
> with `apps/landing/` on every change.
>
> Working name: `openclaw-deploy` · Brand identity: **Cold Iron**.
> Source-of-truth fonts, palette, voice: [`docs/01-brand-identity.md`](./docs/01-brand-identity.md).

---

## 1. Product and audience

OpenClaw Deploy is a **declarative control plane** for OpenClaw, Hermes, and
NanoClaw agent fleets across mixed Incus, Docker, and VPS targets. The
operator hands the control plane a `fleet.yaml`; the reconciler matches the
running fleet to the manifest. OAuth rotation, multi-target placement, and a
per-agent cost meter are part of the same surface.

The landing site exists to convert two distinct audiences:

- **Maya, the Fleet SRE** — lead platform engineer at a 12-80 person AI-native
  company; runs production agent fleets; on-call when an OAuth token expires
  at 03:00 across 19 NanoClaws. Reads code samples on landing pages, distrusts
  marketing language. Channels: Hacker News, `r/devops`, GitHub trending,
  `lobste.rs`.
- **Sasha, the Solo Builder** — indie founder running a side fleet of agents
  for a vertical product. Three servers, a Docker host, an Incus host, a fresh
  VPS that needs to be recycled monthly. Channels: X, Indie Hackers, Show HN,
  `r/selfhosted`.

Anti-personas (we do not design for): non-technical founders looking for
"AI agents in 5 clicks", agency owners reselling chatbots, hyperscaler buyers
shopping EKS / GKE alternatives.

The dominant emotional state we are designing against is **3 AM on-call** —
calm, precise, no surprises.

## 2. Visual positioning

The design vocabulary is **operator tooling**, not marketing site. The lineage
is `top`, `htop`, `tmux`, Grafana, Linear's keyboard mode, Hashicorp's docs
pages, Tailscale's admin console — surfaces engineers stare at for hours.

Deliberate non-references:

- No purple-pink AI startup gradient.
- No glassmorphism, no swooping section reveals, no parallax.
- No hero illustration of a robot, brain, or smiling avatar.
- No mimic of Anthropic / OpenAI / Vercel / Linear visual identity. Cold-iron
  green-on-near-black is industrial-control-room, not consumer chat.

The visual energy comes from **status density**, not from graphic flourishes:
a live-feel agent table, a bracketed inline manifest, a 47-second rotation
timeline. Every block on the page should look like something that could be in
a real dashboard tomorrow.

## 3. ShadCN baseline and local component policy

Baseline: **shadcn/ui** primitives (Tailwind + Radix), per the Prin7r
Component Library Baseline. The marketing landing currently uses
hand-rolled components in `apps/landing/components/` because the surface is
narrow (10 components total) and the visual system is opinionated enough that
ShadCN imports would have been re-skinned beyond recognition. The component
classes still mirror ShadCN conventions (`rounded`, `border`, `bg-surface-*`,
focus rings) so that adding `pnpm dlx shadcn@latest add <component>` later is
a drop-in operation.

When we add ShadCN components in the next pass:

- Buttons, dialogs, inputs, dropdowns → ShadCN imports, restyled to the Cold
  Iron tokens documented in §4.
- The fleet table on the landing stays bespoke — it has no ShadCN equivalent
  that hits the operator-density bar.
- The control plane dashboard (Wave 3+) starts on full ShadCN; landing-style
  expressive components stop at the marketing surface.

**Documented exceptions**: none yet beyond "no ShadCN imports in v1 because
zero installs were warranted at v1 surface size".

## 4. Color tokens

Palette name: **Cold Iron**. Source: [`docs/01-brand-identity.md`](./docs/01-brand-identity.md#palette--cold-iron).

| Token | Hex | Tailwind class | Role |
|---|---|---|---|
| `surface.0` | `#0B0E12` | `bg-surface-0` | Page background — near-black, slight blue cast |
| `surface.1` | `#11161D` | `bg-surface-1` | Card / panel background |
| `surface.2` | `#1B232E` | `bg-surface-2` | Hover / elevated surface |
| `border` | `#27313F` | `border-border` | 1px hairline divider |
| `border.subtle` | `#1F2733` | `border-border-subtle` | Inner divider, lower contrast |
| `text.primary` | `#E6ECF2` | `text-text-primary` | Body text on dark |
| `text.muted` | `#7E8A9A` | `text-text-muted` | Captions, labels, secondary |
| `accent.signal` | `#7CFFA1` | `text-signal` / `bg-signal` | Primary CTA + healthy/running — phosphor green |
| `accent.warn` | `#FFC857` | `text-warn` | Drift / draining / pending — amber |
| `accent.alert` | `#FF6B6B` | `text-alert` | Error / down — desaturated coral |

**Contrast notes**:

- `text.primary` on `surface.0` measures ≈ 14.0:1 (passes WCAG AAA for body).
- `text.muted` on `surface.0` measures ≈ 5.4:1 (passes AA for normal text and
  AAA for large/bold).
- `signal` on `surface.0` measures ≈ 14.5:1 — comfortably AAA. We use it for
  CTAs and never for body text.

**Forbidden mixes**:

- No `signal` text on `signal/10` background block (low contrast).
- No `text.muted` on `surface.2` for paragraphs — only for badges.

## 5. Typography

Source-of-truth pairing: [`docs/01-brand-identity.md`](./docs/01-brand-identity.md#typography-pairing).

| Stack | Family | Weights loaded | Usage |
|---|---|---|---|
| Display (`font-display`) | **Space Grotesk** | 500 / 600 / 700 | Hero, section headings, large numbers |
| Body (`font-sans`) | **Inter** | 400 / 500 / 600 | Body copy, descriptions |
| Mono (`font-mono`) | **JetBrains Mono** | 400 / 600 | Manifests, command snippets, captions, status labels |

All three are loaded via `next/font/google` with `display: 'swap'` and a CSS
variable so the layout never blocks on font load. Variables: `--font-display`,
`--font-body`, `--font-mono`.

**Type scale** (used inline; we have not yet promoted to a token table):

| Role | px | Tailwind | Line-height |
|---|---|---|---|
| Display XL (hero) | 60-72 | `text-6xl` / `text-7xl` | `1.05` |
| Display L (section h2) | 30-36 | `text-3xl` / `md:text-4xl` | `1.15` |
| Display M (card h3) | 20 | `text-xl` | `1.3` |
| Body L | 18-20 | `text-lg` / `md:text-xl` | `1.6` |
| Body M | 15-16 | `text-[15px]` / `text-[16px]` | `1.6` |
| Body S | 13-14 | `text-[13.5px]` | `1.55` |
| Mono caption | 11-12 | `text-[11px]` / `text-[12px]` | `1.4` |

`font-mono` with `text-[11px] uppercase tracking-widest` is the canonical
"section eyebrow" treatment (e.g. `// pricing`, `// 14 lines · the entire
surface`). Eyebrows are always in `text-signal`.

## 6. Spacing, radius, shadows, and borders

**Spacing scale**: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px`. Tailwind's
`p-1 / p-2 / p-3 / p-4 / p-6 / p-8 / p-12 / p-16 / p-24` covers it. Section
vertical rhythm is `py-16 md:py-24` between major bands.

**Radius**: `2px` (badges) / `6px` (default — buttons, inputs) / `10px`
(cards) / `14px` (modals, status panels). No `rounded-full` pill buttons —
operators do not want consumer-app shapes. Tailwind tokens (`rounded`,
`rounded-lg`, `rounded-xl`) are remapped in `tailwind.config.ts` to enforce
this.

**Borders**: 1px hairlines at `#27313F`. Doubled borders are forbidden.
Inner dividers in cards/tables drop to `#1F2733` (`border-border-subtle`) so
the eye reads structure without noise.

**Shadows**: extremely restrained.

- Cards: no shadow at rest. Hover gets `border-color` change only.
- Manifest card: a single `shadow-[0_24px_60px_-30px_rgba(124,255,161,0.18)]`
  — the only place we use a glow, and even then only as a dim phosphor halo.
- The hero has a single `radial-gradient` halo behind the heading. That is
  the entire decoration budget for the page.

## 7. Layout system and responsive rules

Container: `max-w-6xl mx-auto px-6` everywhere. The site is intentionally a
single 1152-px-wide column with breakpoints; we do not use a 12-column grid.

Breakpoints (Tailwind defaults):

- `sm` 640px — adjusted nav (collapse repo links).
- `md` 768px — layouts switch from stacked to columned (manifest section
  becomes 1.05fr/1fr two-column; pricing becomes 2-up).
- `lg` 1024px — pricing becomes 4-up; manifest re-orders text-then-card to
  card-then-text.

**Responsive rules**:

- Test at **320px** (smallest reasonable width — old phones), **390px**
  (iPhone 12-15), **768px** (iPad portrait), **1024px** (small laptop), and
  **1440px** (the canonical desktop screenshot). No text overlap, no
  horizontal scroll on the page itself. Tables get a `overflow-x-auto`
  wrapper.
- The fleet table (StatusBand) is the only horizontal-scroll exception on
  narrow viewports.
- Hero copy uses `text-balance` so it wraps to roughly equal-length lines.

## 8. Component catalog

All in `apps/landing/components/`.

| Component | File | Role |
|---|---|---|
| `TopNav` | `TopNav.tsx` | Sticky top bar with logo, anchor nav, GitHub link, install pill |
| `Logo` | `Logo.tsx` | Inline SVG of the bracketed-claw mark — favicon + nav |
| `Hero` | `Hero.tsx` | Main heading, sub-copy, primary + secondary CTAs, install one-liner |
| `StatusBand` | `StatusBand.tsx` | Live-feel fleet table (5 agents × 6 columns, status dots, cost) |
| `FeatureTriad` | `FeatureTriad.tsx` | Three feature cards (manifest / multi-target / OAuth rotation) |
| `ManifestShowcase` | `ManifestShowcase.tsx` | Two-column block: 14-line YAML on the right, talking points on the left |
| `Reconciler` | `Reconciler.tsx` | Rotation timeline visual — 47-second OAuth rotation across 19 agents |
| `ProofPoints` | `ProofPoints.tsx` | Three short metric cards with operator-flavor copy |
| `Pricing` | `Pricing.tsx` | Four tiers. Self-hosted (free, install.sh) + three Cloud tiers wired to NOWPayments. |
| `Faq` | `Faq.tsx` | Five Q&A items, operator-flavor objections-and-answers |
| `Footer` | `Footer.tsx` | Logo, four columns of links, last-reconcile signal |
| `app/error.tsx` | `app/error.tsx` | Error boundary so unhandled exceptions never leak the redacted-digest |
| `app/not-found.tsx` | `app/not-found.tsx` | 404 with operator-tone copy |

API routes:

| Route | File | Role |
|---|---|---|
| `POST /api/checkout/nowpayments` | `app/api/checkout/nowpayments/route.ts` | Creates a hosted NOWPayments invoice for a cloud tier; returns `{invoice_url}` |
| `POST /api/webhooks/nowpayments` | `app/api/webhooks/nowpayments/route.ts` | IPN stub that verifies `x-nowpayments-sig` HMAC-SHA512 |

## 9. Landing page structure

Order of sections, top to bottom. Pixel rhythm tuned in May 2026.

1. **TopNav** — sticky, 56 px tall, blurred surface.
2. **Hero** — eyebrow badge, two-line headline (split with a phosphor-green
   second line), one paragraph of subhead, primary + secondary CTA, mono
   one-liner with the curl install command.
3. **StatusBand** — the highest-leverage block. Reads as a real fleet
   dashboard slice. Five rows, status dots, cost column. Sets the operator
   register for the rest of the page.
4. **FeatureTriad** — three benefit cards, lucide icon, bracketed mono caption
   on each.
5. **ManifestShowcase** — the 14-line `fleet.yaml` rendered with line numbers
   and inline syntax highlighting, paired with three talking points.
6. **Reconciler** — visual timeline of an OAuth rotation: 19 agents, 47
   seconds, no overlap.
7. **ProofPoints** — three small metric cards (uptime, rotation time, cost
   visibility).
8. **Pricing** — four tiers (`Self-hosted` free + `Cloud · Team / Org /
   Enterprise`). Cloud CTAs route to NOWPayments hosted invoice; self-hosted
   CTA is `curl install.sh`.
9. **Faq** — five operator objections answered.
10. **Footer** — four columns, last-reconcile signal in the bottom strip.

The page is **single-page, anchor-based**. There is no separate routing.
Anchors are `#features`, `#manifest`, `#pricing`, `#faq`.

## 10. Imagery and generated asset rules

OpenClaw Deploy ships **without raster hero imagery**. The visual system uses
**typography + colored status density** in lieu of illustration. The hero halo
is a `radial-gradient(closest-side, #7CFFA1 0%, transparent 100%)` SVG-free
glow; the bracketed-claw logo is inline SVG in `Logo.tsx`.

We do not currently generate hero imagery via `prin7r-generate-image` because
the visual register is anti-illustration — adding a stock-feel image would
break the operator register. If a future spec wants imagery (e.g., for a
case-study sub-page), the prompt template is:

```
Composition: an 8-foot-wide rack-mounted server illuminated by amber and
phosphor-green status LEDs in a near-black room; subtle blue cast on the
metalwork. Mood: late-shift NOC, calm, alert. Color: anchored to Cold Iron
palette (#0B0E12 surface, #7CFFA1 accent LEDs, #FFC857 warn LEDs).
Aspect: 16:9 hero. No people. No logos. No text overlay.
```

Saved to: `apps/landing/public/generated/<slug>.png` with
`<slug>.prompt.txt` sibling for reproducibility.

**Screenshots of the live site** are in `docs/screenshots/` — see §13.

## 11. Motion and interaction rules

Operator tooling does not dance. Motion budget is intentionally narrow.

| Event | Duration | Easing | Allowed |
|---|---|---|---|
| Hover on button / card | 120 ms | `ease-out` | Border color shift, faint inset glow on `signal` accent only |
| Focus ring | 0 ms | — | Snaps in immediately on `:focus-visible` |
| Status dot — healthy | `1.6s` | infinite ease-in-out | 6 px outer phosphor halo pulse |
| Status dot — drift / draining | static | — | No animation |
| Status dot — down | `2s steps(2)` | infinite | Two-step blink |
| Section reveal on scroll | — | — | **Forbidden.** No fade-in, no slide-up, no parallax. |
| Page nav anchor scroll | browser default | — | No JS-smoothed scrolling. |

The two animation keyframes (`pulseSignal`, `blinkAlert`) are defined in
`tailwind.config.ts` and used only on status dots. There is exactly one
`hover:translate-x-0.5` micro-motion (the arrow on the primary CTA) — it is
the entire animated-flourish budget for the page.

`prefers-reduced-motion` is honored implicitly: the only continuous animations
are status dots, which encode meaning and are kept; the only one-shot motion
is the 0.5 px arrow nudge, which is below the threshold of disturbance.

## 12. Accessibility and quality gates

**Targets**: WCAG 2.1 AA on body, AAA on primary CTA contrast.

- All copy contrast checked against §4 — primary text 14:1, muted 5.4:1.
- Every interactive element gets `:focus-visible` from the browser default
  ring; we explicitly do not strip outlines.
- Tab order on the landing: skip-to-content (implicit) → nav links → primary
  CTA → secondary CTA → fleet table cells (table semantics) → feature card
  internal anchors (none currently) → pricing CTAs (in tier order) → FAQ
  details → footer links. Verified manually in May 2026.
- All images have meaningful `alt` (the SVG logo has `aria-label="OpenClaw
  Deploy"`); decorative gradients are `aria-hidden`.
- Status dots include adjacent text labels (`running` / `drift` / `draining`)
  so color is never the only signal.
- The pricing table Check icons get `aria-hidden` because the feature text
  is the meaning.
- The cloud-tier CTA buttons have `aria-label` that names both the action
  ("Pay with crypto") and the tier ("Cloud · Team") so screen readers don't
  have four identical "Pay with crypto" buttons.

**Quality gates** (the playbook v2 §D checklist):

- DESIGN.md exists with all 15 sections — yes (this file).
- ShadCN baseline followed; exception documented — see §3.
- Desktop screenshot 1440×900 — `docs/screenshots/landing-desktop.png`.
- Mobile screenshot 390×844 — `docs/screenshots/landing-mobile.png`.
- No text overlap at common widths — verified.
- Keyboard focus visible on all interactive elements — verified.
- All images have meaningful alt text — verified.
- No `Lorem ipsum` or `TODO` strings shipped — verified.
- `curl -sI https://openclaw-deploy.prin7r.com` returns HTTP/2 200 with valid
  Let's Encrypt cert — verified post-redeploy.
- NOWPayments CTA opens a real unpaid hosted invoice when env is configured
  — see polish report.

## 13. Screenshots and verification artifacts

Captured from the **production deploy** at `https://openclaw-deploy.prin7r.com`
via Playwright with `waitUntil: 'networkidle'` and `fullPage: true`.

**Desktop** (1440×900 viewport):

![OpenClaw Deploy — desktop landing](./docs/screenshots/landing-desktop.png)

**Mobile** (390×844 viewport):

![OpenClaw Deploy — mobile landing](./docs/screenshots/landing-mobile.png)

Capture script (re-runnable):

```bash
cd apps/landing
node ../../scripts/capture-screenshots.mjs
```

Both files are committed. The expectation is that any landing-page change
that materially shifts visual layout updates these screenshots in the same
PR.

## 14. External references and library sources

**Visual references** (not mimicry — register adjacency):

- Hashicorp docs (`hashicorp.com/products/terraform`) — calm operator tone,
  manifest examples on landing.
- Tailscale admin (`tailscale.com/admin`) — restrained dashboard aesthetic
  with phosphor-adjacent accent.
- Linear's keyboard mode (`linear.app`) — keyboard-first interaction,
  understated motion.
- Grafana / Prometheus — amber/coral status color tradition.
- `top` / `htop` / `tmux` — phosphor-green-on-near-black lineage.

**Libraries**:

- `next@15.1.6` — App Router, Turbopack-disabled production build.
- `react@19.0.0`, `react-dom@19.0.0`.
- `tailwindcss@3.4.17` — utility-first CSS, with extended Cold Iron tokens
  in `tailwind.config.ts`.
- `lucide-react@0.469.0` — icon set; we use `ArrowRight`, `Github`,
  `BookOpenText`, `FileCode2`, `Network`, `KeyRound`, `Terminal`,
  `FileCheck2`, `GitMerge`, `Check`, `ExternalLink`.
- `class-variance-authority`, `clsx`, `tailwind-merge` — for the eventual
  ShadCN imports; not heavily used yet.
- `@next/font` (via `next/font/google`) — Space Grotesk, Inter, JetBrains
  Mono.

**Reference gallery**: [Refero Styles](https://styles.refero.design/) was
consulted but the curated DESIGN.md examples skew toward more decorative
landings; we deliberately landed on a quieter register.

## 15. Changelog

| Date | Change |
|---|---|
| 2026-05-08 | DESIGN.md created (Wave 2 polish). 15 sections per playbook v2 §A. Sourced palette + typography + voice from existing `docs/01-brand-identity.md`. |
| 2026-05-08 | Pricing rebuilt — split into "Self-hosted (free)" + 3 Cloud tiers. Cloud CTAs wired to `POST /api/checkout/nowpayments`. Self-hosted CTA stays as `curl install.sh`. |
| 2026-05-08 | Added `app/error.tsx` and `app/not-found.tsx` so unhandled exceptions stop leaking the Next.js redacted-digest config dump in production logs. The startup error trail visible in `docker compose logs` was traced to bot probes hitting Server Action endpoints with malformed `x-action-redirect` headers; the boundary catches the render-side variants and the Server Action probe noise (`SyntaxError: missing )`, `Invalid character in header content`) is upstream of any code we own (Next.js framework error handlers raise on bad probes regardless of our routes). Documented as known noise — not affecting users (all real requests still return 200). |
| 2026-05-08 | Added `/api/checkout/nowpayments` and `/api/webhooks/nowpayments` route handlers. Webhook verifies `x-nowpayments-sig` HMAC-SHA512. `.env.example` updated with `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, `NOWPAYMENTS_SANDBOX`. |
| 2026-05-08 | Captured `docs/screenshots/landing-desktop.png` (1440×900) and `docs/screenshots/landing-mobile.png` (390×844) from the live deploy via Playwright. |
| 2026-05-08 | First production deploy of v2 polish to `storage-contabo` — `docker compose build && up -d`. Verified `curl -sI https://openclaw-deploy.prin7r.com` returns HTTP/2 200 with LE R12 cert. |
| 2026-05-07 | (v1) Initial Wave 2 batch-1 build — landing live, 10 strategy/design docs in `docs/`, brand identity `Cold Iron` finalized in `docs/01-brand-identity.md`. |
