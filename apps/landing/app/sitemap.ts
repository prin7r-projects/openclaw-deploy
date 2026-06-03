import type { MetadataRoute } from 'next';

// [SITEMAP] /apps/landing/app/sitemap.ts
// Trivial sitemap for the marketing landing. Self-hosted, single-page, no
// other deployable routes yet. If/when the operator UI ships, add its
// public-facing paths here.

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://openclaw-deploy.prin7r.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];
}
