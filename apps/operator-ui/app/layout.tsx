import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '600'],
});

export const metadata: Metadata = {
  title: 'OpenClaw Deploy — Operator',
  description: 'Declarative agent fleets. Reconciled.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <div className="flex min-h-screen">
          <aside className="w-64 border-r border-border bg-surface-1 p-4">
            <div className="mb-8">
              <h1 className="font-display text-xl font-bold text-signal">
                [ OpenClaw ]
              </h1>
              <p className="text-xs text-text-muted mt-1">Deploy · Operator</p>
            </div>
            <nav className="space-y-2">
              <a
                href="/"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface-2 hover:text-signal transition-colors"
              >
                <span className="font-mono text-xs text-signal">//</span>
                Dashboard
              </a>
              <a
                href="/fleets"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface-2 hover:text-signal transition-colors"
              >
                <span className="font-mono text-xs text-signal">//</span>
                Fleets
              </a>
              <a
                href="/audit"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface-2 hover:text-signal transition-colors"
              >
                <span className="font-mono text-xs text-signal">//</span>
                Audit Log
              </a>
              <a
                href="/costs"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface-2 hover:text-signal transition-colors"
              >
                <span className="font-mono text-xs text-signal">//</span>
                Costs
              </a>
              <a
                href="/secrets"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface-2 hover:text-signal transition-colors"
              >
                <span className="font-mono text-xs text-signal">//</span>
                Secrets
              </a>
            </nav>
          </aside>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
