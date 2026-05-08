const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';
const API_TOKEN = process.env.COLD_IRON_API_TOKEN ?? '';

async function apiFetch(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      next: { revalidate: 10 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    applied: 'bg-signal/20 text-signal',
    pending: 'bg-warn/20 text-warn',
    drift_detected: 'bg-warn/20 text-warn',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-mono ${styles[status] ?? 'bg-surface-2 text-text-muted'}`}>
      {status}
    </span>
  );
}

export default async function FleetsPage() {
  const data = await apiFetch('/api/v1/fleets');
  const fleets = data?.fleets ?? [];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold">Fleets</h2>
        <p className="text-text-muted mt-1">
          Manage your agent fleet manifests
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface-1">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold">All Fleets</h3>
          <button className="px-4 py-2 bg-signal text-surface-0 font-mono text-sm font-semibold rounded hover:bg-signal/90 transition-colors">
            + New Fleet
          </button>
        </div>
        <div className="p-4">
          {fleets.length === 0 ? (
            <p className="py-8 text-center text-text-muted">
              No fleets configured. Use{' '}
              <code className="font-mono text-signal">
                occ apply -f fleet.yaml
              </code>{' '}
              to create one.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-mono uppercase tracking-widest text-text-muted">
                  <th className="pb-4">Name</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Revision</th>
                  <th className="pb-4">Agents</th>
                  <th className="pb-4">Pods</th>
                  <th className="pb-4">Last Applied</th>
                </tr>
              </thead>
              <tbody>
                {fleets.map((fleet: any) => (
                  <tr key={fleet.id} className="border-t border-border hover:bg-surface-2 transition-colors">
                    <td className="py-3">
                      <a href={`/fleets/${fleet.id}`} className="text-signal hover:underline font-mono">
                        {fleet.name}
                      </a>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={fleet.status ?? 'pending'} />
                    </td>
                    <td className="py-3 font-mono text-text-muted">r{fleet.yamlRevision ?? 0}</td>
                    <td className="py-3 font-mono">{fleet.agentCount ?? 0}</td>
                    <td className="py-3 font-mono">{fleet.podCount ?? 0}</td>
                    <td className="py-3 text-text-muted text-sm">
                      {fleet.appliedAt ? new Date(fleet.appliedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
