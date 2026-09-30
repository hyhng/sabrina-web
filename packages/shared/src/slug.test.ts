import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { contentSchema } from './schema.ts';
import { slugify } from './slug.ts';

describe('slugify', () => {
  it('reproduces every slug in the seed from its title', () => {
    // The real titles, em dashes and × included.
    const seedFile = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../apps/web/content/seed.json',
    );
    const { homepage } = contentSchema.parse(JSON.parse(readFileSync(seedFile, 'utf8')));
    for (const project of homepage.projects) {
      expect(slugify(project.title), project.title).toBe(project.slug);
    }
  });

  it('strips diacritics instead of dropping the letters', () => {
    expect(slugify('Šeřík v Českém ráji')).toBe('serik-v-ceskem-raji');
    expect(slugify('Ångström')).toBe('angstrom');
  });

  it('collapses runs of punctuation into one separator', () => {
    expect(slugify('Fog — — Mirrors')).toBe('fog-mirrors');
    expect(slugify('a & b / c')).toBe('a-b-c');
  });

  it('leaves no separator hanging at either end', () => {
    expect(slugify('  Fog!  ')).toBe('fog');
    expect(slugify('— Fog —')).toBe('fog');
  });

  it('gives back nothing when a title has nothing to offer', () => {
    expect(slugify('———')).toBe('');
    expect(slugify('')).toBe('');
  });

  it('always produces something the schema accepts', () => {
    const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const title of ['Wool — SS26', 'Marlow × Portrait', '2026 Retrospective', 'Ó!']) {
      expect(pattern.test(slugify(title)), title).toBe(true);
    }
  });
});
