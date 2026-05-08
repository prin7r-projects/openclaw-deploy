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

function SecretStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-signal/20 text-signal',
    rotating: 'bg-warn/20 text-warn',
    revoked: 'bg-alert/20 text-alert',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-mono ${styles[status] ?? 'bg-surface-2 text-text-muted'}`}>
      {status}
    </span>
  );
}

export default async function SecretsPage() {
  const [secretsData, expiringData] = await Promise.all([
    apiFetch('/api/v1/secrets'),
    apiFetch('/api/v1/secrets/expiring?hours=24'),
  ]);

  const secrets = secretsData?.secrets ?? [];
  const expiring = expiringData?.expiring ?? [];
  const activeSecrets = secrets.filter((s: any) => s.status === 'active');

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold">Secrets</h2>
        <p className="text-text-muted mt-1">
          OAuth tokens and API key rotation status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-surface-1 p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-signal mb-2">
            Active Secrets
          </p>
          <p className="text-3xl font-display font-bold text-text-primary">
            {activeSecrets.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-warn mb-2">
            Expiring Soon
          </p>
          <p className="text-3xl font-display font-bold text-text-primary">
            {expiring.length}
          </p>
          <p className="text-sm text-text-muted mt-1">Within 24 hours</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface-1">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold">Secret Inventory</h3>
        </div>
        <div className="p-4">
          {secrets.length === 0 ? (
            <p className="py-8 text-center text-text-muted">
              No secrets stored. Secrets are created when agents are
              provisioned with OAuth or API key references.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-mono uppercase tracking-widest text-text-muted">
                  <th className="pb-4">Agent</th>
                  <th className="pb-4">Key</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Expires</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {secrets.map((secret: any) => (
                  <tr key={secret.id} className="border-t border-border hover:bg-surface-2 transition-colors">
                    <td className="py-3 font-mono text-xs truncate max-w-[120px]">{secret.agentId}</td>
                    <td className="py-3 font-mono text-signal">{secret.keyName}</td>
                    <td className="py-3">
                      <SecretStatusBadge status={secret.status} />
                    </td>
                    <td className="py-3 text-sm text-text-muted">
                      {secret.expiresAt ? new Date(secret.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3">
                      {secret.status === 'active' && (
                        <button className="text-xs font-mono text-warn hover:text-warn/80 transition-colors">
                          Rotate
                        </button>
                      )}
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
