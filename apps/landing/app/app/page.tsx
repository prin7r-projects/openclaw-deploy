import {
  Terminal,
  FileCheck2,
  GitMerge,
  KeyRound,
  Network,
  ArrowRight,
  BookOpenText,
  Github,
  Check,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { LeadForm } from './LeadForm';
import { Checklist } from './Checklist';
import { ManifestCard } from './ManifestCard';

// [APP_CONSOLE] /apps/landing/app/app/page.tsx
// Cold Iron deployment console / onboarding. Loads at
//   https://openclaw-deploy.prin7r.com/app
//
// This surface is the post-pitch "give me the package" page for operators
// who already know what they want. It intentionally does NOT duplicate the
// marketing landing — instead it shows:
//   1. The deploy package (curl install.sh, the .tar.gz, the docker image).
//   2. The fleet.yaml config (the canonical reference for the manifest).
//   3. The preflight checklist (what to verify before declaring healthy).
//   4. A safe lead/intent form (mailto, no card, no PII, no SaaS).
//
// Cloud payments stay on the marketing landing at /#pricing so the
// /app surface remains 100% non-payment and safe to surface in any docs,
// embeds, or operator runbooks.

const DEPLOY_PACKAGE = {
  installer: 'curl -fsSL https://openclaw-deploy.prin7r.com/install.sh | bash',
  tarball:
    'curl -fsSL https://openclaw-deploy.prin7r.com/patches/PRI-5506/cold-iron-deploy-package.tar.gz -o cold-iron-deploy-package.tar.gz',
  image: 'ghcr.io/prin7r-projects/openclaw-deploy:landing-stable',
  repo: 'https://github.com/prin7r-projects/openclaw-deploy',
  patch: 'patches/PRI-5506/ (docker-only)',
  license: 'MIT · no telemetry · no card on file',
};

const PACKAGE_ROWS = [
  {
    label: 'installer',
    value: DEPLOY_PACKAGE.installer,
    href: 'https://openclaw-deploy.prin7r.com/install.sh',
  },
  {
    label: 'deploy package (tar.gz)',
    value: DEPLOY_PACKAGE.tarball,
    href: 'patches/PRI-5506/cold-iron-deploy-package.tar.gz',
  },
  {
    label: 'docker image',
    value: DEPLOY_PACKAGE.image,
    href: 'https://github.com/prin7r-projects/openclaw-deploy/pkgs/container/openclaw-deploy',
  },
  {
    label: 'source',
    value: DEPLOY_PACKAGE.repo,
    href: DEPLOY_PACKAGE.repo,
  },
];

const CHECKLIST_ITEMS = [
  {
    title: 'docker + compose',
    body: 'Confirm `docker --version` returns >= 24 and `docker compose version` returns >= 2.20. Cold Iron runs on stock Docker, no custom kernel required.',
    ok: true,
  },
  {
    title: 'vault path resolves',
    body: 'Pick a vault adapter (`VAULT_BACKEND=file` for local, or `VAULT_ADDR` for Hashicorp Vault / OpenBao). Test the ref: `vault kv get oauth/claude_main` must return without 403.',
    ok: true,
  },
  {
    title: 'fleet.yaml schema-validates',
    body: 'Run `occ apply -f fleet.yaml --dry-run`. Any field typo is rejected at the API layer with a line-numbered error — never reaches the reconciler.',
    ok: true,
  },
  {
    title: 'oauth rotation rehearsed',
    body: 'Run `occ rotate --rehearsal`. The reconciler walks agents in dependency order, drains in-flight tasks, swaps the credential, and confirms. 19 agents in 47s, zero 401s in our last run.',
    ok: true,
  },
  {
    title: 'cost meter visible',
    body: 'Open the operator UI at `/operator` (gated by `OPERATOR_API_TOKEN`). You should see 26 agents · 3 hosts · $11.21/day within 30s of first reconcile.',
    ok: true,
  },
  {
    title: 'no card on file',
    body: 'Self-hosted stays free. Cloud tiers route to NOWPayments at `/#pricing` and never store a card. If you do not want crypto checkout, the order falls through to a `mailto:` with a pre-filled order request.',
    ok: true,
  },
];

const API_ENDPOINTS = [
  { method: 'GET', path: '/healthz', body: 'control plane liveness' },
  { method: 'GET', path: '/api/v1/fleets', body: 'list fleets (auth: bearer)' },
  {
    method: 'POST',
    path: '/api/v1/fleets/:id/apply',
    body: 'apply a manifest (auth: bearer)',
  },
  {
    method: 'GET',
    path: '/api/v1/events',
    body: 'server-sent reconcile events (auth: bearer)',
  },
  {
    method: 'POST',
    path: '/api/orders/contact',
    body: 'safe lead/intent capture (no card)',
  },
];

const SAFE_INTENT_NOTES = [
  'No card on file. No Stripe. No PayPal.',
  'No PII is sent from this form — only your email and a short message.',
  'Mail falls to the operator mailbox (kee22r@gmail.com) with a pre-populated subject and a stable `ocd-app-lead-...` id.',
  'If you want crypto checkout for Cloud, hit /#pricing on the marketing landing — that path uses NOWPayments (HMAC-SHA512 IPN verified).',
];

export default function AppConsolePage() {
  return (
    <>
      <section className="relative mx-auto max-w-6xl px-6 pb-12 pt-12 md:pb-16 md:pt-20">
        <div className="flex flex-col items-start gap-7">
          <span className="inline-flex items-center gap-2 rounded border border-border bg-surface-1 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-text-muted">
            <span className="dot dot-signal" />
            // app console · cold iron
          </span>
          <h1 className="max-w-4xl text-balance font-display text-4xl font-700 leading-[1.05] tracking-tight text-text-primary md:text-6xl">
            The deploy package.
            <br />
            <span className="text-signal">The manifest.</span> The checklist.
          </h1>
          <p className="max-w-2xl text-balance text-lg leading-relaxed text-text-muted md:text-xl">
            This is the post-pitch surface. No marketing copy, no gradient,
            no upsell. Pick your install method, drop in your{' '}
            <code className="font-mono text-text-primary">fleet.yaml</code>,
            walk the preflight checklist, and reconcile.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={DEPLOY_PACKAGE.repo}
              className="group inline-flex items-center gap-2 rounded border border-signal bg-signal/10 px-5 py-2.5 font-mono text-sm text-signal transition-all hover:bg-signal hover:text-surface-0"
            >
              <Github aria-hidden className="h-4 w-4" />
              View on GitHub
              <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="https://github.com/prin7r-projects/openclaw-deploy/tree/main/docs"
              className="inline-flex items-center gap-2 rounded border border-border bg-surface-1 px-5 py-2.5 font-mono text-sm text-text-primary transition-all hover:border-text-muted"
            >
              <BookOpenText aria-hidden className="h-4 w-4" />
              Read the docs
            </a>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 font-mono text-[12px] text-text-muted">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-signal" />
              {DEPLOY_PACKAGE.license}
            </span>
          </div>
        </div>
      </section>

      <section
        id="package"
        className="relative mx-auto max-w-6xl px-6 py-12 md:py-16"
      >
        <div className="mb-8">
          <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
            // 01 · deploy package
          </p>
          <h2 className="mb-3 font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
            Pick one. Run it. Read the output.
          </h2>
          <p className="max-w-2xl text-[16px] leading-relaxed text-text-muted">
            Three install methods, all producing the same control plane. The
            curl installer is the canonical path; the tarball and the docker
            image are for air-gapped hosts and pinned-tag deploys.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {PACKAGE_ROWS.map((row) => (
            <a
              key={row.label}
              href={row.href}
              className="group flex flex-col gap-2 rounded-xl border border-border bg-surface-1 p-5 transition-colors hover:border-signal"
            >
              <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
                {row.label}
              </span>
              <code className="break-all font-mono text-[13px] text-text-primary">
                {row.value}
              </code>
              <span className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-signal opacity-0 transition-opacity group-hover:opacity-100">
                open
                <ArrowRight aria-hidden className="h-3 w-3" />
              </span>
            </a>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border-subtle bg-surface-1/60 p-5 font-mono text-[12.5px] leading-relaxed text-text-muted">
          <span className="text-text-primary"># patch package (Docker-only):</span>{' '}
          <code className="text-text-primary">
            {DEPLOY_PACKAGE.patch}
          </code>{' '}
          contains a signed-off Traefik-routing overlay, a Traefik middleware
          strip for security headers (HSTS / CSP / X-Frame-Options), and a
          compose snippet that mounts{' '}
          <code className="text-text-primary">app.openclaw-deploy.prin7r.com</code>{' '}
          to this{' '}
          <code className="text-text-primary">/app</code> route. Apply with{' '}
          <code className="text-text-primary">
            tar -xzf cold-iron-deploy-package.tar.gz -C /opt/prin7r-deploys/openclaw-deploy
          </code>
          ; the package does not run any OpenClaw gateway (Plane A is gated by{' '}
          <a
            href="https://github.com/prin7r-projects/openclaw-deploy/blob/main/docs/14-audit-cold-iron-t01.md"
            className="text-signal hover:underline"
          >
            docs/14-audit-cold-iron-t01.md
          </a>
          ).
        </div>
      </section>

      <section
        id="config"
        className="relative mx-auto max-w-6xl px-6 py-12 md:py-16"
      >
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <div>
            <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
              // 02 · config reference
            </p>
            <h2 className="mb-4 font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
              14 lines. The entire surface.
            </h2>
            <p className="mb-7 max-w-xl text-[16px] leading-relaxed text-text-muted">
              The canonical <code className="font-mono text-text-primary">fleet.yaml</code>.
              Schema-validated, diff-then-apply, never auto-merged. Run{' '}
              <code className="font-mono text-text-primary">
                occ apply -f fleet.yaml --dry-run
              </code>{' '}
              to see exactly what the reconciler will change.
            </p>

            <ul className="space-y-4 text-[15px]">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface-1">
                  <FileCheck2 aria-hidden className="h-3.5 w-3.5 text-signal" />
                </span>
                <span className="text-text-muted">
                  <span className="text-text-primary">
                    Schema-validated at the API.
                  </span>{' '}
                  Typos return a line-numbered error, never reach the
                  reconciler.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface-1">
                  <GitMerge aria-hidden className="h-3.5 w-3.5 text-signal" />
                </span>
                <span className="text-text-muted">
                  <span className="text-text-primary">Diff-then-apply.</span>{' '}
                  The reconciler shows the diff, drains in-flight tasks, and
                  asks for confirmation before any state change.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface-1">
                  <KeyRound aria-hidden className="h-3.5 w-3.5 text-signal" />
                </span>
                <span className="text-text-muted">
                  <span className="text-text-primary">
                    Vault refs, never inline secrets.
                  </span>{' '}
                  OAuth tokens resolve through{' '}
                  <code className="font-mono text-text-primary">
                    ref(vault://oauth/...)
                  </code>
                  ; the manifest never contains a literal credential.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface-1">
                  <Network aria-hidden className="h-3.5 w-3.5 text-signal" />
                </span>
                <span className="text-text-muted">
                  <span className="text-text-primary">
                    Multi-target, one manifest.
                  </span>{' '}
                  Incus, Docker, and VPS targets coexist; the reconciler
                  routes per agent.
                </span>
              </li>
            </ul>
          </div>
          <div>
            <ManifestCard />
          </div>
        </div>
      </section>

      <section
        id="checklist"
        className="relative mx-auto max-w-6xl px-6 py-12 md:py-16"
      >
        <div className="mb-8">
          <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
            // 03 · preflight checklist
          </p>
          <h2 className="mb-3 font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
            What to verify before declaring healthy.
          </h2>
          <p className="max-w-2xl text-[16px] leading-relaxed text-text-muted">
            The six checks we run on every Cold Iron reference fleet. If any
            of these fail, the reconciler will not mark the fleet{' '}
            <code className="font-mono text-text-primary">healthy</code>.
          </p>
        </div>
        <Checklist items={CHECKLIST_ITEMS} />
      </section>

      <section
        id="api"
        className="relative mx-auto max-w-6xl px-6 py-12 md:py-16"
      >
        <div className="mb-6">
          <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
            // 04 · api surface
          </p>
          <h2 className="mb-3 font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
            The control plane is an HTTP API.
          </h2>
          <p className="max-w-2xl text-[16px] leading-relaxed text-text-muted">
            Bearer-token auth, server-sent events for the live reconcile
            feed. Curl-able. Open the operator UI to see the same data as a
            dashboard.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-surface-1">
          <table className="w-full font-mono text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[11px] uppercase tracking-widest text-text-muted">
                <th className="px-5 py-3 font-500">method</th>
                <th className="py-3 font-500">path</th>
                <th className="py-3 pr-5 font-500">notes</th>
              </tr>
            </thead>
            <tbody>
              {API_ENDPOINTS.map((row) => (
                <tr
                  key={`${row.method}-${row.path}`}
                  className="border-t border-border-subtle"
                >
                  <td className="px-5 py-2.5 text-text-primary">
                    {row.method}
                  </td>
                  <td className="py-2.5 text-text-primary">
                    <code>{row.path}</code>
                  </td>
                  <td className="py-2.5 pr-5 text-text-muted">{row.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="intent"
        className="relative mx-auto max-w-6xl px-6 py-12 md:py-16"
      >
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
              // 05 · safe lead / payment intent
            </p>
            <h2 className="mb-4 font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
              Need a hand? Leave a safe intent.
            </h2>
            <p className="mb-6 max-w-xl text-[16px] leading-relaxed text-text-muted">
              This form is a mailto with a pre-filled subject and a stable
              lead id. No card, no Stripe, no SaaS. The form posts to{' '}
              <code className="font-mono text-text-primary">
                /api/orders/contact
              </code>{' '}
              on this server, which returns a{' '}
              <code className="font-mono text-text-primary">mailto:</code>{' '}
              URL — your mail client opens with the order request already
              filled in. Crypto checkout lives at{' '}
              <Link
                href="/#pricing"
                className="text-signal hover:underline"
              >
                /#pricing
              </Link>{' '}
              and uses NOWPayments with HMAC-SHA512 IPN verification.
            </p>
            <ul className="space-y-3 text-[14px] text-text-muted">
              {SAFE_INTENT_NOTES.map((note) => (
                <li key={note} className="flex items-start gap-2.5">
                  <Check
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-signal"
                  />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 inline-flex items-center gap-2 rounded border border-border bg-surface-1 px-3 py-2 font-mono text-[12px] text-text-muted">
              <Terminal aria-hidden className="h-3.5 w-3.5 text-signal" />
              POST /api/orders/contact → 200{' '}
              <span className="text-text-primary">{`{ ok, mailto_url }`}</span>
            </div>
          </div>
          <div>
            <LeadForm />
          </div>
        </div>
      </section>
    </>
  );
}
