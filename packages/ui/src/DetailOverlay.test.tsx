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

  it('holds the column at most 620 and lets the plate padding fall out of it', () => {
    // 90 either side at 1440, 71 at 810 (docs/SPEC.md 4.1) — without either
    // number being written down. The width itself is derived from the stage.
    expect(html).toContain('detail:w-[calc(var(--col)+2*var(--pad))]');
    expect(html).toContain('detail:w-(--col) detail:max-w-[calc(100%-48px)]');
  });

  it('loads the detail photo eagerly — it is what the visitor came for', () => {
    expect(html).toContain('loading="eager"');
    expect(html).toContain('sizes="620px"');
  });
});

describe('DetailOverlay — how the photo sits in the stage', () => {
  const landscape = { ...cover, id: 'soda', width: 1604, height: 1068, aspectRatio: 1604 / 1068 };
  const areaShaped = { ...cover, id: 'fit', width: 620, height: 740, aspectRatio: 620 / 740 };

  /** The box the photos slide inside. */
  const box = (html: string) =>
    /<div class="group\/photo[^"]*"[^>]*style="([^"]*)"/.exec(html)?.[1] ?? '';

  const stageClass = (html: string) =>
    (/<div class="(group\/photo[^"]*)"/.exec(html)?.[1] ?? '').split(/\s+/);

  it('holds the photos in a stage that is the width of the column', () => {
    for (const photo of [landscape, areaShaped, cover]) {
      const html = render({ ...commercial, cover: photo, photos: [photo] });
      expect(stageClass(html)).toContain('w-full');
    }
  });

  it('gives the stage one height from 768 up, whatever the photos are', () => {
    // A fixed template: the same stage for a portrait, a landscape and a mixed
    // series, so the plate is one size and nothing moves between projects.
    const heights = [cover, landscape, areaShaped].map((photo) =>
      stageClass(render({ ...commercial, cover: photo, photos: [photo] })).filter(
        (name) => name.startsWith('detail:h-') || name === 'detail:aspect-auto',
      ),
    );
    expect(heights[0]).toEqual(['detail:aspect-auto', 'detail:h-(--stage-h)']);
    for (const each of heights) expect(each).toEqual(heights[0]);
  });

  it('makes the stage the column at 3:4', () => {
    // 100dvh less the 70px of window margin and the 246px of the panel that is
    // not the stage. The floor keeps a short window from squeezing the photo to
    // nothing; the ceiling stops a very tall one blowing it up.
    const html = render(commercial);
    expect(html).toContain('detail:[--stage-h:calc(var(--col)*4/3)]');
  });

  it('works the column out from the window, both ways, so the meta stays in view', () => {
    // The column is the stage's height times 0.8, up to 620px. Title, ✕, stage and
    // meta all take that width, so their edges meet and the ✕ stays where it is.
    const html = render(commercial);
    expect(html).toContain(
      'detail:[--col:clamp(260px,min(calc((100dvh-316px)*0.75),calc(100vw-48px-2*var(--pad))),620px)]',
    );
    expect(html.match(/detail:w-\(--col\)/g)).toHaveLength(3);
    expect(html).not.toContain('detail:w-[620px]');
  });

  it('keeps the mobile height from the tallest frame in the series', () => {
    // Below 768 the photo runs full width and the stage is as tall as the
    // tallest photo would be at that width: the smallest ratio.
    const series = [areaShaped, landscape, cover];
    const html = render({ ...commercial, cover: areaShaped, photos: series });
    const smallest = Math.min(...series.map((photo) => photo.aspectRatio));
    expect(box(html)).toContain(`--ratio:${String(smallest)}`);
    expect(stageClass(html)).toContain('aspect-(--ratio)');
  });

  it('keeps that stage whichever photo of the series is showing', () => {
    const series = [cover, landscape];
    const onFirst = box(render({ ...commercial, cover, photos: series }));
    const onSecond = box(render({ ...commercial, cover: landscape, photos: series }));
    // Otherwise the arrows, centred on the stage, would jump between photos.
    expect(onFirst).toBe(onSecond);
  });

  it('fits each photo inside the stage from its aspect ratio, and centres it', () => {
    // The smaller of the stage's width and its height times the ratio: a
    // portrait is scaled down to fit, a landscape fills the width. Arithmetic on
    // the data, not a measurement (CLAUDE.md rule 3).
    for (const photo of [cover, landscape, areaShaped]) {
      const html = render({ ...commercial, cover: photo, photos: [photo] });
      const ratio = String(photo.aspectRatio);
      expect(html).toContain(`width:min(100cqw, calc(100cqh * ${ratio}))`);
      expect(html).toContain(`aspect-ratio:${ratio}`);
    }
    const html = render({ ...commercial, cover, photos: [cover] });
    expect(html).toContain('absolute inset-0 flex items-center justify-center');
  });

  it('makes the stage a size container, which is what the units above resolve against', () => {
    const html = render({ ...commercial, cover, photos: [cover] });
    expect(box(html)).toContain('container-type:size');
  });

  it('never crops', () => {
    for (const photo of [landscape, areaShaped, cover]) {
      const html = render({ ...commercial, cover: photo, photos: [photo] });
      const imgClass = /<img[^>]*class="([^"]*)"/.exec(html)?.[1] ?? '';
      expect(imgClass.split(/\s+/)).not.toContain('object-cover');
    }
  });

  it('leaves no gutter for the placeholder colour to show in', () => {
    // The wrapper takes the photo's own proportions and the picture fills it, so
    // the element is exactly the picture and dominantColor has nowhere to show.
    const html = render({ ...commercial, cover: landscape, photos: [landscape] });
    const imgClass = /<img[^>]*class="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(imgClass.split(/\s+/)).toEqual(['size-full']);
  });

  it('slides between photos rather than crossfading', () => {
    const html = render({ ...commercial, cover, photos: [cover, landscape] });
    expect(html).toContain('transition-transform');
    expect(html).toContain('translateX(calc(0 * (100% + 24px)))');
    // A gap past a full width, so no sliver of the neighbour shows at the edge.
    expect(html).toContain('translateX(calc(1 * (100% + 24px)))');
    // The photos themselves no longer fade; only the arrows do, on hover.
    const slides = [...html.matchAll(/<div class="absolute inset-0[^"]*"/g)].map(([tag]) => tag);
    expect(slides).toHaveLength(2);
    for (const slide of slides) expect(slide).not.toContain('transition-opacity');
  });
});

