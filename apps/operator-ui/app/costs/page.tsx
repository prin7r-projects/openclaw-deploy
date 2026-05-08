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

export default async function CostsPage() {
  const [costData, fleetsData] = await Promise.all([
    apiFetch('/api/v1/secrets/cost/summary'),
    apiFetch('/api/v1/fleets'),
  ]);

  const totalDaily = costData?.totalDailyCents ?? 0;
  const totalMonthly = costData?.totalMonthlyCents ?? 0;
  const fleetCosts = costData?.fleets ?? [];
  const fleets = fleetsData?.fleets ?? [];

  // Calculate budget percentage (assuming 10000 cents = $100 daily cap)
  const dailyCapCents = 10000;
  const budgetPercent = Math.min(100, Math.round((totalDaily / dailyCapCents) * 100));

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold">Costs</h2>
        <p className="text-text-muted mt-1">
          Per-agent and per-fleet cost telemetry
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-surface-1 p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-signal mb-2">
            Today
          </p>
          <p className="text-3xl font-display font-bold text-text-primary">
            ${(totalDaily / 100).toFixed(2)}
          </p>
          <p className="text-sm text-text-muted mt-1">Across all fleets</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-signal mb-2">
            This Month
          </p>
          <p className="text-3xl font-display font-bold text-text-primary">
            ${(totalMonthly / 100).toFixed(2)}
          </p>
          <p className="text-sm text-text-muted mt-1">Rolling 30 days</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-signal mb-2">
            Budget Used
          </p>
          <p className="text-3xl font-display font-bold text-text-primary">
            {budgetPercent}%
          </p>
          <p className="text-sm text-text-muted mt-1">Of daily cost cap</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface-1">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold">Cost by Fleet</h3>
        </div>
        <div className="p-4">
          {fleetCosts.length === 0 ? (
            <p className="text-text-muted text-sm">
              No cost data available. Costs are tracked per-agent when LLM API
              calls are metered.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-mono uppercase tracking-widest text-text-muted">
                  <th className="pb-4">Fleet</th>
                  <th className="pb-4">Daily</th>
                  <th className="pb-4">Monthly</th>
                </tr>
              </thead>
              <tbody>
                {fleetCosts.map((fc: any) => (
                  <tr key={fc.fleetId} className="border-t border-border hover:bg-surface-2 transition-colors">
                    <td className="py-3 font-mono text-signal">{fc.fleetName}</td>
                    <td className="py-3 font-mono">${(fc.dailyCents / 100).toFixed(2)}</td>
                    <td className="py-3 font-mono">${(fc.monthlyCents / 100).toFixed(2)}</td>
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
