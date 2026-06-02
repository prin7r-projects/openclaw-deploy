# Cold Iron T01 - Clean OpenClaw Deploy Preflight

Date: 2026-06-02
Scope: local fallback implementation for `wave2-projects/openclaw-deploy`.

This file is the deploy/runbook slice for the clean OpenClaw path. It does not
authorize the older product-control-plane story in the rest of the docs. It is
intentionally narrow: policy checklist, allowed deployment path, forbidden layer
grep checklist, env/secret preflight, command gates, and current blockers.

## Deploy-Policy Scope Ruling (PRI-3648, 2026-06-02)

This runbook's forbidden-layer ban was being read as if it covered the entire
product repository, which contradicted the live marketing landing at
`https://openclaw-deploy.prin7r.com` (HTTP 200) — served via `docker-compose.yml`
plus a Traefik reverse proxy. That apparent contradiction is resolved as
follows. The ban is scoped to **the OpenClaw agent runtime**, not to the
product's own web tier or to product positioning copy. Three planes:

**Plane A — OpenClaw agent runtime. The ban APPLIES (unchanged).**
Any process that actually runs a live OpenClaw / Hermes / NanoClaw gateway —
serving model traffic, MCP servers, skills, tools, and the native Telegram
channel. Today this is Alex (`openclaw-alex.service`) and Katya
(`openclaw-katya.service`) on server `213.136.83.171`, plus any future
control-plane-managed customer fleet. Allowed deployment shapes are only the two
in "Allowed Deployment Path" below (bare-metal systemd or a plain Incus
container). Docker Compose, Railway, Coolify, Dokploy, docker-agent-fleet,
CosmOS, nested orchestrators, and custom Telegram bridges remain forbidden here.

**Plane B — Product web tier. The ban DOES NOT APPLY (carve-out).**
The OpenClaw Deploy product's own shop-window: the marketing landing
(`apps/landing`, Next.js), the `/api` control-plane stub (`apps/api`), and the
operator UI (`apps/operator-ui`). These are stateless web services. They hold no
agent state, run no OpenClaw gateway, route no model or Telegram traffic, and
manage no fleet. The canonical and authorized deploy path for this tier is the
repository's `docker-compose.yml` + Traefik on the web host — which is what the
live landing already runs. This is ordinary web hosting and is explicitly
permitted. The live Compose deploy is therefore NOT a policy violation.

**Plane C — Product domain vocabulary. Not a deploy method at all.**
Strategy/architecture/sales docs that *name* Docker, Dokploy, or Coolify as the
product's integration targets or named competitors (e.g.
`docs/02-architecture.md`, `docs/04-pain-points.md`, `docs/07-sales-strategy.md`,
`docs/10-pitch-deck.md`, `docs/pitch-deck.html`) describe what the product does
for its users. They are not OpenClaw deployment instructions and must not be
treated as forbidden-layer matches.

**Guardrail (when the carve-out expires).** The Plane B carve-out is for web
services only. If the `/api` stub or operator UI ever gains the ability to
actually spawn, host, or run live OpenClaw agents (rather than merely call out to
a fleet), that agent-running component crosses into Plane A and must move to the
bare-metal-systemd / plain-Incus path. The web frontends may stay on Compose.

This ruling is the canonical resolution; the grep-gate expectations below are
corrected to match it.

**Owner notification.** The owners tracked in PRI-3519 and PRI-2911 are notified
of this ruling via PRI-3648; they may treat the live Plane B Compose/Traefik
deploy of the landing, `/api` stub, and operator UI as authorized and may stop
filing it as an audit violation. Plane A (live OpenClaw agent gateways) remains
gated on bare-metal-systemd / plain-Incus per the Allowed Deployment Path below.

## Policy Checklist

- OpenClaw production must be plain OpenClaw only: gateway, MCP servers, skills,
  tools, and native Telegram channel.
- Supported deployment modes are bare-metal systemd or a plain Incus container.
- Alex/Katya production is server 171 only: `213.136.83.171`.
- Alex runs as `openclaw-alex.service` on `127.0.0.1:18790`.
- Katya runs as `openclaw-katya.service` on `127.0.0.1:18791`.
- Server 45, `187.127.230.45`, is decommissioned and must not be deployed to or
  started.
