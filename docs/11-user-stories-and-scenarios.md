# 11 · User stories and scenarios

> Cold Iron / OpenClaw Deploy is a declarative control plane for agent fleets. Buyers run dozens
> of workers across mixed Incus / Docker / VPS targets and want the reconcile loop in one place.

## 1. Personas summary

- **Maya, Lead Platform Engineer at a 12–80 person AI-native company.** Owns agent uptime + key
  rotation + per-agent cost attribution. Rejects bespoke deploy scripts. — see `05-audience-profile.md`
  §Maya.
- **Sasha, indie founder running a side fleet of vertical-product agents.** Wants spin-up in <60s
  and predictable bill. — see `05-audience-profile.md` §Sasha.
- **Cold Iron operator (internal SRE).** Owns the reconciler, the executor drivers, and the key-
  rotation policy in production for paying customers.

## 2. Primary user stories (12)

1. **As Maya**, I want to declare my fleet in `fleet.yaml` (agents × targets × replicas), so that I
   never run a one-off bash script again.
2. **As Maya**, I want `occ apply` to diff desired vs observed and reconcile, so that I see exactly
   what's about to change before I confirm.
3. **As Maya**, I want OAuth + API-key rotation as a first-class verb (`occ rotate`), so that
   key-expiry incidents are rotations, not outages.
4. **As Maya**, I want per-agent cost telemetry surfaced in the operator UI, so that I can give my
   CTO a single number for daily fleet cost.
5. **As Maya**, I want autoscale rules per agent (min/max replicas + pool capacity), so that I
   don't manually scale at peak.
6. **As Sasha**, I want to install Cold Iron with one curl-pipe-bash on a fresh VPS, so that I'm
   running in under 5 minutes.
7. **As Sasha**, I want the underlying compose / Incus profile / cloud-init for any agent one
   click away, so that "magic" never blocks me from debugging.
8. **As Maya**, I want the executor to be target-agnostic (Incus / Docker / VPS), so that I can
   migrate hosts without rewriting manifests.
9. **As Maya**, I want a health dashboard that color-codes drift (green = matches, yellow = drifted
   non-critical, red = drifted critical), so that morning standup takes 30 seconds.
10. **As Cold Iron operator**, I want every `occ apply` written to an append-only audit log with
    the pre/post state, so that incidents are forensic-friendly.
11. **As Maya**, I want a webhook on every reconcile event, so that I can feed it into Slack, Loki,
    or my own ops tooling.
12. **As Maya**, I want OAuth token expiry detected pre-emptively (T-24h) and queued for rotation,
    so that 03:00 pages stop happening.

## 3. Main scenarios (happy paths)

### Scenario A — Maya bootstraps a 12-agent fleet from scratch

1. **Trigger.** Maya replaces a legacy ad-hoc deploy with Cold Iron.
2. **Steps.**
   1. `curl -fsSL install.cold-iron.sh | bash` on the control-plane VPS.
   2. `occ login` (signs in via Cold Iron account).
   3. `occ targets add incus@host-a` + `docker@host-b` + `vps@host-c` (with SSH keys).
   4. Authors `fleet.yaml` declaring 12 agents (5 OpenClaw, 4 Hermes, 3 NanoClaw) with placement
      hints + replicas + cost ceiling.
   5. `occ plan` shows the diff: 0 existing → 12 new pods.
   6. `occ apply` reconciles. Progress streamed; healthchecks come up green within 4 minutes.
3. **Success criteria.** All 12 agents healthy; cost meter shows $X/day; webhook fires reconcile
   event.
4. **Frontend.** Operator UI / `occ` CLI.
5. **Backend.** API → reconciler → executors (Incus driver, Docker driver, VPS bootstrap driver) →
   targets.

### Scenario B — Sasha runs `occ install` on a $4 VPS

