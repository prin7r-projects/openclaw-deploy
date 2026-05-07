import { CircuitBoard, Boxes, ShieldCheck, ScrollText } from 'lucide-react';

const POINTS = [
  {
    icon: CircuitBoard,
    title: 'We run our own fleet on this.',
    body: "Prin7r's production agent fleet — the system that built this site — is managed by OpenClaw Deploy. Operator zero is us.",
  },
  {
    icon: Boxes,
    title: 'Open by default.',
    body: 'MIT licensed. Manifests are YAML. State lives in your Postgres or SQLite. Drivers are inspectable, replaceable, forkable.',
  },
  {
    icon: ShieldCheck,
    title: 'Idempotent, append-only.',
    body: 'The reconciler is safe to interrupt and re-apply. Audit log is append-only and exportable to any S3-compatible bucket.',
  },
  {
    icon: ScrollText,
    title: 'No vendor lock-in.',
    body: 'Your manifests are portable plain-text. If you ever leave OpenClaw Deploy, every successor tool can read the same files.',
  },
];

export function ProofPoints() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="mb-10">
        <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
          // why operators trust this
        </p>
        <h2 className="font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
          Built for the people on the pager.
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {POINTS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-xl border border-border bg-surface-1 p-6"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2">
              <Icon className="h-5 w-5 text-signal" />
            </div>
            <div>
              <h3 className="mb-1.5 font-display text-lg font-600 text-text-primary">
                {title}
              </h3>
              <p className="text-[15px] leading-relaxed text-text-muted">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
