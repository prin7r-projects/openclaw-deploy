type Step = {
  ts: string;
  agent: string;
  state: 'rotating' | 'rotated' | 'pending';
};

const TIMELINE: Step[] = [
  { ts: '09:00:00.412', agent: 'nanoclaw-pool/0', state: 'rotated' },
  { ts: '09:00:02.811', agent: 'nanoclaw-pool/1', state: 'rotated' },
  { ts: '09:00:05.214', agent: 'nanoclaw-pool/2', state: 'rotated' },
  { ts: '09:00:07.620', agent: 'nanoclaw-pool/3', state: 'rotated' },
  { ts: '09:00:10.039', agent: 'nanoclaw-pool/4', state: 'rotated' },
  { ts: '09:00:12.488', agent: 'hermes-bridge/0', state: 'rotated' },
  { ts: '09:00:14.910', agent: 'hermes-bridge/1', state: 'rotating' },
  { ts: '09:00:17.----', agent: 'openclaw-eu/0', state: 'pending' },
];

const counts = {
  total: 19,
  rotated: 12,
  rotating: 1,
  pending: 6,
  zero401s: 0,
  duration: '47s',
};

function badge(state: Step['state']) {
  if (state === 'rotated')
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-signal/30 bg-signal/5 px-1.5 py-0.5 font-mono text-[11px] text-signal">
        <span className="dot dot-signal" />
        rotated
      </span>
    );
  if (state === 'rotating')
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-warn/30 bg-warn/5 px-1.5 py-0.5 font-mono text-[11px] text-warn">
        <span className="dot dot-warn" />
        rotating
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-muted">
      <span className="dot bg-text-muted/50" />
      pending
    </span>
  );
}

export function Reconciler() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div>
          <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
            // the 03:00 problem, solved
          </p>
          <h2 className="mb-4 font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
            19 agents.
            <br />
            <span className="text-signal">47 seconds.</span> Zero 401s.
          </h2>
          <p className="mb-6 max-w-xl text-[16px] leading-relaxed text-text-muted">
            Quarterly OAuth rotation used to be a pager-bait routine. The
            reconciler walks agents in dependency order, drains in-flight
            tasks, swaps the credential, and confirms — then moves to the
            next. Old tokens are retired before new tokens are loaded. No
            overlap. No loss.
          </p>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="agents" value={counts.total.toString()} />
            <Stat label="duration" value={counts.duration} accent />
            <Stat label="401s" value="0" />
            <Stat label="dropped tasks" value="0" />
          </dl>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface-1">
          <div className="flex items-center justify-between border-b border-border-subtle bg-surface-2/40 px-5 py-3">
            <span className="font-mono text-[12px] uppercase tracking-widest text-text-muted">
              audit · rotation · monday 09:00 UTC
            </span>
            <span className="font-mono text-[12px] text-text-muted">
              ref vault://oauth/claude_main
            </span>
          </div>
          <ol className="divide-y divide-border-subtle font-mono text-[13px]">
            {TIMELINE.map((step, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between gap-4 px-5 py-2.5 hover:bg-surface-2/40"
              >
                <span className="text-text-muted">{step.ts}</span>
                <span className="flex-1 truncate text-text-primary">{step.agent}</span>
                {badge(step.state)}
              </li>
            ))}
          </ol>
          <div className="flex items-center justify-between border-t border-border-subtle bg-surface-2/40 px-5 py-3 font-mono text-[12px]">
            <span className="text-text-muted">strategy: rolling · concurrency: 1</span>
            <span className="text-signal">in flight</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-1 px-3.5 py-3">
      <div
        className={`font-display text-2xl font-700 ${
          accent ? 'text-signal' : 'text-text-primary'
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-widest text-text-muted">
        {label}
      </div>
    </div>
  );
}
