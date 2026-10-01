/**
 * Where the site lives. Needed absolute for sitemap entries, canonical URLs
 * and social previews — a relative path is useless to a crawler or to Slack.
 */

const FALLBACK = 'https://example.com';

/**
 * Just the two variables this reads, but typed as the open record `process.env`
 * is — a narrower object type would not accept `process.env` at all.
 *
 * NEXT_PUBLIC_SITE_URL: the address the site is built for.
 * CF_PAGES_BRANCH: set by Cloudflare Pages on every build it runs, to the branch
 * being built.
 */
export type SiteEnv = Readonly<Record<string, string | undefined>>;

/**
 * The address the site is built for.
 *
 * Locally and on branch previews a missing value falls back to example.com and
 * says so. On the production branch it stops the build instead: the first live
 * deploy, on 1 October, shipped a sitemap, a robots.txt and structured data all
 * pointing at example.com because the variable had not reached the build — and
 * nothing complained. Telling Google a portfolio lives on example.com is not a
 * mistake worth discovering from search results.
 *
 * Takes the environment as an argument so the rule can be tested.
 */
export function resolveSiteUrl(env: SiteEnv): string {
  const configured = env.NEXT_PUBLIC_SITE_URL ?? '';
  const production = env.CF_PAGES_BRANCH === 'main';

  if (configured === '' || configured.replace(/\/+$/, '') === FALLBACK) {
    if (production) {
      throw new Error(
        'NEXT_PUBLIC_SITE_URL is missing or still example.com on the production build. ' +
          'Set it in Cloudflare Pages → Settings → Variables and secrets → Production, ' +
          'e.g. https://sabrinakulhankova.photography, then retry the deployment.',
      );
    }
    return FALLBACK;
  }
  return configured.replace(/\/+$/, '');
}

const url = resolveSiteUrl(process.env);
if (url === FALLBACK) {
  console.warn(`[site] NEXT_PUBLIC_SITE_URL is not set — using ${FALLBACK}`);
}

export const SITE_URL = url;

export const SITE_NAME = 'Sabrina Kulhankova';
