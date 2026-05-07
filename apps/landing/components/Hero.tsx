import { ArrowRight, BookOpenText, Github } from 'lucide-react';

const REPO = 'https://github.com/prin7r-projects/openclaw-deploy';
const DOCS = 'https://github.com/prin7r-projects/openclaw-deploy/tree/main/docs';

export function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 md:pb-24 md:pt-32">
      <div className="flex flex-col items-start gap-7">
        <span className="inline-flex items-center gap-2 rounded border border-border bg-surface-1 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-text-muted">
          <span className="dot dot-signal" />
          v1.0 — open-source — MIT
        </span>

        <h1 className="max-w-4xl text-balance font-display text-4xl font-700 leading-[1.05] tracking-tight text-text-primary md:text-6xl lg:text-7xl">
          Declare what you want.
          <br />
          <span className="text-signal">We reconcile</span> until you have it.
        </h1>

        <p className="max-w-2xl text-balance text-lg leading-relaxed text-text-muted md:text-xl">
          OpenClaw Deploy is the declarative control plane for OpenClaw, Hermes,
          and NanoClaw agent fleets — across mixed Incus, Docker, and VPS
          targets. Manifest in. Reconciled fleet out. No 03:00 OAuth incidents.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={REPO}
            className="group inline-flex items-center gap-2 rounded border border-signal bg-signal/10 px-5 py-2.5 font-mono text-sm text-signal transition-all hover:bg-signal hover:text-surface-0"
          >
            <Github className="h-4 w-4" />
            View on GitHub
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href={DOCS}
            className="inline-flex items-center gap-2 rounded border border-border bg-surface-1 px-5 py-2.5 font-mono text-sm text-text-primary transition-all hover:border-text-muted"
          >
            <BookOpenText className="h-4 w-4" />
            Read the docs
          </a>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4 font-mono text-[12px] text-text-muted">
          <span>$ curl -fsSL openclaw-deploy.prin7r.com/install.sh | bash</span>
        </div>
      </div>
    </section>
  );
}
