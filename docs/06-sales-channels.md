# 06 — Sales Channels

OpenClaw Deploy is a developer-tool whose buyer is also its user. The motion is **bottom-up, content-led, with a paid tier triggered by acute pain**. Channels are evaluated by *fit with the audience*, not by reach.

## Channel mix overview

| Tier | Channel | Why it fits | Primary KPI | Effort |
|---|---|---|---|---|
| 1 | **Hacker News (Show HN + Ask HN)** | Maya and Sasha both read HN daily; declarative-fleet content is on-thesis | Front-page hit + signups in 24h | Medium (1 great post) |
| 1 | **Open-source GitHub repo** | Operators evaluate via `git clone` first | Stars, forks, install runs | High (continuous) |
| 1 | **Technical docs site** | Sells via competence | Time-on-page, `occ install` runs | High (continuous) |
| 1 | **`lobste.rs`** | Quality-gated, exact audience | Upvotes, click-through | Low (gated submission) |
| 2 | **X / Mastodon (tech-infra cluster)** | Real-time signal sharing among ops | Followers + manifest screenshots reshared | Medium |
| 2 | **Mid-week newsletters** (Bytes, *Pointer*, *Status Code*, *DevOps Weekly*) | Newsletter readership over-indexes on Maya | 1 inclusion / month | Low (one-shot pitches) |
| 2 | **Indie Hackers + Show HN cross-posts** | Sasha's primary haunt | Comments + IH signups | Low |
| 2 | **r/devops, r/selfhosted, r/sre** | Where pain is publicly described | Replies that link organically (no spam) | Medium (community work) |
| 3 | **Conference talks & lightning demos** (Monitorama, KubeCon, OSCON, Platform Engineering Day) | Maya goes; conference talks are the content asset of choice for SREs | Talk submissions accepted | High (long lead time) |
| 3 | **Adjacent-tool blog co-marketing** (Tailscale, Fly.io, OpenBao, Coolify, Dokploy) | Co-promotion when the integration story is strong | Joint post traffic | Medium |
| 3 | **Sponsored slot on OSS infra newsletter** | Trust-transferred credibility | Click-through + signups | Medium ($1–3k spend) |
| 4 | **LinkedIn long-form** | Platform Engineering managers consume long-form | Saves + DMs | Low (1 post / 2 weeks) |
| 4 | **Cold outbound to Series A AI infra leads** | Triggered by external signals (e.g., job posts mentioning agent-fleet ops) | Booked demos | Medium (only after PMF signals) |

## Channel-by-channel rationale

### Hacker News
- **Why**: declarative + multi-target + OAuth-rotation is exactly the kind of "I have lived this pain" post HN rewards. Headlines that have worked for adjacent products (Tailscale, Fly, OpenBao) point the way.
- **Cadence**: one Show HN at v1 launch, one Ask HN four weeks later asking operators to share their worst rotation incident.
- **Asset**: the 14-line manifest + the architecture diagram + the "we run our own fleet on this" credibility.

### Open-source GitHub repo
- **Why**: operators install before they buy. The GitHub repo is the *first conversion surface*.
- **Cadence**: weekly small PRs, monthly release notes, a tagged v1.0 at launch.
- **Asset**: a clean `README.md`, a `quickstart.sh`, a `examples/` folder with three tested manifests.

### Technical docs site
- **Why**: every sale is gated on the operator believing the docs.
- **Cadence**: docs are updated alongside every PR; a "What's new" page is maintained.
- **Asset**: the 10 docs in this folder become the docs site backbone.

### `lobste.rs`
- **Why**: quality > quantity; Maya specifically reads it.
- **Cadence**: one submission per major release.
- **Asset**: a tagged-correctly post with `practices`, `devops`, `sre` tags.

### X / Mastodon
- **Why**: short, frequent, screenshot-friendly.
- **Cadence**: 1 manifest screenshot / week, 1 reconciler-timeline GIF / month.
- **Asset**: visual. The phosphor-green status pulse on a dark dashboard is a content shape that performs.

### Mid-week newsletters
- **Why**: Maya reads them on commute or coffee.
- **Cadence**: one outreach round at v1 launch + after each major release.
- **Pitch shape**: one paragraph + one screenshot + one link.

### Indie Hackers + Show HN cross-post
- **Why**: Sasha's funnel.
- **Cadence**: one launch post; reply to relevant threads weekly.

### Subreddits
- **Why**: pain is publicly described; we answer with help, not promotion.
- **Cadence**: one helpful answer / week; never lead with the link.

### Conference talks
- **Why**: SREs trust other SREs on a stage. Maya brings back tools she saw demoed.
- **Cadence**: 1 lightning talk in Q1 of year-1, 1 full talk in Q3.
- **Target events**: Monitorama (year-1), Platform Engineering Day (year-1), KubeCon (year-2 if multi-cluster shipped).

### Adjacent-tool co-marketing
- **Why**: integrations are content assets. "Use OpenClaw Deploy with OpenBao" is a post both teams want to publish.
- **Cadence**: 1 joint post per quarter once v1 ships.

### Sponsored slots
- **Why**: cheap distribution to a guaranteed audience.
- **Cadence**: only after the docs and the demo land, otherwise we're paying to disappoint.

### LinkedIn long-form
- **Why**: Platform Engineering Managers and CTOs read LinkedIn.
- **Cadence**: every 2 weeks; never a "we just shipped X" — always a "here is a pattern we learned".

### Cold outbound
- **Why**: a sharpened tool when product-market fit is partial; not before.
- **Cadence**: started only after we have 50 self-serve installs; targeted by job-post signals (companies hiring "Platform Engineer — agent infra").

## Channels we are NOT using (and why)

- **Generic Google Ads / Facebook Ads**: audience overlap is too low; targeting is too crude.
- **TikTok / Instagram**: wrong audience.
- **Email lead-gen lists**: our buyers will hate it; brand damage > short-term return.
- **Webinar funnels**: too SaaS-marketing-flavored for this brand.

## Channel ramp by quarter

| Quarter | Active channels |
|---|---|
| Q1 (launch) | HN Show HN, GitHub, docs, lobste.rs, X, IH, 1 newsletter pitch |
| Q2 | Above + 1 conference lightning talk + 1 adjacent-tool co-post |
| Q3 | Above + LinkedIn long-form rhythm + sponsored newsletter slot |
| Q4 | Above + first cold outbound campaign (only if PMF signals say so) |
