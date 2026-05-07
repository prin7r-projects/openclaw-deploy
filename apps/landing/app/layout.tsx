import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OpenClaw Deploy — Declarative agent fleets. Reconciled.',
  description:
    'A control plane for OpenClaw, Hermes, and NanoClaw agent fleets across mixed Incus, Docker, and VPS targets. Manifest in, reconciled fleet out — with OAuth rotation that does not fail at 3 AM.',
  metadataBase: new URL('https://openclaw-deploy.prin7r.com'),
  openGraph: {
    title: 'OpenClaw Deploy — Declarative agent fleets. Reconciled.',
    description:
      'Manifest in, reconciled fleet out. Multi-target (Incus / Docker / VPS), OAuth rotation, per-agent cost meter.',
    url: 'https://openclaw-deploy.prin7r.com',
    siteName: 'OpenClaw Deploy',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenClaw Deploy',
    description: 'Declarative agent fleets. Reconciled.',
  },
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-sans bg-surface-0 text-text-primary">{children}</body>
    </html>
  );
}
