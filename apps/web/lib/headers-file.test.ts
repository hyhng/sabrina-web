import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', '_headers');

/** Blocks of the Cloudflare Pages _headers file: a pattern and its header lines. */
function blocks(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  let current: string | undefined;
  for (const raw of readFileSync(FILE, 'utf8').split('\n')) {
    if (raw.trim() === '' || raw.trim().startsWith('#')) continue;
    if (/^\S/.test(raw)) {
      current = raw.trim();
      found.set(current, []);
    } else if (current !== undefined) {
      found.get(current)?.push(raw.trim());
    }
  }
  return found;
}

describe('public/_headers', () => {
  it('keeps the hashed assets cached for a year', () => {
    expect(blocks().get('/_next/static/*')).toContain(
      'Cache-Control: public, max-age=31536000, immutable',
    );
  });

  it('marks the pages.dev addresses noindex, so the preview is not a second copy in Google', () => {
    const all = blocks();
    expect(all.get('https://:project.pages.dev/*')).toContain('X-Robots-Tag: noindex');
    expect(all.get('https://:version.:project.pages.dev/*')).toContain('X-Robots-Tag: noindex');
  });

  it('never marks the real domain, or a catch-all that would hide the site from search', () => {
    for (const [pattern, lines] of blocks()) {
      if (!lines.some((line) => line.startsWith('X-Robots-Tag'))) continue;
      expect(pattern, 'noindex must be limited to pages.dev').toMatch(/pages\.dev/);
      expect(pattern).not.toBe('/*');
    }
  });
});
