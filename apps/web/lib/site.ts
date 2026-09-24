/**
 * Where the site lives. Needed absolute for sitemap entries, canonical URLs
 * and social previews — a relative path is useless to a crawler or to Slack.
 *
 * The real domain is still open question 1 in docs/PHASES.md, so builds fall
 * back to example.com and say so rather than silently shipping a sitemap full
 * of unreachable links.
 */
const configured = process.env.NEXT_PUBLIC_SITE_URL;

if (configured === undefined || configured === '') {
  console.warn('[site] NEXT_PUBLIC_SITE_URL is not set — using https://example.com');
}

export const SITE_URL = (
  configured === undefined || configured === '' ? 'https://example.com' : configured
).replace(/\/+$/, '');

export const SITE_NAME = 'Sabrina Kulhankova';
