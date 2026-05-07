import { FileCode2, Network, KeyRound } from 'lucide-react';

const FEATURES = [
  {
    icon: FileCode2,
    title: 'Manifest-driven, not click-driven.',
    body: 'YAML in, fleet out. Diff before you apply. Roll back like git. The reconciler runs every 5 seconds and is idempotent — safe to interrupt, safe to re-apply.',
    bullet: 'fleet.yaml → reconciled state',
  },
  {
    icon: Network,
    title: 'One control plane. Three target types.',
    body: 'Incus, Docker, fresh VPS — same manifest, same drain semantics, same audit log. The driver layer hides the differences. Mix targets in a single fleet.',
    bullet: 'incus:// · docker:// · vps://',
  },
  {
    icon: KeyRound,
    title: "OAuth rotation that doesn't fail at 3 AM.",
    body: 'Dependency-ordered, in-flight-task-aware, zero-overlap rotation. 19 agents in 47 seconds with no 401s on the timeline. Your on-call shift, returned.',
    bullet: 'rolling · dependency-ordered',
  },
];

export function FeatureTriad() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
            // why operators ship faster on this
          </p>
          <h2 className="font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
            A small surface. Operator-grade.
          </h2>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body, bullet }) => (
          <article
            key={title}
            className="group relative flex flex-col gap-4 rounded-xl border border-border bg-surface-1 p-6 transition-colors hover:border-signal/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-2">
              <Icon className="h-5 w-5 text-signal" />
            </div>
            <h3 className="font-display text-xl font-600 leading-snug text-text-primary">
              {title}
            </h3>
            <p className="text-[15px] leading-relaxed text-text-muted">{body}</p>
            <div className="mt-auto pt-3">
              <span className="inline-flex items-center gap-2 rounded border border-border-subtle bg-surface-0 px-2.5 py-1 font-mono text-[11px] text-text-muted">
                <span className="text-signal">›</span>
                {bullet}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
