'use client';

import { useState } from 'react';
import { ArrowRight, Check, Mail } from 'lucide-react';
import { cn } from '@/lib/cn';

// [LEAD_FORM] /apps/landing/app/app/LeadForm.tsx
// Safe lead/intent capture for the /app console. Posts to
// /api/orders/contact on the same server and opens a mailto: with a
// pre-filled order request. No card, no Stripe, no PII beyond the email
// the operator types. State is local; nothing is persisted server-side.

type Intent = 'self-hosted-help' | 'cloud-team' | 'cloud-org' | 'cloud-enterprise' | 'enterprise-arch';

const INTENT_LABELS: Record<Intent, string> = {
  'self-hosted-help': 'Self-hosted — I need a hand with the install',
  'cloud-team': 'Cloud · Team — $199 / mo',
  'cloud-org': 'Cloud · Org — $899 / mo',
  'cloud-enterprise': 'Cloud · Enterprise — from $2,400 / mo',
  'enterprise-arch': 'Enterprise architecture review / MSA',
};

const ORDER_CONTACT = 'kee22r@gmail.com';

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; mailto: string; orderId: string }
  | { kind: 'error'; message: string };

export function LeadForm() {
  const [email, setEmail] = useState('');
  const [intent, setIntent] = useState<Intent>('self-hosted-help');
  const [note, setNote] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === 'loading') return;

    if (!email || !email.includes('@')) {
      setState({
        kind: 'error',
        message: 'Enter a valid email so we can reply with the install steps.',
      });
      return;
    }

    setState({ kind: 'loading' });
    try {
      const res = await fetch('/api/orders/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          plan: intent.startsWith('cloud-') ? intent : 'cloud-team',
          source: 'app-console',
          email,
          note: note.slice(0, 400),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        mailto_url?: string;
        order_id?: string;
        error?: string;
        message?: string;
      };
      if (
        res.ok &&
        data.ok &&
        data.mailto_url &&
        typeof data.order_id === 'string'
      ) {
        setState({
          kind: 'ready',
          mailto: data.mailto_url,
          orderId: data.order_id,
        });
        // Open the mail client immediately so the operator does not lose
        // the request. The mailto: URL contains a pre-filled subject and
        // body; the operator just hits send.
        if (typeof window !== 'undefined') {
          window.location.href = data.mailto_url;
        }
        return;
      }
      setState({
        kind: 'error',
        message:
          data.message ?? data.error ?? `Order capture unavailable (HTTP ${res.status}).`,
      });
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Network error.',
      });
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-border bg-surface-1 p-6"
    >
      <div className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text-muted">
        <Mail aria-hidden className="h-3.5 w-3.5 text-signal" />
        safe intent · no card · mailto
      </div>

      <label className="mb-4 block">
        <span className="mb-1.5 block font-mono text-[12px] uppercase tracking-widest text-text-muted">
          your email
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.dev"
          className="w-full rounded border border-border bg-surface-2 px-3 py-2.5 font-mono text-[14px] text-text-primary placeholder:text-text-muted/60 focus:border-signal focus:outline-none"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1.5 block font-mono text-[12px] uppercase tracking-widest text-text-muted">
          intent
        </span>
        <select
          value={intent}
          onChange={(e) => setIntent(e.target.value as Intent)}
          className="w-full rounded border border-border bg-surface-2 px-3 py-2.5 font-mono text-[14px] text-text-primary focus:border-signal focus:outline-none"
        >
          {(Object.keys(INTENT_LABELS) as Intent[]).map((k) => (
            <option key={k} value={k}>
              {INTENT_LABELS[k]}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-5 block">
        <span className="mb-1.5 block font-mono text-[12px] uppercase tracking-widest text-text-muted">
          short note (optional, max 400 chars)
        </span>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 400))}
          placeholder="e.g. 8 NanoClaws on Incus, OAuth rotation needed before EOM."
          className="w-full rounded border border-border bg-surface-2 px-3 py-2.5 font-mono text-[13px] text-text-primary placeholder:text-text-muted/60 focus:border-signal focus:outline-none"
        />
        <span className="mt-1 block text-right font-mono text-[11px] text-text-muted">
          {note.length} / 400
        </span>
      </label>

      <button
        type="submit"
        disabled={state.kind === 'loading'}
        className={cn(
          'group inline-flex w-full items-center justify-center gap-2 rounded border px-4 py-2.5 font-mono text-[13px] transition-colors disabled:opacity-60',
          'border-signal bg-signal/10 text-signal hover:bg-signal hover:text-surface-0',
        )}
      >
        {state.kind === 'loading' ? (
          <span>opening mail client…</span>
        ) : (
          <>
            <span>open mail client with pre-filled order</span>
            <ArrowRight
              aria-hidden
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </>
        )}
      </button>

      {state.kind === 'ready' && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded border border-signal/30 bg-signal/5 p-3 font-mono text-[12px] text-text-primary"
        >
          <Check
            aria-hidden
            className="mt-0.5 h-4 w-4 shrink-0 text-signal"
          />
          <div>
            <p>
              Order request ready. We opened your mail client with the
              subject and body pre-filled.
            </p>
            <p className="mt-1 text-text-muted">
              order id: <span className="text-text-primary">{state.orderId}</span>
              {' · '}
              contact:{' '}
              <a
                href={state.mailto}
                className="text-signal hover:underline"
              >
                {ORDER_CONTACT}
              </a>
            </p>
            <p className="mt-1 text-text-muted">
              If your mail client did not open, click{' '}
              <a
                href={state.mailto}
                className="text-signal hover:underline"
              >
                this mailto link
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {state.kind === 'error' && (
        <p
          role="status"
          className="mt-4 font-mono text-[12px] leading-snug text-alert"
        >
          {state.message}
        </p>
      )}

      <p className="mt-5 font-mono text-[11px] leading-snug text-text-muted">
        This form posts to{' '}
        <code className="text-text-primary">/api/orders/contact</code> on
        this server, which returns a{' '}
        <code className="text-text-primary">mailto:</code> URL — your mail
        client opens with the order request pre-filled. No card. No Stripe.
        No PayPal. No telemetry.
      </p>
    </form>
  );
}
