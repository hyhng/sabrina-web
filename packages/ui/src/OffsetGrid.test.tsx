import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { contentSchema, GRID_DESKTOP, GRID_TABLET, layoutColumns } from '@sabrina/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { intoColumns, OffsetGrid } from './OffsetGrid.tsx';

const seedFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../apps/web/content/seed.json',
);
const { homepage } = contentSchema.parse(JSON.parse(readFileSync(seedFile, 'utf8')));
const projects = homepage.projects;

const html = renderToStaticMarkup(<OffsetGrid projects={projects} imgBase="/seed" />);

/** One arrangement's markup: from its opening tag to the next one's, or the end. */
function arrangement(markup: string, key: 'narrow' | 'wide'): string {
  const start = markup.indexOf(`offset-grid__columns--${key}`);
  const next = markup.indexOf('offset-grid__columns--', start + 1);
  return markup.slice(start, next === -1 ? undefined : next);
}

/** The slugs in each column of an arrangement, top to bottom. */
function columnsOf(markup: string, key: 'narrow' | 'wide'): string[][] {
  return arrangement(markup, key)
    .split('<div class="offset-grid__column"')
    .slice(1)
    .map((column) =>
      [...column.matchAll(/href="\/work\/([^/"]+)\/"/g)].map(([, slug]) => slug ?? ''),
    );
}

describe('OffsetGrid', () => {
  it('renders two arrangements: two columns and three', () => {
    expect(columnsOf(html, 'narrow')).toHaveLength(2);
    expect(columnsOf(html, 'wide')).toHaveLength(3);
  });

  it('has every project once in each arrangement', () => {
    const slugs = projects.map((project) => project.slug).sort();
    expect(columnsOf(html, 'narrow').flat().sort()).toEqual(slugs);
    expect(columnsOf(html, 'wide').flat().sort()).toEqual(slugs);
  });

  it('deals the projects into the columns the algorithm picks, keeping their order', () => {
    const items = projects.map((project) => ({ aspectRatio: project.cover.aspectRatio }));
    for (const [key, layout] of [
      ['narrow', GRID_TABLET],
      ['wide', GRID_DESKTOP],
    ] as const) {
      const assigned = layoutColumns(items, layout);
      const expected = Array.from({ length: layout.columns }, (_, column) =>
        projects.filter((_project, index) => assigned[index] === column).map((p) => p.slug),
      );
      expect(columnsOf(html, key)).toEqual(expected);
    }
  });

  it('positions nothing absolutely: a tile is wherever the one above it ends', () => {
    // The fix for a wrapped title running under the next photo. A top worked out
    // in advance cannot know how many lines a caption takes.
    expect(html).not.toMatch(/--[ab]-[mtd]:/);
    expect(html).not.toContain('offset-grid__canvas');
    for (const tag of html.matchAll(/<div class="offset-grid__item"[^>]*>/g)) {
      expect(tag[0]).not.toContain('style=');
    }
  });

  it('offsets the columns as multiples of the column width, per breakpoint', () => {
    // Figma UI 04: 0 / 170 / 70 on 401px columns.
    const wide = [...arrangement(html, 'wide').matchAll(/--o-d:([\d.]+)/g)].map(([, v]) =>
      Number(v),
    );
    expect(wide).toEqual([0, 170 / 401, 70 / 401].map((v) => Number(v.toFixed(6))));
    const narrow = arrangement(html, 'narrow');
    expect(narrow).toMatch(/--o-m:0;--o-t:0/);
    expect(narrow).toContain(`--o-t:${String(Number((96 / 371).toFixed(6)))}`);
    expect(narrow).toContain(`--o-m:${String(Number((56 / 173).toFixed(6)))}`);
  });

  it('marks the first project as the LCP photo and the next few eager, in both arrangements', () => {
    for (const key of ['narrow', 'wide'] as const) {
      const part = arrangement(html, key);
      expect([...part.matchAll(/fetchPriority="high"/g)]).toHaveLength(1);
      expect([...part.matchAll(/loading="eager"/g)]).toHaveLength(4);
    }
  });

  it('does not fade in on the server render, only after a filter change', () => {
    expect(html).not.toContain('animate-fade-in');
  });
});

describe('OffsetGrid — filtering', () => {
  const art = projects.filter((project) => project.category === 'art');
  const filtered = renderToStaticMarkup(
    <OffsetGrid
      projects={projects}
      imgBase="/seed"
      visibleSlugs={new Set(art.map((project) => project.slug))}
    />,
  );

  it('renders only the projects in the category', () => {
    const slugs = art.map((project) => project.slug).sort();
    expect(columnsOf(filtered, 'wide').flat().sort()).toEqual(slugs);
    expect(columnsOf(filtered, 'narrow').flat().sort()).toEqual(slugs);
  });

  it('lays them out as if the others were not there', () => {
    expect(columnsOf(filtered, 'wide')).toEqual(
      intoColumns(art, GRID_DESKTOP).map((column) => column.map(({ project }) => project.slug)),
    );
  });

  it('moves the LCP photo to the first project that is shown', () => {
    const first =
      /<img[^>]*fetchPriority="high"[^>]*>/.exec(arrangement(filtered, 'wide'))?.[0] ?? '';
    expect(first).toContain(`/photos/${art[0]?.cover.id ?? ''}/`);
  });

  it('shows everything when no filter is given', () => {
    expect(columnsOf(html, 'wide').flat()).toHaveLength(projects.length);
  });
});
