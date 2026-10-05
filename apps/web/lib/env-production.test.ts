import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * apps/web/.env.production is committed on purpose — see its header. That only
 * stays safe if nothing secret ever lands in it, and the likeliest way for one to
 * is someone adding a line to a file that already exists and is already tracked.
 * So this fails on any name that is not on the list.
 */
const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.production');

const ALLOWED = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_IMG_BASE',
  'CONTENT_SOURCE',
  // The admin's public address; the build reads it as an anonymous visitor.
  'PAYLOAD_PUBLIC_URL',
];

function entries(): [string, string][] {
  return readFileSync(FILE, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .map((line) => {
      const at = line.indexOf('=');
      return [line.slice(0, at), line.slice(at + 1)] as [string, string];
    });
}

describe('apps/web/.env.production', () => {
  it('holds only names that are public by design', () => {
    for (const [name] of entries()) {
      expect(ALLOWED, `${name} is not a variable that may be committed`).toContain(name);
    }
  });

  it('sets the address the site is built for, and it is the real domain', () => {
    const site = entries().find(([name]) => name === 'NEXT_PUBLIC_SITE_URL')?.[1];
    expect(site).toBe('https://sabrinakulhankova.photography');
  });

  it('is never the placeholder the production guard exists to refuse', () => {
    for (const [, value] of entries()) expect(value).not.toContain('example.com');
  });
});

describe('apps/web/.env.production — the live content', () => {
  const value = (name: string) => entries().find(([key]) => key === name)?.[1];

  it('builds from the admin, read over its public address', () => {
    expect(value('CONTENT_SOURCE')).toBe('payload');
    expect(value('PAYLOAD_PUBLIC_URL')).toBe('https://admin.sabrinakulhankova.photography');
  });

  it('serves photos from the image domain, not the seed fixture', () => {
    expect(value('NEXT_PUBLIC_IMG_BASE')).toBe('https://img.sabrinakulhankova.photography');
  });
});
