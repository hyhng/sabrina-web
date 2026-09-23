import type { Project } from '@sabrina/shared/schema';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { DetailOverlay } from './DetailOverlay.tsx';

const cover = {
  id: 'marlow-portrait',
  width: 1604,
  height: 2140,
  aspectRatio: 1604 / 2140,
  widths: [400, 800],
  dominantColor: '#372f2b',
  originalFilename: 'marlow.png',
  bytesOriginal: 1,
  bytesWebp: 1,
};

const commercial: Project = {
  title: 'Marlow × Portrait',
  slug: 'marlow-portrait',
  category: 'commercial',
  client: 'Marlow',
  clientLine2: 'Marlow Cosmetics',
  credits: [
    { role: 'Photography', name: 'Sabrina Kulhankova' },
    { role: 'Styling', name: 'Jane Doe' },
  ],
  photos: [cover],
  cover,
  status: 'published',
};

const render = (project: Project) =>
  renderToStaticMarkup(<DetailOverlay project={project} imgBase="/seed" onClose={vi.fn()} />);

describe('DetailOverlay', () => {
  const html = render(commercial);

  it('is a labelled modal dialog', () => {
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="detail-title"');
    expect(html).toContain('id="detail-title"');
  });

  it('shows the title and a close control that says what it does', () => {
    expect(html).toContain('Marlow × Portrait');
    expect(html).toContain('aria-label="Close"');
  });

  it('lays the meta out as Figma does — client and credits side by side', () => {
    expect(html).toContain('Client :');
    expect(html).toContain('Marlow Cosmetics');
    expect(html).toContain('Credits :');
    expect(html).toContain('Photography · Sabrina Kulhankova');
    expect(html).toContain('Styling · Jane Doe');
  });

  it('keeps the plate on paper, not white', () => {
    // node 154:170 is #faf9f6, whatever DESIGN.md's colour table says.
    expect(html).toContain('bg-paper');
    expect(html).not.toContain('bg-white');
  });

  it('leaves the homepage showing through at 12%', () => {
    expect(html).toContain('bg-paper/88');
  });

  it('drops the client column for a project that has none', () => {
    const art: Project = {
      ...commercial,
      title: 'Fog',
      slug: 'fog',
      category: 'art',
      client: undefined,
      clientLine2: undefined,
    };
    const artHtml = render(art);
    expect(artHtml).not.toContain('Client :');
    expect(artHtml).toContain('Credits :');
  });

  it('drops the credits column when there are none', () => {
    expect(render({ ...commercial, credits: [] })).not.toContain('Credits :');
  });

  it('loads the detail photo eagerly — it is what the visitor came for', () => {
    expect(html).toContain('loading="eager"');
    expect(html).toContain('sizes="620px"');
  });
});
