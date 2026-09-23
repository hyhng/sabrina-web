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

/**
 * Read each tile back out of the markup. Attribute order is not fixed — a
 * hidden tile carries data-hidden between class and style — so match the whole
 * opening tag rather than a fixed sequence.
 */
function tileItems(markup: string) {
  return [...markup.matchAll(/<div class="offset-grid__item"([^>]*)>/g)].map(([, attributes]) => {
    const style = /style="([^"]*)"/.exec(attributes ?? '')?.[1] ?? '';
    return {
      hidden: (attributes ?? '').includes('data-hidden="true"'),
      vars: Object.fromEntries(
        style
          .split(';')
          .filter(Boolean)
          .map((pair) => pair.split(':') as [string, string]),
      ),
    };
  });
}

const tileVars = (markup: string) => tileItems(markup).map((tile) => tile.vars);

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

describe('OffsetGrid — filtering', () => {
  const artSlugs = new Set(
    homepage.projects.filter((p) => p.category === 'art').map((p) => p.slug),
  );
  const filtered = renderToStaticMarkup(
    <OffsetGrid projects={homepage.projects} imgBase="/seed" visibleSlugs={artSlugs} />,
  );

  it('keeps filtered-out tiles in the DOM so they can fade', () => {
    expect(tileVars(filtered)).toHaveLength(9);
    expect([...filtered.matchAll(/data-hidden="true"/g)]).toHaveLength(6);
  });

  it('takes hidden tiles out of reach of keyboard and screen reader', () => {
    // Six hidden tiles, each inert.
    expect([...filtered.matchAll(/inert=""/g)]).toHaveLength(6);
  });

  it('lays the three remaining tiles out as if the others were not there', () => {
    const items = tileItems(filtered);
    const columnOf = (slug: string) => {
      const index = homepage.projects.findIndex((project) => project.slug === slug);
      return Number(items[index]?.vars['--c-d']);
    };

    // Alone, the three Art projects fill the columns by offset: Summer opens
    // column 1 at zero, Fog takes column 3 at 70, Silence column 2 at 170.
    expect(columnOf('summer-in-the-mountains')).toBe(0);
    expect(columnOf('fog')).toBe(2);
    expect(columnOf('silence')).toBe(1);
    expect(Number(items[1]?.vars['--a-d'])).toBe(0);
  });

  it('marks exactly the projects outside the category as hidden', () => {
    const items = tileItems(filtered);
    homepage.projects.forEach((project, index) => {
      expect(items[index]?.hidden).toBe(project.category !== 'art');
    });
  });

  it('moves the LCP photo to the first tile that is actually visible', () => {
    const images = [...filtered.matchAll(/<img[^>]*>/g)].map(([tag]) => tag);
    expect(images.filter((tag) => tag.includes('fetchPriority="high"'))).toHaveLength(1);
    // Wool is commercial, so it is hidden here and must not claim priority.
    const wool = images.find((tag) => tag.includes('wool-ss26-campaign'));
    expect(wool).not.toContain('fetchPriority="high"');
  });

  it('does not mark hidden tiles eager — they are not being looked at', () => {
    const images = [...filtered.matchAll(/<img[^>]*>/g)].map(([tag]) => tag);
    expect(images.filter((tag) => tag.includes('loading="eager"')).length).toBeLessThanOrEqual(3);
  });

  it('shows everything when no filter is given', () => {
    expect([...html.matchAll(/data-hidden="true"/g)]).toHaveLength(0);
  });
});
