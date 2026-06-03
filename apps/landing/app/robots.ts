import type { MetadataRoute } from 'next';

// [ROBOTS] /apps/landing/app/robots.ts
// Standard robots.txt for the marketing landing. Points crawlers at the
// sitemap and disallows the /api/ stub routes (no public indexing).

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://openclaw-deploy.prin7r.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
