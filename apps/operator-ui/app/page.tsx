import { Suspense } from 'react';

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

function StatusDot({ status }: { status: string }) {
  const colors = {
    running: 'bg-signal animate-pulse-signal',
    applied: 'bg-signal',
    pending: 'bg-warn',
    drift_detected: 'bg-warn',
    error: 'bg-alert animate-blink-alert',
    unreachable: 'bg-alert',
  };

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${colors[status as keyof typeof colors] ?? 'bg-text-muted'}`}
    />
  );
}

function MetricCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-6">
      <p className="text-xs font-mono uppercase tracking-widest text-signal mb-2">
        {label}
      </p>
      <p className="text-3xl font-display font-bold text-text-primary">
        {value}
      </p>
      {sublabel && (
        <p className="text-sm text-text-muted mt-1">{sublabel}</p>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const [health, fleetsData, costData, eventsData] = await Promise.all([
    apiFetch('/healthz'),
    apiFetch('/api/v1/fleets'),
    apiFetch('/api/v1/secrets/cost/summary'),
    apiFetch('/api/v1/reconciles/events?limit=10'),
  ]);

  const fleets = fleetsData?.fleets ?? [];
  const totalAgents = fleets.reduce((sum: number, f: any) => sum + (f.agentCount ?? 0), 0);
  const totalPods = fleets.reduce((sum: number, f: any) => sum + (f.podCount ?? 0), 0);
  const dailyCost = costData?.totalDailyCents ?? 0;
  const events = eventsData?.events ?? [];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold">Dashboard</h2>
        <p className="text-text-muted mt-1">
          Fleet overview and system status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="API Status" value={health?.status === 'ok' ? 'Online' : 'Offline'} sublabel="Control plane" />
        <MetricCard label="Fleets" value={fleets.length} sublabel="Managed fleets" />
        <MetricCard label="Agents" value={totalAgents} sublabel={`${totalPods} pods running`} />
        <MetricCard label="Cost Today" value={`$${(dailyCost / 100).toFixed(2)}`} sublabel="Across all fleets" />
      </div>

      <div className="rounded-lg border border-border bg-surface-1">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold">Recent Activity</h3>
        </div>
        <div className="p-4">
          {events.length === 0 ? (
            <p className="text-text-muted text-sm">
              No recent activity. Apply a fleet manifest to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((event: any) => (
                <div key={event.id} className="flex items-center gap-3 text-sm">
                  <StatusDot status={event.type === 'applied' ? 'applied' : event.type === 'drifted' ? 'drift_detected' : 'pending'} />
                  <span className="font-mono text-xs text-text-muted">
                    {new Date(event.at).toLocaleTimeString()}
                  </span>
                  <span className="text-text-primary">{event.type}</span>
                  {event.payload && (
                    <span className="text-text-muted truncate">
                      {typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
