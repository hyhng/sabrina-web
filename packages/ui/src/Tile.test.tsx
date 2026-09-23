import type { Project } from '@sabrina/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Tile } from './Tile.tsx';

const cover = {
  id: 'fog',
  width: 1604,
  height: 2140,
  aspectRatio: 1604 / 2140,
  widths: [400, 800],
  dominantColor: '#1c2020',
  originalFilename: 'fog.png',
  bytesOriginal: 1,
  bytesWebp: 1,
};

const project: Project = {
  title: 'Fog',
  slug: 'fog',
  category: 'art',
  credits: [],
  photos: [cover],
  cover,
  status: 'published',
};

const render = (p: Project) => renderToStaticMarkup(<Tile project={p} imgBase="/seed" />);

describe('Tile', () => {
  it('is one link to the project', () => {
    expect(render(project)).toContain('href="/work/fog/"');
  });

  it('shows the English category label, not the raw enum', () => {
    expect(render(project)).toContain('Art');
    expect(render({ ...project, category: 'commercial' })).toContain('Commercial');
  });

  it('shows the title', () => {
    expect(render(project)).toContain('Fog');
  });

  it('uses the type sizes Figma carries', () => {
    const html = render(project);
    expect(html).toContain('text-[12.5px]');
    expect(html).toContain('text-[15.5px]');
    expect(html).toContain('leading-[1.4]');
    expect(html).toContain('gap-[3px]');
    expect(html).toContain('gap-[12px]');
  });

  it('has no frame, mat, shadow or rounded corner', () => {
    // CLAUDE.md rule 5 — the photographs carry the page on their own.
    const html = render(project);
    expect(html).not.toMatch(/\brounded/);
    expect(html).not.toMatch(/\bshadow/);
    expect(html).not.toMatch(/\bborder-\d/);
    expect(html).not.toMatch(/\bp-\d|\bpadding/);
  });

  it('falls back to a descriptive alt when the CMS has none', () => {
    expect(render(project)).toContain('alt="Fog — cover"');
  });
});
