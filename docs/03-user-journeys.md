# 03 — User Journeys

Three journeys, sequenced as discovery → first value → recurring use.

---

## Journey A — *Discovery* — Maya finds OpenClaw Deploy on Hacker News

### Context
Maya runs platform engineering at a 40-person AI startup. They have 14 OpenClaw agents, 3 Hermes bridges, and a growing set of NanoClaws on three hosts. Last week one OAuth token rotation broke six agents at once because the deploy was a custom bash script.

### Steps
1. **Trigger**: she sees `Show HN: OpenClaw Deploy — declarative fleets across Incus / Docker / VPS` on her morning HN feed.
2. **Lands on `openclaw-deploy.prin7r.com`**: hero shows a 14-line `fleet.yaml` with three agent types and a phosphor-green "reconciled" badge. Headline says: *Declare what you want. We reconcile until you have it.*
3. **Scrolls to feature triad**: sees three short blocks — "Manifest-driven", "Multi-target", "OAuth rotation that doesn't fail at 3 AM". The third block stops her — that's exactly what bit her last week.
4. **Reads the architecture mermaid diagram** (link to docs from landing).
5. **Stars the GitHub repo**, drops the link in her team's `#platform` Slack with `"this is what we keep almost-building"`.

### Success criteria
- Time from landing → docs page < 30 seconds.
- Operator immediately sees the manifest, the reconciler, and a credible "we run our own fleet on this" story.
- Zero "AI assistant" / chat-bubble friction.

---

## Journey B — *First value* — Maya runs `occ apply` on her staging fleet

### Context
She set up the control plane on a small VPS, generated an API token, and pointed it at her staging Incus host.

### Steps
1. **Installs CLI**: `curl -fsSL https://openclaw-deploy.prin7r.com/install.sh | bash` (one binary).
2. **Drafts manifest**: copies the example from the docs, edits agent counts to match her staging fleet (3 OpenClaws, 1 Hermes, 1 NanoClaw).
3. **Dry-run**: `occ apply -f fleet.yaml --dry-run`. Sees a colorized diff: `+3 OpenClaw / +1 Hermes / +1 NanoClaw — 0 changes to existing`.
4. **Apply**: `occ apply -f fleet.yaml`. Watches the reconciler in `--watch` mode — five status lines flip from `pending → starting → running` in under 8 seconds.
5. **Visits dashboard** (post-v1): sees five green status dots pulsing at 1.6Hz. The `$/day` column shows `$2.41` rolling.
6. **Drain test**: `occ drain openclaw-3 --reason "kernel update"`. Status flips to `draining`, then `stopped`, in 11 seconds. No errors.

### Success criteria
- From `curl install` to first running fleet in under 5 minutes.
- The first manifest apply succeeds without reading more than the quickstart.
- Drain & rotate operations complete without human babysitting.

---

## Journey C — *Recurring use* — Maya rotates the org-wide Claude OAuth token at 9:00 AM Monday

### Context
Quarterly token rotation. Previously: 90 minutes of paged-in ops, 2 incidents, a postmortem. She has been dreading this Monday since Friday.

### Steps
1. **Updates Vault**: drops the new token under `vault://oauth/claude_main`.
2. **Triggers rotation**: `occ rotate-keys --ref vault://oauth/claude_main --strategy rolling`.
3. **Watches the timeline view**: agents rotate one-at-a-time in dependency order; each rotation completes within 4 seconds; old token is cleanly retired before the next agent starts.
4. **Total time**: 47 seconds for 19 agents across three hosts. Zero 401s on the timeline.
5. **Posts in `#platform`**: `"rotation done in <1 min. fleet is green. taking the rest of the morning back."`

### Success criteria
- Rotation finishes for 19 agents in under 60 seconds.
- Zero in-flight task disruption (drain pattern: finish current task, swap, resume).
- Audit log records every step, exportable to the team's compliance bucket.

---

## Cross-journey themes

- Every successful interaction reinforces the brand essence: *reconciled*. The product never says "trying" — it says "applied" or "drift detected".
- Operators are rewarded for typing fast. The CLI is the primary surface; the UI is the secondary.
- Time-to-value is the conversion metric: install to first reconciled fleet must stay under 5 minutes for the entire roadmap.
