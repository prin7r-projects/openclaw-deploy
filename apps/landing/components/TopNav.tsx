import Link from 'next/link';
import { Logo } from './Logo';

const NAV = [
  { href: '#features', label: 'features' },
  { href: '#manifest', label: 'manifest' },
  { href: '#pricing', label: 'pricing' },
  { href: '#faq', label: 'faq' },
];

const REPO = 'https://github.com/prin7r-projects/openclaw-deploy';

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface-0/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="h-7 w-7" />
          <span className="font-mono text-[13px] tracking-tight text-text-primary">
            <span className="text-signal">[</span>
            openclaw-deploy
            <span className="text-signal">]</span>
          </span>
        </Link>

        <ul className="ml-4 hidden items-center gap-5 md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="font-mono text-[13px] text-text-muted transition-colors hover:text-text-primary"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <a
            href={REPO}
            className="hidden font-mono text-[13px] text-text-muted transition-colors hover:text-signal sm:inline"
          >
            github
          </a>
          <a
            href={REPO}
            className="rounded border border-border bg-surface-1 px-3.5 py-1.5 font-mono text-[12px] text-text-primary transition-all hover:border-signal hover:text-signal"
          >
            <span className="text-signal">$</span> install
          </a>
        </div>
      </nav>
    </header>
  );
}
