type Row = {
  name: string;
  type: 'OpenClaw' | 'Hermes' | 'NanoClaw';
  target: string;
  replicas: string;
  state: 'healthy' | 'drift' | 'down' | 'draining';
  cost: string;
};

const ROWS: Row[] = [
  { name: 'nanoclaw-pool', type: 'NanoClaw', target: 'incus://dev2', replicas: '5/5', state: 'healthy', cost: '$2.41/d' },
  { name: 'hermes-bridge', type: 'Hermes', target: 'docker://144', replicas: '2/2', state: 'healthy', cost: '$0.74/d' },
  { name: 'openclaw-eu', type: 'OpenClaw', target: 'incus://dev2', replicas: '12/12', state: 'healthy', cost: '$5.18/d' },
  { name: 'openclaw-staging', type: 'OpenClaw', target: 'docker://staging', replicas: '3/3', state: 'draining', cost: '$1.02/d' },
  { name: 'nanoclaw-batch', type: 'NanoClaw', target: 'vps://contabo-c', replicas: '4/4', state: 'healthy', cost: '$1.86/d' },
];

const dotClass = (s: Row['state']) =>
  s === 'healthy' ? 'dot dot-signal' :
  s === 'draining' ? 'dot dot-warn' :
  s === 'drift' ? 'dot dot-warn' :
  'dot dot-alert';

const stateLabel: Record<Row['state'], string> = {
  healthy: 'running',
  drift: 'drift',
  down: 'down',
  draining: 'draining',
};

export function StatusBand() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 md:pb-24">
      <div className="overflow-hidden rounded-xl border border-border bg-surface-1 shadow-[0_0_0_1px_rgba(124,255,161,0.04)]">
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-2/40 px-5 py-3">
          <div className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-widest text-text-muted">
            <span className="dot dot-signal" />
            <span>fleet · prin7r-prod</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[12px] text-text-muted">
            <span>last reconcile · 2.4s ago</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">26 agents · 3 hosts · $11.21/day</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] font-mono text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-text-muted">
                <th className="px-5 py-3 font-500">agent</th>
                <th className="py-3 font-500">type</th>
                <th className="py-3 font-500">target</th>
                <th className="py-3 font-500">replicas</th>
                <th className="py-3 font-500">state</th>
                <th className="py-3 pr-5 text-right font-500">cost</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.name} className="border-t border-border-subtle hover:bg-surface-2/40">
                  <td className="px-5 py-3 text-text-primary">{r.name}</td>
                  <td className="py-3 text-text-primary">{r.type}</td>
                  <td className="py-3 text-text-muted">{r.target}</td>
                  <td className="py-3 text-text-muted">{r.replicas}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className={dotClass(r.state)} />
                      <span
                        className={
                          r.state === 'healthy'
                            ? 'text-signal'
                            : r.state === 'draining'
                            ? 'text-warn'
                            : 'text-alert'
                        }
                      >
                        {stateLabel[r.state]}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 pr-5 text-right text-text-primary">{r.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
