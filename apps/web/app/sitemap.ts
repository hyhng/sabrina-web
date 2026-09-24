import type { MetadataRoute } from 'next';

import { getContent } from '../lib/content.ts';
import { SITE_URL } from '../lib/site.ts';

/** Required for a route handler under `output: 'export'` — it is a file, not a request. */
export const dynamic = 'force-static';

/**
 * Every URL the site actually has: the grid, Information, and one per project
 * (docs/SPEC.md 9.2). Filter states are not listed — /?filter=art is the same
 * page in a different state, not a separate document.
 *
 * trailingSlash is on, so the paths here carry one too and match the files.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { homepage } = await getContent();

  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/information/`, priority: 0.5 },
    ...homepage.projects.map((project) => ({
      url: `${SITE_URL}/work/${project.slug}/`,
      priority: 0.8,
    })),
  ];
}
