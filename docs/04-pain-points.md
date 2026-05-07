# 04 — Pain Points

Root-cause analysis of what fleet operators actually suffer with today, and why existing alternatives fail to address it.

## P1. OAuth / API key rotation breaks fleets at 03:00

### Symptom
A rotation that "should have been routine" causes 5–20 agents to fail simultaneously with 401s. On-call gets paged. Tasks lost.

### Root causes
- Tokens are inlined into env files or Compose files — there is no abstraction layer.
- "Rolling" rotation is implemented as a manual restart script that does not wait for in-flight tasks.
- No notion of token *generation*; old and new tokens overlap chaotically.

### Why current alternatives fail
- **Bash scripts**: have no concept of "task in flight". They restart blindly.
- **Vault / OpenBao alone**: secret-storage solves *one* layer. Nothing tells the agent runtime to gracefully reload.
- **Kubernetes Secrets + rolling restart**: works *if* the operator already runs Kubernetes, which most agent fleets do not (the workloads are too stateful and too few to justify k8s overhead).

## P2. Multi-target placement is a per-host research project

### Symptom
"Add 3 NanoClaws to the dev2 host" requires the operator to remember whether dev2 runs Incus or Docker, which version, which profile, where logs are mounted, which network bridge.

### Root causes
- Each host accumulates ad-hoc conventions over months.
- Documentation drifts from reality the moment a new operator joins.
- There is no canonical declaration of "this is what runs on dev2 and how".

### Why current alternatives fail
- **Ansible**: imperative; describes *how* not *what*; reconciliation is manual.
- **Terraform**: not designed for short-lived, high-frequency resources like agent containers.
- **Nomad / Kubernetes**: heavyweight; not built for mixed Incus + Docker + raw VPS targets.

## P3. Per-agent cost attribution is a spreadsheet exercise

### Symptom
"How much did our 14 agents cost us last month?" takes a 90-minute SQL session against the LLM provider's invoice CSV.

### Root causes
- Cost meter is the *provider's*, not the operator's.
- Tagging at the API key level is too coarse — keys are reused across agents.
- No live `$/day/agent` dashboard.

### Why current alternatives fail
- **Provider dashboards** (Anthropic console, OpenRouter usage page): aggregate at the key level, not the agent level.
- **DIY logging**: each agent logs differently; rolling up requires custom ETL.
- **Datadog / Grafana Cloud**: priced for hyperscalers; overkill for a 20-agent fleet.

## P4. Drift goes unseen until users complain

### Symptom
A container exits silently. The operator only notices because a customer task didn't get processed for 4 hours.

### Root causes
- No central "what should be running vs what is running" view.
- Container restarts happen but are not surfaced.
- Health checks are per-agent and inconsistent.

### Why current alternatives fail
- **Healthchecks.io / Better Stack**: external pings; do not understand "this fleet should have 5 replicas, only 3 are alive".
- **Custom dashboards**: every fleet operator has built one and abandoned it.
- **Provider status pages**: tell you the *provider* is up, not your fleet.

## P5. Onboarding a new host means re-doing all the above

### Symptom
"We added a new VPS" means a half-day of running install scripts, configuring monitoring, copying secrets, and praying.

### Root causes
- No bootstrap automation that targets fresh VPS instances.
- Manual cloud-init scripts diverge from a "blessed" base.
- Operators dread adding capacity, which caps fleet growth.

### Why current alternatives fail
- **cloud-init alone**: produces a base host but does not register it with any fleet plane.
- **Coolify / Dokploy**: Docker-only and not built for multi-tenant agent fleets.
- **Custom Pulumi / Terraform**: works for the team that built it; brittle for everyone else.

## P6. Recovery is "scroll the logs and guess"

### Symptom
An agent failed. The operator SSHs in, runs `journalctl -u …`, scrolls 4000 lines, copies-pastes into a chat for help.

### Root causes
- Logs are local to the host, not centralized.
- Errors lack the context an operator needs (which manifest version, which token generation, last reconcile diff).
- No "show me the last successful state and what changed" affordance.

### Why current alternatives fail
- **Loki / ELK**: solve log aggregation but not the *reasoning* about what changed in the fleet plane.
- **Sentry**: solves application errors, not infra-state errors.
- **Grafana**: dashboards yes, narrative timeline no.

---

## Pain → product mapping

| Pain | OpenClaw Deploy answer |
|---|---|
| P1 OAuth rotation | First-class `rotate-keys` op with rolling, dependency-ordered, in-flight-task-aware execution |
| P2 Multi-target placement | Single manifest schema; driver layer abstracts Incus / Docker / VPS |
| P3 Cost attribution | Per-agent cost meter built into the control plane; `$/day/agent` is a column, not a query |
| P4 Drift | Reconciler runs every 5s; drift is a status, not a surprise |
| P5 New host onboarding | VPS bootstrap driver: cloud-init + auto-register with control plane |
| P6 Recovery | Audit timeline of every reconcile + diff; "what changed" is a click |
