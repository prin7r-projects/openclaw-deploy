import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border-subtle bg-surface-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="font-mono text-[13px] text-text-primary">
              <span className="text-signal">[</span>
              openclaw-deploy
              <span className="text-signal">]</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-text-muted">
            Declarative agent fleets. Reconciled. Built and dogfooded by the
            Prin7r infrastructure team.
          </p>
        </div>

        <FooterCol
          title="product"
          links={[
            { label: 'features', href: '#features' },
            { label: 'manifest', href: '#manifest' },
            { label: 'pricing', href: '#pricing' },
            { label: 'faq', href: '#faq' },
          ]}
        />
        <FooterCol
          title="resources"
          links={[
            {
              label: 'github',
              href: 'https://github.com/prin7r-projects/openclaw-deploy',
            },
            {
              label: 'docs',
              href: 'https://github.com/prin7r-projects/openclaw-deploy/tree/main/docs',
            },
            {
              label: 'pitch deck',
              href: 'https://github.com/prin7r-projects/openclaw-deploy/blob/main/docs/pitch-deck.html',
            },
            {
              label: 'license · MIT',
              href: 'https://github.com/prin7r-projects/openclaw-deploy/blob/main/LICENSE',
            },
          ]}
        />
        <FooterCol
          title="contact"
          links={[
            { label: 'kee22r@gmail.com', href: 'mailto:kee22r@gmail.com' },
            { label: 'security disclosures', href: 'mailto:kee22r@gmail.com?subject=Security' },
          ]}
        />
      </div>
      <div className="border-t border-border-subtle">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-2 px-6 py-5 font-mono text-[11.5px] uppercase tracking-widest text-text-muted md:flex-row md:items-center md:justify-between">
          <span>© 2026 Prin7r · openclaw-deploy v1.0</span>
          <span className="inline-flex items-center gap-2">
            <span className="dot dot-signal" />
            fleet healthy · last reconcile 2.4s ago
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-text-muted">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="font-mono text-[13px] text-text-primary transition-colors hover:text-signal"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
