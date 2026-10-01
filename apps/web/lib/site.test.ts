import { describe, expect, it } from 'vitest';

import { resolveSiteUrl } from './site.ts';

const DOMAIN = 'https://sabrinakulhankova.photography';

describe('resolveSiteUrl', () => {
  it('uses the configured address', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: DOMAIN })).toBe(DOMAIN);
  });

  it('drops a trailing slash, so entries are not joined with two', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: `${DOMAIN}/` })).toBe(DOMAIN);
  });

  it('falls back to example.com locally rather than stopping a dev build', () => {
    expect(resolveSiteUrl({})).toBe('https://example.com');
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: '' })).toBe('https://example.com');
  });

  it('does not stop a branch preview, which has no reason to know the domain', () => {
    expect(resolveSiteUrl({ CF_PAGES_BRANCH: 'some-feature' })).toBe('https://example.com');
  });

  it('stops the production build when the address is missing', () => {
    // The first live deploy shipped example.com in the sitemap, robots.txt and
    // structured data, and nothing complained.
    expect(() => resolveSiteUrl({ CF_PAGES_BRANCH: 'main' })).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => resolveSiteUrl({ CF_PAGES_BRANCH: 'main', NEXT_PUBLIC_SITE_URL: '' })).toThrow();
  });

  it('stops the production build when the address is still the placeholder', () => {
    expect(() =>
      resolveSiteUrl({ CF_PAGES_BRANCH: 'main', NEXT_PUBLIC_SITE_URL: 'https://example.com/' }),
    ).toThrow(/example\.com/);
  });

  it('says whether the variable is absent or set to something unusable', () => {
    // From the outside "missing" and "present but wrong" look identical, and they
    // need different fixes.
    expect(() => resolveSiteUrl({ CF_PAGES_BRANCH: 'main' })).toThrow(/not set at all/);
    expect(() => resolveSiteUrl({ CF_PAGES_BRANCH: 'main', NEXT_PUBLIC_SITE_URL: '' })).toThrow(
      /set to ""/,
    );
    expect(() =>
      resolveSiteUrl({ CF_PAGES_BRANCH: 'main', NEXT_PUBLIC_SITE_URL: 'https://example.com' }),
    ).toThrow(/set to "https:\/\/example\.com"/);
  });

  it('says where to fix it, in words the person reading the build log can act on', () => {
    expect(() => resolveSiteUrl({ CF_PAGES_BRANCH: 'main' })).toThrow(/Variables and secrets/);
  });

  it('lets the production build through once it is set', () => {
    expect(resolveSiteUrl({ CF_PAGES_BRANCH: 'main', NEXT_PUBLIC_SITE_URL: DOMAIN })).toBe(DOMAIN);
  });
});
