import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * styles/payload-exceptions.css overrides Payload's own CSS, against CLAUDE.md
 * rule 9, by agreement and for one purpose. What keeps that agreement honest is
 * that it cannot quietly grow: this fails if a rule appears that does not start
 * from the selection bar.
 */
const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'payload-exceptions.css');

/** Selectors only: strip comments and declaration bodies, split lists on commas. */
function selectors(): string[] {
  const css = readFileSync(FILE, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].flatMap((match) =>
    (match[1] ?? '')
      .split(',')
      .map((selector) => selector.trim())
      .filter((selector) => selector !== ''),
  );
}

describe('styles/payload-exceptions.css', () => {
  it('has rules at all, or this test checks nothing', () => {
    expect(selectors().length).toBeGreaterThan(0);
  });

  it('touches nothing but the list selection bar', () => {
    for (const selector of selectors()) {
      expect(selector.startsWith('.list-selection'), `"${selector}" is outside the bar`).toBe(true);
    }
  });

  it('does not reach for tags, ids or the whole page', () => {
    for (const selector of selectors()) {
      expect(selector, selector).not.toMatch(/(^|[\s>+~])(html|body|:root|\*|#)/);
    }
  });

  it('is not using !important to win a fight with Payload', () => {
    expect(readFileSync(FILE, 'utf8')).not.toContain('!important');
  });
});