- Keys come from `/Users/keer/.nth-kir-keys.env`; never duplicate them into
  repo files, docs, patch files, logs, or shell history.
- Direct OpenAI API-key routing and Codex/ChatGPT subscription auth must not be
  described as interchangeable.

## Forbidden Layers

These are forbidden **for the Plane A OpenClaw agent runtime** (see the scope
ruling above). They are not forbidden for the Plane B product web tier, where
`docker-compose.yml` + Traefik is the authorized path, and they may be *named*
as product integration targets / competitors in Plane C positioning copy.

Do not use or introduce:

- Railway, Coolify, Dokploy, CosmOS, docker-agent-fleet, or other fleet
  orchestrators;
- custom Telegram bridges, custom polling loops, or unofficial Telegram
  transports;
- n8n, Calendly proxy, SiYuan, UNDB, agent-OS, Company-OS, or similar deploy
  layers;
- old `openai-codex/gpt-*` or `codex-cli/gpt-*` model references in new
  production config;
- Docker Compose as an OpenClaw production deployment path.

## Allowed Deployment Path

Use one of these shapes only:

1. Bare-metal systemd.
   - Install OpenClaw for the Linux user that owns the agent.
   - Run the gateway on loopback with `--auth none` only where project policy
     explicitly allows it.
   - Keep OpenClaw config, state, workspace, MCP definitions, skills, and tools
     under that user's home directory.
   - Verify via systemd status, local gateway health, model status, logs, and a
     real OpenClaw loopback smoke.

2. Plain Incus container.
   - Container has one clear OpenClaw installation and one systemd-managed
     gateway per agent.
   - No nested orchestrator, no custom Telegram daemon, no n8n, no external
     deploy platform.
   - Verify from inside the container and from the host loopback/proxy boundary.

## Env And Secret Preflight

Run these checks locally before any deploy command. They print presence only,
not values.

```bash
python3 - <<'PY'
from pathlib import Path
keys = {}
for line in Path("/Users/keer/.nth-kir-keys.env").read_text().splitlines():
    if not line or line.lstrip().startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    keys[k.strip()] = bool(v.strip().strip("'\""))
for name in ["CLAUDE_CODE_OAUTH_TOKEN", "GROQ_API_KEY"]:
    print(f"{name}=present:{keys.get(name, False)}")
if "OPENROUTER_API_KEY" in keys:
    print(f"OPENROUTER_API_KEY=present:{keys.get('OPENROUTER_API_KEY', False)}")
PY
```

Required:

- `CLAUDE_CODE_OAUTH_TOKEN` is present for Claude Code subscription auth
  preflight.
- `GROQ_API_KEY` is present; audio/voice processing is not ready without it.
- `OPENROUTER_API_KEY` is required only when OpenRouter-backed routing is
  explicitly requested.
- Telegram bot tokens, OAuth profiles, API keys, and NOWPayments secrets must
  stay outside this repository.

## Forbidden Layer Grep Checklist

Use these commands as gates. `docs/14-audit-cold-iron-t01.md` is excluded from
strict grep because it intentionally contains the denylist.

**Scope correction (PRI-3648).** This grep is a heuristic for catching a
forbidden **agent-runtime** deploy path or a leaked secret/decommissioned host.
It is not a literal-string ban across the whole repo. Per the scope ruling
above, two match classes are EXPECTED and are NOT blockers:

- Plane C product-positioning docs and UI copy that name Docker / Dokploy /
  Coolify / Railway / CosmOS as integration targets or competitors
  (`docs/02-architecture.md`, `docs/04-pain-points.md`,
  `docs/06-sales-channels.md`, `docs/07-sales-strategy.md`,
  `docs/09-go-to-market.md`, `docs/10-pitch-deck.md`,
  `docs/12-technical-specification.md`, `docs/pitch-deck.html`, and
  `apps/landing/components/Faq.tsx`).
- The Plane B web-tier `docker-compose.yml` + Traefik labels, and the
  `install.sh` web-tier bootstrap that runs `docker compose build` / `up`
  for the landing + `/api` stub + operator UI.

A match is a real blocker only when it would put an **OpenClaw agent gateway**
(Plane A) on a forbidden layer, or when it leaks a secret, a custom Telegram
transport, a stale `codex-cli`/`openai-codex` model ref, or the decommissioned
host `187.127.230.45`. The strict-zero expectation below therefore applies after
excluding the Plane B/C files; treat residual matches against that narrowed set
as blockers.

