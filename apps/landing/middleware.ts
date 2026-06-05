// [PRI-5762 — M3 repair] Landing security middleware.
//
// Production-grade security header baseline (matches the operator-ui
// middleware). The landing previously shipped zero of these, leaving it
// open to clickjacking + MIME-sniffing + referrer leakage. This file
// is loaded by Next.js at the edge and runs before any route handler.
//
// Headers applied to every response:
//   - Content-Security-Policy   Strict, allow 'self' for script/style/img,
//                               Google Fonts for fonts, no inline/eval.
//   - Strict-Transport-Security HSTS for two years; includeSubDomains+preload.
//   - X-Frame-Options           DENY — no framing.
//   - X-Content-Type-Options    nosniff.
//   - Referrer-Policy           no-referrer.
//   - Permissions-Policy        Opt out of camera/mic/geo/payment/usb/imu.
//   - Cross-Origin-Opener-Policy  same-origin.
//   - Cross-Origin-Resource-Policy same-origin.
//
// The middleware does NOT rewrite or block any request — it only adds
// the security header set. The next.config.mjs still owns
// poweredByHeader / output: 'standalone' / reactStrictMode.

import { NextRequest, NextResponse } from 'next/server';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ??
  'https://openclaw-deploy.prin7r.com';

function applySecurityHeaders(res: NextResponse): NextResponse {
  // Strict CSP. The landing is fully server-rendered, has no third-party
  // scripts, and the only inline <style> is what next/font injects. We
  // therefore keep 'self' + Google Fonts and disallow eval/remote scripts.
  // 'unsafe-inline' is included for style only because Tailwind's preflight
  // and next/font's generated style block use inline <style>. Script-src
  // is locked to 'self' only.
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data:",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "connect-src 'self' " + SITE_URL,
    ].join('; '),
  );
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'no-referrer');
  res.headers.set(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
    ].join(', '),
  );
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return res;
}

export function middleware(_req: NextRequest): NextResponse {
  return applySecurityHeaders(NextResponse.next());
}

// Match every path the landing serves (HTML, API routes, static assets).
// We exclude /_next/static/* in the matcher so the browser cache stays hot.
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files in /public)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
