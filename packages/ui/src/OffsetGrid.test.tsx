import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { contentSchema, GRID_DESKTOP } from '@sabrina/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { OffsetGrid } from './OffsetGrid.tsx';

const seedFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../apps/web/content/seed.json',
);
const { homepage } = contentSchema.parse(JSON.parse(readFileSync(seedFile, 'utf8')));

const html = renderToStaticMarkup(<OffsetGrid projects={homepage.projects} imgBase="/seed" />);

/** Read back the per-tile custom properties the component writes. */
function tileVars(markup: string) {
  const matches = markup.matchAll(/class="offset-grid__item" style="([^"]*)"/g);
  return [...matches].map(([, style]) =>
    Object.fromEntries((style ?? '').split(';').map((pair) => pair.split(':') as [string, string])),
  );
}

/** Do the sum the browser will do in calc(). */
const resolve = (vars: Record<string, string>, columnWidth: number) =>
  Math.round(columnWidth * parseFloat(vars['--a-d'] ?? '0') + parseFloat(vars['--b-d'] ?? '0'));

describe('OffsetGrid', () => {
  it('renders every project once', () => {
    expect(tileVars(html)).toHaveLength(9);
    expect([...html.matchAll(/href="\/work\/[^"]*"/g)]).toHaveLength(9);
  });

  it('writes positions for all three breakpoints', () => {
    for (const vars of tileVars(html)) {
      for (const key of ['m', 't', 'd']) {
        expect(vars[`--c-${key}`]).toBeDefined();
        expect(vars[`--a-${key}`]).toBeDefined();
        expect(vars[`--b-${key}`]).toBeDefined();
      }
    }
  });

  it('resolves to the columns and y positions on Figma UI 04', () => {
    const vars = tileVars(html);
    expect(vars.map((v) => Number(v['--c-d']))).toEqual([0, 2, 1, 1, 0, 2, 2, 1, 0]);
    // 104 is the top of the first tile in the artboard: header 80 plus 24.
    expect(vars.map((v) => 104 + resolve(v, GRID_DESKTOP.columnWidth))).toEqual([
      104, 174, 274, 691, 789, 859, 1276, 1342, 1474,
    ]);
  });

  it('sizes the canvas from the tallest column', () => {
    const canvas = /class="offset-grid__canvas" style="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(canvas).toContain('--h-m:calc(max(');
    expect(canvas).toContain('--h-t:calc(max(');
    expect(canvas).toContain('--h-d:calc(max(');
    // Column widths are flexible, so the height must stay a calc over --cw
    // rather than a baked pixel number.
    expect(canvas).toContain('var(--cw)');
  });

  it('marks the first tile as the LCP photo and the next few eager', () => {
    // Scoped to <img>, because React repeats fetchPriority on the preload link.
    const images = [...html.matchAll(/<img[^>]*>/g)].map(([tag]) => tag);
    expect(images).toHaveLength(9);
    expect(images.filter((tag) => tag.includes('fetchPriority="high"'))).toHaveLength(1);
    expect(images.filter((tag) => tag.includes('loading="eager"'))).toHaveLength(4);
    expect(images.filter((tag) => tag.includes('loading="lazy"'))).toHaveLength(5);
    // The high-priority one must be the first tile, not just any of them.
    expect(images[0]).toContain('fetchPriority="high"');
  });
});
