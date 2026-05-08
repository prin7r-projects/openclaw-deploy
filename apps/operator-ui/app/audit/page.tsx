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

function EventTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    applied: 'bg-signal/20 text-signal',
    drifted: 'bg-warn/20 text-warn',
    reconciled: 'bg-signal/20 text-signal',
    secret_rotated: 'bg-surface-2 text-text-primary',
    cost_threshold: 'bg-alert/20 text-alert',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-mono ${styles[type] ?? 'bg-surface-2 text-text-muted'}`}>
      {type}
    </span>
  );
}

export default async function AuditPage() {
  const data = await apiFetch('/api/v1/reconciles/events?limit=100');
  const events = data?.events ?? [];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold">Audit Log</h2>
        <p className="text-text-muted mt-1">
          All reconciler actions and system events
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface-1">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold">Events</h3>
        </div>
        <div className="p-4">
          {events.length === 0 ? (
            <p className="py-8 text-center text-text-muted">
              No events recorded yet.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-mono uppercase tracking-widest text-text-muted">
                  <th className="pb-4">Time</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event: any) => (
                  <tr key={event.id} className="border-t border-border hover:bg-surface-2 transition-colors">
                    <td className="py-3 font-mono text-xs text-text-muted whitespace-nowrap">
                      {new Date(event.at).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <EventTypeBadge type={event.type} />
                    </td>
                    <td className="py-3 text-sm text-text-muted font-mono truncate max-w-md">
                      {event.payload ? JSON.stringify(event.payload) : '—'}
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
