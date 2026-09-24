import type { MetadataRoute } from 'next';

import { SITE_URL } from '../lib/site.ts';

/** Required for a route handler under `output: 'export'` — it is a file, not a request. */
export const dynamic = 'force-static';

/**
 * The public site is meant to be indexed. The admin lives on its own
 * subdomain and serves its own robots.txt disallowing everything
 * (docs/SPEC.md 9.2), so nothing about it belongs here.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