describe('DetailOverlay — mobile (UI 09)', () => {
  const html = render(commercial);

  it('is a page of its own below 768, and an overlay above it', () => {
    // Paper by default, the veil only from the detail breakpoint up.
    const dialogClass = /role="dialog"[^>]*class="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(dialogClass.split(/\s+/)).toContain('bg-paper');
    expect(dialogClass.split(/\s+/)).toContain('detail:bg-paper/88');
    // Fills the viewport on mobile, so there is no backdrop left to click; from
    // 768 it is at least a window tall, less the margin that shows the backdrop.
    expect(html).toContain('min-h-full');
    expect(html).toContain('detail:min-h-[calc(100dvh-70px)]');
  });

  it('uses the mobile type sizes and grows them from 768', () => {
    expect(html).toContain('text-[15px] text-ink detail:text-[18px]');
    expect(html).toContain('text-[17px]');
  });

  it('sets the meta under the photo at 14px at every width', () => {
    // Raised from Figma's 12.5px on 5 Oct 2026. One size, so there is no step
    // at 768 and the Client and Credits labels match the lines under them.
    expect(html).toContain('pb-[40px] text-[14px] text-ink');
    expect(html).not.toContain('text-[12.5px]');
    expect(html).not.toContain('detail:text-[12.5px]');
  });

  it('stacks the meta on mobile and lines it up from 768', () => {
    expect(html).toContain('flex flex-col gap-[16px]');
    expect(html).toContain('detail:flex-row');
  });

  it('lets the photo run full width on mobile and into the column from 768', () => {
    expect(html).toContain('detail:mx-auto detail:mt-[21px] detail:w-(--col)');
  });
});

describe('DetailOverlay — the window scrolls, not the plate', () => {
  const tall = { ...cover, id: 'tall', width: 1000, height: 2000, aspectRatio: 0.5 };
  const wide = { ...cover, id: 'wide', width: 2000, height: 1000, aspectRatio: 2 };

  const plateClass = (html: string) =>
    (/<div class="(flex min-h-full flex-col bg-paper[^"]*)"/.exec(html)?.[1] ?? '').split(/\s+/);
  const layerClass = (html: string) =>
    (/<div[^>]*role="dialog"[^>]*class="([^"]*)"/.exec(html)?.[1] ?? '').split(/\s+/);

  it('is at least as tall as the window and grows with the photo', () => {
    // A fixed height with its own scrollbar is what this replaced: the
    // scrollbar sat inside the plate rather than at the edge of the window.
    for (const photo of [tall, wide]) {
      const classes = plateClass(render({ ...commercial, cover: photo, photos: [photo] }));
      expect(classes).toContain('detail:min-h-[calc(100dvh-70px)]');
      expect(classes).toContain('detail:w-[calc(var(--col)+2*var(--pad))]');
      expect(classes).not.toContain('detail:h-[calc(100dvh-70px)]');
      expect(classes).not.toContain('detail:overflow-y-auto');
    }
  });

  it('does not centre the content, so the title and the close button never move', () => {
    // Centred, a landscape project had its title in the middle of the window and
    // a portrait one at the top. The title is a fixed template.
    for (const photo of [tall, wide]) {
      const classes = plateClass(render({ ...commercial, cover: photo, photos: [photo] }));
      expect(classes).not.toContain('detail:justify-center');
      expect(classes).toContain('detail:pt-[48px]');
    }
  });

  it('comes out identical whatever shape the photo is', () => {
    expect(plateClass(render({ ...commercial, cover: tall, photos: [tall] }))).toEqual(
      plateClass(render({ ...commercial, cover: wide, photos: [wide] })),
    );
  });

  it('is the layer behind the plate that scrolls, over the whole window', () => {
    const classes = layerClass(render({ ...commercial, cover: tall, photos: [tall] }));
    expect(classes).toContain('fixed');
    expect(classes).toContain('inset-0');
    expect(classes).toContain('overflow-y-auto');
    expect(classes).not.toContain('detail:overflow-hidden');
  });
});
