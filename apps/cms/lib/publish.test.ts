import { describe, expect, it } from 'vitest';

import { DEFAULT_SITE_URL, deployHook, lastPublishedLabel, siteUrl } from './publish.ts';

describe('deployHook', () => {
  it('reads the hook from the environment', () => {
    expect(deployHook({ CF_DEPLOY_HOOK_URL: 'https://api.cloudflare.com/hook/abc' })).toBe(
      'https://api.cloudflare.com/hook/abc',
    );
  });

  it('treats absent and blank alike — an empty .env line is not a value', () => {
    expect(deployHook({})).toBeUndefined();
    expect(deployHook({ CF_DEPLOY_HOOK_URL: '' })).toBeUndefined();
  });
});

describe('lastPublishedLabel', () => {
  const now = new Date('2026-09-30T12:00:00.000Z');
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

  it('says so plainly before the first publish', () => {
    expect(lastPublishedLabel(undefined, now)).toContain('ještě nebyl');
    expect(lastPublishedLabel(null, now)).toContain('ještě nebyl');
    expect(lastPublishedLabel('', now)).toContain('ještě nebyl');
  });

  it('does not present an unreadable date as a time', () => {
    expect(lastPublishedLabel('not a date', now)).toContain('ještě nebyl');
  });

  it('counts minutes for the first hour, which is when she will look', () => {
    expect(lastPublishedLabel(ago(0), now)).toBe('Publikováno právě teď.');
    expect(lastPublishedLabel(ago(3), now)).toBe('Publikováno před 3 min.');
    expect(lastPublishedLabel(ago(59), now)).toBe('Publikováno před 59 min.');
  });

  it('switches to hours, then to a date', () => {
    expect(lastPublishedLabel(ago(60), now)).toBe('Publikováno před 1 h.');
    expect(lastPublishedLabel(ago(23 * 60), now)).toBe('Publikováno před 23 h.');
    // Past a day the exact time stops mattering and the date starts to.
    expect(lastPublishedLabel(ago(48 * 60), now)).toMatch(/Publikováno 28\. ?9\. ?2026\./);
  });
});

describe('siteUrl', () => {
  it('is the Pages address until SITE_URL is set on the server', () => {
    expect(siteUrl({})).toBe(DEFAULT_SITE_URL);
    expect(siteUrl({ SITE_URL: '' })).toBe(DEFAULT_SITE_URL);
  });

  it('takes SITE_URL when it is an https address, without a trailing slash', () => {
    expect(siteUrl({ SITE_URL: 'https://sabrinakulhankova.photography/' })).toBe(
      'https://sabrinakulhankova.photography',
    );
  });

  it('ignores anything that is not an https address rather than linking to it', () => {
    expect(siteUrl({ SITE_URL: 'javascript:alert(1)' })).toBe(DEFAULT_SITE_URL);
    expect(siteUrl({ SITE_URL: 'http://example.com' })).toBe(DEFAULT_SITE_URL);
  });
});
