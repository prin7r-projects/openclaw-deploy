import { Check } from 'lucide-react';

const TIERS = [
  {
    name: 'Solo',
    price: 'Free',
    cadence: 'forever',
    description: 'For the indie operator with three servers.',
    features: [
      '1 fleet · 5 agents · 2 hosts',
      'Full reconciler, manifest, multi-target',
      '7-day audit retention',
      'Community support (Discord)',
    ],
    cta: 'Install free',
    href: 'https://github.com/prin7r-projects/openclaw-deploy',
    highlighted: false,
  },
  {
    name: 'Team',
    price: '$199',
    cadence: '/ month / fleet',
    description: 'For the platform team running production fleets.',
    features: [
      '50 agents · 10 hosts',
      'Vault adapter · OAuth rotation · cost meter',
      'RBAC · 30-day audit retention',
      'Email support · 24h response',
    ],
    cta: 'Start Team trial',
    href: 'https://github.com/prin7r-projects/openclaw-deploy',
    highlighted: true,
  },
  {
    name: 'Org',
    price: '$899',
    cadence: '/ month flat',
    description: 'Multi-fleet companies that have outgrown per-fleet billing.',
    features: [
      'Unlimited fleets · 200 agents',
      'SAML SSO · audit log export',
      '90-day audit retention',
      'Slack support · priority bug triage',
    ],
    cta: 'Talk to us',
    href: 'mailto:kee22r@gmail.com?subject=OpenClaw%20Deploy%20Org%20tier',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual',
    description: 'Dedicated control plane. SOC-2-bound buyers. CSM included.',
    features: [
      'Dedicated single-tenant deploy',
      'SAML · custom integrations',
      'MSA + DPA signed',
      'Named CSM · architecture reviews',
    ],
    cta: 'Talk to us',
    href: 'mailto:kee22r@gmail.com?subject=OpenClaw%20Deploy%20Enterprise',
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
          // pricing
        </p>
        <h2 className="mb-3 font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
          Honest fences. No hidden tiers.
        </h2>
        <p className="text-[16px] leading-relaxed text-text-muted">
          Per-fleet pricing — never per-agent. Most teams find the Team tier
          is recovered by the first rotation incident they avoid.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => (
          <article
            key={tier.name}
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
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <a
              href={tier.href}
              className={`mt-auto block rounded border px-4 py-2 text-center font-mono text-[13px] transition-colors ${
                tier.highlighted
                  ? 'border-signal bg-signal/10 text-signal hover:bg-signal hover:text-surface-0'
                  : 'border-border bg-surface-2 text-text-primary hover:border-text-muted'
              }`}
            >
              {tier.cta}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
