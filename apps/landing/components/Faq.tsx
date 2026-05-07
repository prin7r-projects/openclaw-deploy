const QA = [
  {
    q: 'We already run Kubernetes. Why this?',
    a: 'Run OpenClaw Deploy as a thin layer on top — your k8s cluster is one of its targets. Most teams use it specifically because their agents are not a good fit for k8s pods (stateful, sub-1k in count, redeployed frequently).',
  },
  {
    q: 'Why not just bash + Ansible?',
    a: 'Bash + Ansible is fine until your first 03:00 OAuth incident. We exist for the day after that incident. Try the free tier — if your bash scripts are still fine in 90 days, you did not need us.',
  },
  {
    q: 'How is this different from Coolify or Dokploy?',
    a: 'Coolify and Dokploy are deployment tools — they deploy services. We are a fleet reconciliation tool — we manage running populations of agents with health, OAuth, and drain semantics. We integrate with Dokploy as one of our Docker drivers.',
  },
  {
    q: 'Is this safe to run in production?',
    a: 'The reconciler is idempotent and append-only at the audit layer. We dogfood it on the Prin7r production fleet. The roadmap is conservative — no rewrites of the v1 schema for at least 18 months.',
  },
  {
    q: 'What about vendor lock-in?',
    a: 'Manifests are plain YAML. State is your SQLite or Postgres. Drivers are open-source. If you ever leave OpenClaw Deploy, your manifests still describe your fleet for any successor tool.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <div className="mb-10">
        <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
          // common questions
        </p>
        <h2 className="font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
          The questions Maya asks first.
        </h2>
      </div>

      <div className="space-y-3">
        {QA.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-xl border border-border bg-surface-1 p-5 open:border-signal/40"
          >
            <summary className="flex cursor-pointer items-start justify-between gap-4 text-left text-[16px] font-500 text-text-primary marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="font-display">{q}</span>
              <span className="ml-2 mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border font-mono text-xs text-text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
