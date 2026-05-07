# 09 — Go-to-Market (90-day plan)

## Goal of the 90 days

Reach **400 GitHub stars**, **100 self-serve installs**, **15 paying Team-tier fleets** (or $3k MRR), and **1 reference customer** willing to be quoted publicly.

The plan is sequenced as: build trust → launch → amplify → convert.

## Week-by-week milestones

### Phase 1 — Trust (Weeks 1–3, T-30 to T-9)

**Week 1**
- Repo public on `github.com/prin7r-projects/openclaw-deploy`.
- Full `README.md` with quickstart.
- 10 docs live in `/docs/` and Notion.
- Landing page live at `openclaw-deploy.prin7r.com` with hero + manifest + pricing.
- Brand identity locked.

**Week 2**
- `install.sh` and CLI binary `occ` shipped (alpha label is fine).
- Three working example manifests in `examples/`.
- Architecture mermaid in docs and on landing.
- First X / Mastodon screenshot of a real manifest.

**Week 3**
- "Coming soon" capture form + first 30 emails collected.
- One adjacent-tool integration tested end-to-end (OpenBao or Vault).
- Internal Prin7r fleet migrated to be managed by OpenClaw Deploy → first dogfood proof point.

### Phase 2 — Launch (Weeks 4–6, T-9 to T+12)

**Week 4 (T-7 to T)**
- T-7: Show HN draft peer-reviewed by 2 SRE friends.
- T-3: Newsletter pitch emails written (not yet sent).
- T (Tuesday 8:00 AM PT): Show HN submitted.
- T: cross-posts to Indie Hackers, Mastodon, X, lobste.rs, r/devops, r/sre.
- T+0..T+2: respond to every comment within 60 minutes during business hours.

**Week 5**
- T+5: first "drift diary" post — uses real audit timeline from launch week.
- T+7: newsletter pitch emails sent in a single batch (Bytes, *Pointer*, *DevOps Weekly*, *This Week in TS*).
- Track installs, stars, signups daily.

**Week 6**
- T+10: shape an "Ask HN" — *"How do you rotate OAuth across an agent fleet?"* — to harvest pain.
- T+14: first "03:00 Story" essay (anonymized).

### Phase 3 — Amplify (Weeks 7–10)

**Week 7**
- First adjacent-tool co-marketing post planned (target: Coolify or Dokploy team).
- Conference lightning-talk submitted (target: Monitorama 2026).
- LinkedIn long-form #1 ("What an agent fleet rotation should feel like").

**Week 8**
- "Mixed-target patterns" post (Pillar 2).
- First five Team-tier signups expected; collect testimonials with consent.
- Identify 3 candidates for "reference customer" interviews.

**Week 9**
- Launch the cost-meter blog post with anonymized data from internal fleet.
- One sponsored slot purchased in *DevOps Weekly* or *Status Code*.

**Week 10**
- First X / Mastodon GIF of the reconciler timeline (high-engagement asset).
- Reach out to 5 Platform Engineering newsletters with a compact pitch.

### Phase 4 — Convert (Weeks 11–13)

**Week 11**
- "Operator's notebook: onboarding a new VPS in 4 minutes" runbook post.
- Reach out to free-tier users at the 10-agent threshold with a personalized note (no spam).

**Week 12**
- One reference customer interview published.
- Stats post: T+90 retrospective ("90 days, X stars, Y installs, Z fleets reconciled").
- Submit talk to Platform Engineering Day.

**Week 13**
- Plan v2 (multi-region) on the public roadmap based on user feedback.
- One LinkedIn long-form synthesizing 90 days of operator pain stories.
- Decide on year-1 budget for cold outbound (only if installs > 200).

## Launch checklist (printed and pinned)

Before T:
- [ ] Repo public, license MIT, README with one screenshot
- [ ] Landing live, status 200, valid TLS, mobile-tested
- [ ] `install.sh` works on Linux + macOS
- [ ] `occ apply -f examples/minimal.yaml --dry-run` succeeds
- [ ] Status page domain reserved (even if blank)
- [ ] Discord / Slack community link in repo and landing
- [ ] Twitter / Mastodon handle owned
- [ ] Show HN copy reviewed by 2 SREs
- [ ] First 30 email-capture replies sent personal "thanks for signing up"
- [ ] On-call shift assigned for launch day (you, T+0..T+12 hours)

After T:
- [ ] Reply to every HN comment in <60 min during business hours
- [ ] Track signup → install → first apply funnel daily
- [ ] Daily standup with self for first 7 days
- [ ] Hold a public weekly office hour (Discord) for first 30 days

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Show HN flops | Have a "Tell HN" ready 14 days later focused on a specific lesson; keep momentum |
| Reconciler bug in launch week | Beta period before launch; one of us on-call; pre-published rollback plan |
| Comparison to k8s drowns conversation | Pre-empt with a "Why not k8s?" doc linked from launch post |
| Sasha (free tier) drives all traffic, no Maya conversion | Targeted LinkedIn/newsletter content for Maya *during* launch week |
| Adjacent tool ships overlapping feature | We are focused on agents, not generic services; defend on niche |

## What success looks like at T+90

- 400+ GitHub stars
- 100+ `install.sh` runs
- 15+ Team-tier fleets paying
- 1 reference customer ready to be quoted
- 1 conference talk submitted
- 5 adjacent-tool integrations working
- Reconciler reliability: 99.5%+ on internal fleet
