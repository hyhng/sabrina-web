import { describe, expect, it } from 'vitest';

import robots from './robots.ts';
import sitemap from './sitemap.ts';

const entries = await sitemap();

describe('sitemap', () => {
  it('lists the grid, Information and every project', () => {
    // Nine seed projects plus the two fixed pages.
    expect(entries).toHaveLength(11);
    expect(entries.map((entry) => entry.url)).toContain('https://example.com/work/fog/');
  });

  it('gives absolute URLs — a crawler cannot resolve a relative one', () => {
    for (const entry of entries) expect(entry.url).toMatch(/^https:\/\//);
  });

  it('carries the trailing slash, so the URLs match the files on disk', () => {
    for (const entry of entries) expect(entry.url.endsWith('/')).toBe(true);
  });

  it('leaves filter states out — they are one page in two states', () => {
    for (const entry of entries) expect(entry.url).not.toContain('?filter=');
  });

  it('ranks the grid above a project, and Information below both', () => {
    const priority = (url: string) => entries.find((entry) => entry.url === url)?.priority;
    expect(priority('https://example.com/')).toBe(1);
    expect(priority('https://example.com/work/fog/')).toBe(0.8);
    expect(priority('https://example.com/information/')).toBe(0.5);
  });
});

describe('robots', () => {
  const rules = robots();

  it('lets the public site be indexed', () => {
    expect(rules.rules).toEqual({ userAgent: '*', allow: '/' });
  });

  it('points at the sitemap', () => {
    expect(rules.sitemap).toBe('https://example.com/sitemap.xml');
  });

  it('says nothing about the admin — that lives on its own subdomain', () => {
    expect(JSON.stringify(rules)).not.toContain('admin');
  });
});
