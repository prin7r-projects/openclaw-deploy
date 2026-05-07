import Link from 'next/link';

// [NEXT_NOT_FOUND] /apps/landing/app/not-found.tsx
// Operator-style 404. Keeps tone consistent with the landing.

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-surface-0 px-6 text-text-primary"
      style={{ background: '#0B0E12' }}
    >
      <div className="max-w-lg text-center">
        <p className="mb-3 font-mono text-[12px] uppercase tracking-widest text-signal">
          // 404 · not in the manifest
        </p>
        <h1 className="mb-3 font-display text-3xl font-600 leading-tight text-text-primary md:text-4xl">
          That URL is not declared.
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-text-muted">
          The reconciler only knows about routes in the manifest. Head back to
          the home page and try again.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded border border-signal bg-signal/10 px-5 py-2.5 font-mono text-sm text-signal transition-all hover:bg-signal hover:text-surface-0"
        >
          {'<'} return home
        </Link>
      </div>
    </main>
  );
}