```bash
rg -n -i "Railway|Coolify|Dokploy|docker-agent-fleet|CosmOS|n8n|Calendly|SiYuan|UNDB|custom Telegram|Telegram bridge|Telegram.*poll|polling loop|Docker Compose|openai-codex|codex-cli|187\\.127\\.230\\.45" README.md docs --glob '!docs/14-audit-cold-iron-t01.md'
```

Expected for a clean docs slice: no matches, exit code `1`.

```bash
rg -n -i "Railway|Coolify|Dokploy|docker-agent-fleet|CosmOS|n8n|Calendly|SiYuan|UNDB|custom Telegram|Telegram bridge|Telegram.*poll|polling loop|Docker Compose|openai-codex|codex-cli|187\\.127\\.230\\.45" Dockerfile* docker-compose.yml install.sh scripts apps --glob '!**/node_modules/**'
```

Expected for a clean runtime/deploy slice: no matches, exit code `1`.

If either command exits `0`, treat every match as a blocker unless it is inside
an audit/runbook section that exists only to name forbidden layers.

## Command Gates

Minimum local gates for this repository:

```bash
git status --short
test -f docs/14-audit-cold-iron-t01.md
rg -n -i "Railway|Coolify|Dokploy|docker-agent-fleet|CosmOS|n8n|Calendly|SiYuan|UNDB|custom Telegram|Telegram bridge|Telegram.*poll|polling loop|Docker Compose|openai-codex|codex-cli|187\\.127\\.230\\.45" README.md docs --glob '!docs/14-audit-cold-iron-t01.md'
python3 - <<'PY'
from pathlib import Path
keys = {}
for line in Path("/Users/keer/.nth-kir-keys.env").read_text().splitlines():
    if not line or line.lstrip().startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    keys[k.strip()] = bool(v.strip().strip("'\""))
missing = [k for k in ["CLAUDE_CODE_OAUTH_TOKEN", "GROQ_API_KEY"] if not keys.get(k)]
print("missing=" + ",".join(missing) if missing else "required_keys=present")
raise SystemExit(1 if missing else 0)
PY
```

Minimum remote gates for any future clean OpenClaw deploy:

```bash
ssh root@213.136.83.171 'systemctl --no-pager --plain --full status openclaw-alex.service openclaw-katya.service'
ssh root@213.136.83.171 'for p in 18790 18791; do echo health_$p; curl -fsS http://127.0.0.1:$p/health; echo; done'
ssh root@213.136.83.171 'for u in alex katya; do echo ==$u==; sudo -H -u $u env HOME=/home/$u OPENCLAW_CONFIG_PATH=/home/$u/openclaw/openclaw.json OPENCLAW_STATE_DIR=/home/$u/.openclaw bash -lc "cd /home/$u/openclaw/workspace && openclaw models status"; done'
```

Do not run Telegram client-facing tests until loopback/OpenClaw smokes pass and
the test recipient is explicitly approved.

## Current Blockers

- Existing README/docs contain control-plane language around mixed
  Incus/Docker/VPS targets, Dokploy, and integrations. Per the PRI-3648 scope
  ruling, that material is Plane C product positioning (what the product manages
  for users), not an authorized OpenClaw agent-runtime deploy path — it is no
  longer a blocker, only a reminder that it does not describe Plane A.
- This local repository has product stubs for API, operator UI, executors, and
  CLI, but it does not yet contain filesystem evidence for a clean plain
  OpenClaw deploy.
- No remote deployment target is configured for this local fallback slice.
- Live Alex/Katya production changes must be made from
  `/Users/keer/projects/simple-agent-deploy`, not from this repository.
- Build/lint gates are only supporting evidence for local docs/frontend health;
  they do not prove OpenClaw deployment readiness.

## Acceptance Criteria

- README links this runbook and no longer presents Docker/Dokploy as the
  authorized deployment path.
- This file records the policy, allowed path, forbidden layer grep checklist,
  env/secret preflight, command gates, and blockers.
- No secrets are printed or copied.
- No `Dockerfile*`, `docker-compose.yml`, `install.sh`, deploy script, runtime
  unit, or unrelated file is edited for this fallback slice.
