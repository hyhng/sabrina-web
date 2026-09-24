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

  it('holds the column at 620 and lets the plate padding fall out of it', () => {
    // 90 either side at 1440, 71 at 810 (docs/SPEC.md 4.1) — without either
    // number being written down.
    expect(html).toContain('detail:w-[min(800px,100vw-48px)]');
    expect(html).toContain('detail:w-[620px] detail:max-w-[calc(100%-48px)]');
  });

  it('loads the detail photo eagerly — it is what the visitor came for', () => {
    expect(html).toContain('loading="eager"');
    expect(html).toContain('sizes="620px"');
  });
});

describe('DetailOverlay — how the photo sits in the area', () => {
  const landscape = { ...cover, id: 'soda', width: 1604, height: 1068, aspectRatio: 1604 / 1068 };
  const areaShaped = { ...cover, id: 'fit', width: 620, height: 740, aspectRatio: 620 / 740 };

  it('never crops or stretches — the box follows the photo', () => {
    for (const photo of [landscape, areaShaped, cover]) {
      const html = render({ ...commercial, cover: photo, photos: [photo] });
      expect(html).toContain('h-auto max-h-full w-auto max-w-full');
      expect(html).not.toContain('object-cover');
    }
  });

  it('leaves no gutter for the placeholder colour to show in', () => {
    // The element used to be stretched to the area with the image fitted
    // inside, which painted dominantColor down both sides of the picture.
    const html = render({ ...commercial, cover: landscape, photos: [landscape] });
    const imgClass = /<img[^>]*class="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(imgClass.split(/\s+/)).toEqual(['h-auto', 'max-h-full', 'w-auto', 'max-w-full']);
    // Nothing forces the element to the area's width or height any more.
    expect(imgClass.split(/\s+/)).not.toContain('w-full');
    expect(imgClass.split(/\s+/)).not.toContain('h-full');
  });

  it('keeps the same area either way, so the title, meta and arrows hold still', () => {
    for (const photo of [landscape, areaShaped]) {
      expect(render({ ...commercial, cover: photo, photos: [photo] })).toContain(
        'detail-photo-area',
      );
    }
  });
});

describe('DetailOverlay — mobile (UI 09)', () => {
  const html = render(commercial);

  it('is a page of its own below 768, and an overlay above it', () => {
    // Paper by default, the veil only from the detail breakpoint up.
    const dialogClass = /role="dialog"[^>]*class="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(dialogClass.split(/\s+/)).toContain('bg-paper');
    expect(dialogClass.split(/\s+/)).toContain('detail:bg-paper/88');
    // Fills the viewport on mobile, so there is no backdrop left to click.
    expect(html).toContain('min-h-full');
    expect(html).toContain('detail:min-h-0');
  });

  it('uses the mobile type sizes and grows them from 768', () => {
    expect(html).toContain('text-[15px] text-ink detail:text-[18px]');
    expect(html).toContain('text-[17px]');
  });

  it('stacks the meta on mobile and lines it up from 768', () => {
    expect(html).toContain('flex flex-col gap-[16px]');
    expect(html).toContain('detail:flex-row');
  });

  it('lets the photo run full width on mobile and into the column from 768', () => {
    expect(html).toContain('detail:mx-auto detail:mt-[21px] detail:w-[620px]');
  });
});
