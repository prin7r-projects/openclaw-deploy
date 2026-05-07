'use client';

import { Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

// [NOWPAYMENTS_INTEGRATION] /apps/landing/components/Pricing.tsx
// Self-hosted (install.sh) stays free. Cloud tiers route to NOWPayments.

type Tier = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
} & ({ kind: 'self-hosted'; href: string } | { kind: 'cloud'; plan: 'cloud-team' | 'cloud-org' | 'cloud-enterprise' });

const TIERS: Tier[] = [
  {
    id: 'self-hosted',
    kind: 'self-hosted',
    name: 'Self-hosted',
    price: 'Free',
    cadence: 'forever',
    description:
      'Run the control plane on your own servers. MIT-licensed, no quotas, no telemetry.',
    features: [
      'Unlimited fleets · agents · hosts',
      'Full reconciler, manifest, multi-target',
      'Local audit log on your disk',
      'Community support (Discord)',
    ],
    cta: 'curl install.sh',
    href: 'https://openclaw-deploy.prin7r.com/install.sh',
    highlighted: false,
  },
  {
    id: 'cloud-team',
    kind: 'cloud',
    plan: 'cloud-team',
    name: 'Cloud · Team',
    price: '$199',
    cadence: '/ month / fleet',
    description:
      'We host the control plane. You get a managed reconciler with vault, OAuth rotation, and the cost meter wired in.',
    features: [
      '50 agents · 10 hosts',
      'Vault adapter · OAuth rotation · cost meter',
      'RBAC · 30-day audit retention',
      'Email support · 24h response',
    ],
    cta: 'Pay with crypto',
    highlighted: true,
  },
  {
    id: 'cloud-org',
    kind: 'cloud',
    plan: 'cloud-org',
    name: 'Cloud · Org',
    price: '$899',
    cadence: '/ month flat',
    description:
      'Multi-fleet companies that have outgrown per-fleet billing. SAML, audit export, longer retention.',
    features: [
      'Unlimited fleets · 200 agents',
      'SAML SSO · audit log export',
      '90-day audit retention',
      'Slack support · priority bug triage',
    ],
    cta: 'Pay with crypto',
    highlighted: false,
  },
  {
    id: 'cloud-enterprise',
    kind: 'cloud',
    plan: 'cloud-enterprise',
    name: 'Cloud · Enterprise',
    price: 'From $2,400',
    cadence: '/ month',
    description:
      'Dedicated single-tenant control plane. Named CSM. SOC-2-bound buyers welcome.',
    features: [
      'Dedicated single-tenant deploy',
      'SAML · custom integrations · MSA + DPA',
      'Named CSM · architecture reviews',
      'Annual contract · invoiced billing on request',
    ],
    cta: 'Pay deposit',
    highlighted: false,
  },
];

type TierState = {
  loading: boolean;
  error: string | null;
};

export function Pricing() {
  const [stateById, setStateById] = useState<Record<string, TierState>>({});

  async function startCloudCheckout(tier: Tier & { kind: 'cloud' }) {
    setStateById((s) => ({ ...s, [tier.id]: { loading: true, error: null } }));
    try {
      const res = await fetch('/api/checkout/nowpayments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: tier.plan }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        invoice_url?: string;
        message?: string;
        error?: string;
      };
      if (res.ok && data.ok && data.invoice_url) {
        window.location.href = data.invoice_url;
        return;
      }
      const msg =
        data.message ??
        data.error ??
        `Checkout unavailable (HTTP ${res.status}).`;
      setStateById((s) => ({ ...s, [tier.id]: { loading: false, error: msg } }));
    } catch (err) {
      setStateById((s) => ({
        ...s,
        [tier.id]: {
          loading: false,
          error: err instanceof Error ? err.message : 'Network error.',
        },
      }));
    }
  }

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
          // pricing
        </p>
        <h2 className="mb-3 font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
          Self-hosted is free. Cloud is per-fleet.
        </h2>
        <p className="text-[16px] leading-relaxed text-text-muted">
          Run the open-source control plane yourself for nothing — or pay us in
          USDT/USDC to host it. Cloud plans bill in 1-month increments via
          NOWPayments. No credit card. No marketing-team upsell.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const tState = stateById[tier.id] ?? {
            loading: false,
            error: null,
          };

          return (
            <article
              key={tier.id}
              className={`flex flex-col rounded-xl border bg-surface-1 p-6 ${
                tier.highlighted
                  ? 'border-signal/50 ring-1 ring-signal/20'
                  : 'border-border'
              }`}
            >
              <header className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-600 text-text-primary">
                    {tier.name}
                  </h3>
                  {tier.highlighted && (
                    <span className="rounded border border-signal/40 bg-signal/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-signal">
                      most chosen
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-700 text-text-primary">
                    {tier.price}
                  </span>
                  <span className="font-mono text-[12px] text-text-muted">
                    {tier.cadence}
                  </span>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-text-muted">
                  {tier.description}
                </p>
              </header>

              <ul className="mb-6 flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[13.5px] text-text-primary"
                  >
                    <Check
                      aria-hidden
                      className="mt-0.5 h-4 w-4 shrink-0 text-signal"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {tier.kind === 'self-hosted' ? (
                <a
                  href={tier.href}
                  className={`mt-auto block rounded border px-4 py-2 text-center font-mono text-[13px] transition-colors border-border bg-surface-2 text-text-primary hover:border-text-muted`}
                >
                  <span className="text-signal">$</span> {tier.cta}
                </a>
              ) : (
                <div className="mt-auto">
                  <button
                    type="button"
                    onClick={() => startCloudCheckout(tier)}
                    disabled={tState.loading}
                    aria-label={`${tier.cta} — ${tier.name}`}
                    className={`group flex w-full items-center justify-center gap-2 rounded border px-4 py-2 text-center font-mono text-[13px] transition-colors disabled:opacity-60 ${
                      tier.highlighted
                        ? 'border-signal bg-signal/10 text-signal hover:bg-signal hover:text-surface-0'
                        : 'border-border bg-surface-2 text-text-primary hover:border-signal hover:text-signal'
                    }`}
                  >
                    {tState.loading ? (
                      <span>opening invoice…</span>
                    ) : (
                      <>
                        <span>{tier.cta}</span>
                        <ExternalLink
                          aria-hidden
                          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        />
                      </>
                    )}
                  </button>
                  {tState.error && (
                    <p
                      role="status"
                      className="mt-2 font-mono text-[11px] leading-snug text-alert"
                    >
                      {tState.error}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-[11px] leading-snug text-text-muted">
                    USDT · USDC · BTC · ETH via NOWPayments
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