1. **Trigger.** Sasha shipping a vertical-product agent fleet on the side.
2. **Steps.**
   1. Spins up a Hetzner CX11.
   2. `curl -fsSL install.cold-iron.sh | bash`.
   3. Adds his own VPS as a target with `occ targets add vps@self`.
   4. Drops a 3-agent `fleet.yaml`.
   5. `occ apply`. 3 agents come up.
3. **Success criteria.** Fleet up in <5 min from a fresh VPS.

### Scenario C — OAuth rotation T-24h before expiry

1. **Trigger.** Token-expiry detector cron flags 4 OpenClaw OAuth tokens expiring in 24h.
2. **Steps.**
   1. Detector queues 4 rotation jobs.
   2. Each job: provision new token via OAuth flow (using stored refresh token), update Vault
      adapter, push token to running agents via `executor.update_secret`, mark old token revoked.
   3. Webhook fires `secret.rotated` events.
3. **Success criteria.** All 4 rotated before expiry; no agent went unhealthy.

### Scenario D — Autoscale at peak

1. **Trigger.** Hermes pool hits 90% utilization.
2. **Steps.** Reconciler triggers replica scaling within `autoscale.max`. Executor spawns 3 new
   Hermes pods on Docker host B. Healthchecks green.
3. **Success criteria.** Utilization drops to <70% within 90s; cost meter reflects.

### Scenario E — Drift detected on a target

1. **Trigger.** Maya manually killed an agent on host-c (testing).
2. **Steps.** Reconciler observes; runs the executor's "ensure running" verb; replaces. Audit log
   captures `drift_detected → reconciled` event.
3. **Success criteria.** Within 60s, replacement comes up; webhook fires.

### Scenario F — Cost ceiling triggers throttle

1. **Trigger.** Daily cost meter exceeds `fleet.yaml`'s `cost_cap.daily`.
2. **Steps.** Reconciler stops scheduling new pods, alerts via webhook + email; existing pods
   continue. Operator must `occ override --cost-cap-grace 24h` to keep scaling.
3. **Success criteria.** Bill stays under cap; operator informed.

## 4. Edge case scenarios

### Edge A — Target host SSH unreachable

Reconciler marks target `degraded`; pods on that target marked `unknown`. Webhook fires. Health
panel shows red. Cold Iron does NOT reschedule pods to other targets without explicit
`failover: true` in the placement spec.

### Edge B — `fleet.yaml` invalid

CLI rejects with field-level errors before sending to API. `apply` is atomic; partial applies do
not occur.

### Edge C — Two operators apply concurrently

API serializes apply ops per fleet via row-level lock; second `apply` waits and shows a "queued"
spinner.

### Edge D — Secret rotation fails on one agent

Rotation job marks agent `secret_rotation_failed`; reconciler does not bring it back online with
the old secret; operator alerted.

### Edge E — Cold Iron itself crashes mid-reconcile

State table is consistent: every reconcile step writes status before/after. On restart, reconciler
resumes from the last completed step. No double-spawn.

### Edge F — Cost meter source unavailable

Cost telemetry uses LLM provider APIs + executor metrics. If the LLM API errors, cost is marked
`stale=true`; operator UI shows a warning. Reconciler continues otherwise.

## 5. Anti-scenarios

1. **No "managed Kubernetes" pitch.** Cold Iron is target-agnostic; we do not require k8s and we
   will not ship a k8s controller as the marquee path.
2. **No customer-supplied agent code execution as a service.** Customers run vetted images of
   OpenClaw / Hermes / NanoClaw; we do not arbitrary-exec customer code.
3. **No proprietary lock-in.** The underlying compose / Incus profile / cloud-init for any agent
   is one click away. We will not hide the substrate.
4. **No silent reschedules across targets.** Failover is opt-in per agent; we do not move pods
   surprise-style.
5. **No magic LLM-spend cap inference.** Cost caps are declared in `fleet.yaml`; we do not
   "smart-throttle" by guessing.
