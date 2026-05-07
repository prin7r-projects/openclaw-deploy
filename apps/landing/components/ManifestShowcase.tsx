import { Terminal, FileCheck2, GitMerge } from 'lucide-react';

export function ManifestShowcase() {
  return (
    <section id="manifest" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
            // 14 lines · the entire surface
          </p>
          <h2 className="mb-4 font-display text-3xl font-600 leading-tight tracking-tight text-text-primary md:text-4xl">
            That&apos;s it. That&apos;s the API.
          </h2>
          <p className="mb-7 max-w-xl text-[16px] leading-relaxed text-text-muted">
            Five NanoClaws on the Incus host. Two Hermes bridges on the Docker
            host. Tokens referenced from your vault, never inlined. Apply
            once, reconciled forever.
          </p>

          <ul className="space-y-4 text-[15px]">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface-1">
                <FileCheck2 className="h-3.5 w-3.5 text-signal" />
              </span>
              <span className="text-text-muted">
                <span className="text-text-primary">Schema-validated.</span>{' '}
                Manifest typos are rejected at the API layer — never reach the
                reconciler.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface-1">
                <GitMerge className="h-3.5 w-3.5 text-signal" />
              </span>
              <span className="text-text-muted">
                <span className="text-text-primary">Diff-then-apply.</span>{' '}
                <code className="font-mono text-[13px] text-text-primary">
                  occ apply --dry-run
                </code>{' '}
                shows exactly what will change.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface-1">
                <Terminal className="h-3.5 w-3.5 text-signal" />
              </span>
              <span className="text-text-muted">
                <span className="text-text-primary">CLI-first.</span> The
                dashboard is an observation surface — every action also lives
                in the <code className="font-mono text-[13px] text-text-primary">occ</code> binary.
              </span>
            </li>
          </ul>
        </div>

        <div className="order-1 lg:order-2">
          <ManifestCard />
        </div>
      </div>
    </section>
  );
}

function ManifestCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-1 shadow-[0_24px_60px_-30px_rgba(124,255,161,0.18)]">
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface-2/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-alert/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-signal/60" />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
          fleet.yaml
        </span>
        <span className="font-mono text-[11px] text-text-muted">14 lines</span>
      </div>
      <pre className="overflow-x-auto px-5 py-5 font-mono text-[13.5px] leading-[1.7] text-text-primary">
        <code>
          <Line n={1}>
            <span className="tok-comment"># fleet.yaml — illustrative</span>
          </Line>
          <Line n={2}>
            <span className="tok-key">apiVersion:</span>{' '}
            <span className="tok-val">openclaw.deploy/v1</span>
          </Line>
          <Line n={3}>
            <span className="tok-key">fleet:</span>{' '}
            <span className="tok-val">prin7r-prod</span>
          </Line>
          <Line n={4}>
            <span className="tok-key">agents:</span>
          </Line>
          <Line n={5}>
            {'  - '}
            <span className="tok-key">name:</span>{' '}
            <span className="tok-val">nanoclaw-pool</span>
          </Line>
          <Line n={6}>
            {'    '}
            <span className="tok-key">type:</span>{' '}
            <span className="tok-val">NanoClaw</span>
          </Line>
          <Line n={7}>
            {'    '}
            <span className="tok-key">image:</span>{' '}
            <span className="tok-val">ghcr.io/openclaw/nanoclaw:1.4.2</span>
          </Line>
          <Line n={8}>
            {'    '}
            <span className="tok-key">target:</span>{' '}
            <span className="tok-val">incus://dev2</span>
          </Line>
          <Line n={9}>
            {'    '}
            <span className="tok-key">replicas:</span>{' '}
            <span className="tok-num">5</span>
          </Line>
          <Line n={10}>
            {'    '}
            <span className="tok-key">auth:</span>
          </Line>
          <Line n={11}>
            {'      '}
            <span className="tok-key">claude_oauth:</span>{' '}
            <span className="tok-ref">ref(vault://oauth/claude_main)</span>
          </Line>
          <Line n={12}>
            {'  - '}
            <span className="tok-key">name:</span>{' '}
            <span className="tok-val">hermes-bridge</span>
          </Line>
          <Line n={13}>
            {'    '}
            <span className="tok-key">type:</span>{' '}
            <span className="tok-val">Hermes</span>{' '}
            <span className="tok-comment"># &nbsp; replicas: 2, target: docker://144</span>
          </Line>
          <Line n={14}>
            {'    '}
            <span className="tok-key">replicas:</span>{' '}
            <span className="tok-num">2</span>
          </Line>
        </code>
      </pre>
      <div className="flex items-center justify-between gap-3 border-t border-border-subtle bg-surface-2/40 px-5 py-3 font-mono text-[12px]">
        <span className="text-text-muted">$ occ apply -f fleet.yaml</span>
        <span className="inline-flex items-center gap-2 text-signal">
          <span className="dot dot-signal" />
          reconciled in 2.4s
        </span>
      </div>
    </div>
  );
}

function Line({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="mr-4 inline-block w-6 select-none text-right text-text-muted/60">
        {n}
      </span>
      <span className="whitespace-pre">{children}</span>
    </div>
  );
}
