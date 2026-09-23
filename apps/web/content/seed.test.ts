import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { contentSchema, type GridConfig, layoutColumns } from '@sabrina/shared';
import { describe, expect, it } from 'vitest';

const seedFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed.json');
const seed = contentSchema.parse(JSON.parse(readFileSync(seedFile, 'utf8')));

/** Figma UI 04 — docs/DESIGN.md → Grid → Desktop. */
const DESKTOP: GridConfig = {
  columns: 3,
  columnWidth: 401,
  offsets: [0, 170, 70],
  gapY: 96,
  captionGap: 12,
  captionHeight: 42,
};

describe('seed content', () => {
  it('parses against the canonical schema', () => {
    expect(seed.homepage.projects).toHaveLength(9);
  });

  it('keeps the order docs/TECH.md 4.5 fixes', () => {
    expect(seed.homepage.projects.map((p) => p.title)).toEqual([
      'Wool — SS26 Campaign',
      'Summer in the Mountains',
      'Soda — Outdoor',
      'Portraits — Business Weekly',
      'Fog',
      'Hotel — Interiors',
      'Silence',
      'Mirrors',
      'Marlow × Portrait',
    ]);
  });

  it('carries the categories from the artboard: six commercial, three art', () => {
    const counts = seed.homepage.projects.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ commercial: 6, art: 3 });
  });

  it('lays out into the columns Figma shows', () => {
    const items = seed.homepage.projects.map((p) => ({ aspectRatio: p.cover.aspectRatio }));
    expect(layoutColumns(items, DESKTOP)).toEqual([0, 2, 1, 1, 0, 2, 2, 1, 0]);
  });

  it('has a cover wide enough for the grid on a retina screen', () => {
    for (const project of seed.homepage.projects) {
      // docs/SPEC.md 8.4: under 800px is "too little even for the grid".
      expect(project.cover.width).toBeGreaterThanOrEqual(800);
    }
  });
});
