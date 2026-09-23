import { describe, expect, it } from 'vitest';

import { type GridConfig, layoutColumns, tileHeight } from './grid.ts';

/**
 * Figma UI 04 — Grid 3 sloupce · Desktop (node 154:3), read 23. 9. 2026.
 * Numbers in docs/DESIGN.md → Grid → Desktop and docs/TECH.md 4.5.
 */
const DESKTOP: GridConfig = {
  columns: 3,
  columnWidth: 401,
  offsets: [0, 170, 70],
  gapY: 96,
  captionGap: 12,
  captionHeight: 42,
};

/** Top of the first tile in the artboard: header (80) + 24. */
const GRID_TOP = 104;

/** The three photo heights used in the design, as aspect ratios. */
const ar = (photoHeight: number) => DESKTOP.columnWidth / photoHeight;

/** Seed order from docs/TECH.md 4.5 — also the order seed.json must use. */
const UI_04 = [
  { name: 'Wool — SS26 Campaign', aspectRatio: ar(535) },
  { name: 'Summer in the Mountains', aspectRatio: ar(535) },
  { name: 'Soda — Outdoor', aspectRatio: ar(267) },
  { name: 'Portraits — Business Weekly', aspectRatio: ar(501) },
  { name: 'Fog', aspectRatio: ar(535) },
  { name: 'Hotel — Interiors', aspectRatio: ar(267) },
  { name: 'Silence', aspectRatio: ar(535) },
  { name: 'Mirrors', aspectRatio: ar(501) },
  { name: 'Marlow × Portrait', aspectRatio: ar(535) },
];

/**
 * Stack the tiles the way the rendered columns will: each column starts at its
 * offset and tiles follow with gapY between them. The algorithm under test is
 * the column assignment; this only turns that into the y values Figma shows.
 */
function yPositions(items: readonly { aspectRatio: number }[], cfg: GridConfig): number[] {
  const bottoms = cfg.offsets.slice();
  return layoutColumns(items, cfg).map((column, i) => {
    const item = items[i];
    if (item === undefined) throw new Error(`no item at ${i}`);
    const top = bottoms[column] ?? 0;
    bottoms[column] = top + tileHeight(item.aspectRatio, cfg) + cfg.gapY;
    return GRID_TOP + top;
  });
}

describe('tileHeight', () => {
  it('matches the three tile heights in UI 04', () => {
    expect(tileHeight(ar(535), DESKTOP)).toBe(589);
    expect(tileHeight(ar(501), DESKTOP)).toBe(555);
    expect(tileHeight(ar(267), DESKTOP)).toBe(321);
  });

  it('rejects a non-positive aspect ratio', () => {
    expect(() => tileHeight(0, DESKTOP)).toThrow(RangeError);
    expect(() => tileHeight(-1, DESKTOP)).toThrow(RangeError);
  });
});

describe('layoutColumns — UI 04 desktop', () => {
  it('puts each project in the column Figma shows', () => {
    // 1-based in TECH 4.5: 1, 3, 2, 2, 1, 3, 3, 2, 1
    expect(layoutColumns(UI_04, DESKTOP)).toEqual([0, 2, 1, 1, 0, 2, 2, 1, 0]);
  });

  it('reproduces the exact y positions from the artboard', () => {
    expect(yPositions(UI_04, DESKTOP)).toEqual([104, 174, 274, 691, 789, 859, 1276, 1342, 1474]);
  });
});

describe('layoutColumns — rules', () => {
  it('sends a tie to the leftmost column', () => {
    const flat: GridConfig = { ...DESKTOP, offsets: [0, 0, 0] };
    const square = { aspectRatio: 1 };
    expect(layoutColumns([square, square, square, square], flat)).toEqual([0, 1, 2, 0]);
  });

  it('starts each column at its own offset', () => {
    const cfg: GridConfig = { ...DESKTOP, columns: 2, offsets: [500, 0] };
    expect(layoutColumns([{ aspectRatio: 1 }], cfg)).toEqual([1]);
  });

  it('handles an empty list', () => {
    expect(layoutColumns([], DESKTOP)).toEqual([]);
  });

  it('rejects an offsets array that does not match the column count', () => {
    expect(() => layoutColumns([], { ...DESKTOP, offsets: [0, 0] })).toThrow(RangeError);
  });
});
