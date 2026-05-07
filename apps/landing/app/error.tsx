'use client';

// [NEXT_ERROR_BOUNDARY] /apps/landing/app/error.tsx
// Catches uncaught render exceptions so Next.js does not log the redacted
// runtime-config digest on production. Intentionally minimal — the operator
// landing should never raise to this boundary; if it does, log and recover.
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[LANDING_ERROR_BOUNDARY] %s', error?.message ?? '(no message)');
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: '#0B0E12',
          color: '#E6ECF2',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <p
            style={{
              color: '#7CFFA1',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            // unrecoverable
          </p>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.75rem' }}>
            The control plane stalled mid-reconcile.
          </h1>
          <p style={{ color: '#7E8A9A', margin: '0 0 1.5rem' }}>
            This is a render-side error in the marketing site, not the agent
            fleet. The fleet keeps running.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: 'rgba(124,255,161,0.1)',
              border: '1px solid #7CFFA1',
              color: '#7CFFA1',
              padding: '0.625rem 1.25rem',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.875rem',
              cursor: 'pointer',
              borderRadius: '6px',
            }}
          >
            retry
          </button>
        </div>
      </body>
    </html>
  );
}
