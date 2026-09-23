import type { Photo as PhotoData } from '@sabrina/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { GRID_SIZES, Photo } from './Photo.tsx';

const photo: PhotoData = {
  id: 'fog',
  width: 1604,
  height: 2140,
  aspectRatio: 1604 / 2140,
  widths: [400, 800, 1200, 1600],
  dominantColor: '#1c2020',
  originalFilename: 'fog.png',
  bytesOriginal: 1_080_946,
  bytesWebp: 103_654,
};

const render = (element: React.ReactElement) => renderToStaticMarkup(element);

describe('Photo', () => {
  it('lists every variant in srcset', () => {
    const html = render(<Photo photo={photo} imgBase="/seed" />);
    for (const width of photo.widths) {
      expect(html).toContain(`/seed/photos/fog/${width}.webp ${width}w`);
    }
  });

  it('carries the intrinsic size and aspect ratio so nothing reflows', () => {
    const html = render(<Photo photo={photo} imgBase="/seed" />);
    expect(html).toContain('width="1604"');
    expect(html).toContain('height="2140"');
    expect(html).toContain('aspect-ratio:1604 / 2140');
  });

  it('paints the average colour behind the photo', () => {
    expect(render(<Photo photo={photo} imgBase="/seed" />)).toContain('background-color:#1c2020');
  });

  it('is lazy by default and eager when it is above the fold', () => {
    const lazy = render(<Photo photo={photo} imgBase="/seed" />);
    expect(lazy).toContain('loading="lazy"');
    expect(lazy).not.toContain('rel="preload"');

    const eager = render(<Photo photo={photo} imgBase="/seed" priority />);
    expect(eager).toContain('loading="eager"');
    // React normalises to camelCase in markup; HTML attributes are case-insensitive.
    expect(eager).toContain('fetchPriority="high"');
  });

  it('lets React hoist a preload link for the LCP photo', () => {
    // docs/SPEC.md 9.1 wants the first photo fetched as early as possible.
    const eager = render(<Photo photo={photo} imgBase="/seed" priority />);
    expect(eager).toContain('rel="preload"');
    expect(eager).toContain('as="image"');
    expect(eager).toContain('imageSrcSet="/seed/photos/fog/400.webp 400w');
  });

  it('uses the grid sizes unless told otherwise', () => {
    expect(render(<Photo photo={photo} imgBase="/seed" />)).toContain('(min-width: 1024px)');
    expect(render(<Photo photo={photo} imgBase="/seed" sizes="620px" />)).toContain(
      'sizes="620px"',
    );
    expect(GRID_SIZES).toContain('calc((100vw - 236px) / 3)');
  });

  it('prefers an explicit alt, then the photo alt, then empty', () => {
    expect(render(<Photo photo={photo} imgBase="/seed" alt="Fog — photo 1" />)).toContain(
      'alt="Fog — photo 1"',
    );
    expect(render(<Photo photo={{ ...photo, alt: 'from cms' }} imgBase="/seed" />)).toContain(
      'alt="from cms"',
    );
    expect(render(<Photo photo={photo} imgBase="/seed" />)).toContain('alt=""');
  });
});

describe('Photo — eager vs priority', () => {
  it('can be eager without claiming high priority', () => {
    const html = render(<Photo photo={photo} imgBase="/seed" eager />);
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchPriority="auto"');
  });

  it('preloads anything that is not lazy, and ranks only the LCP photo high', () => {
    // React 19 hoists a preload link for every non-lazy <img>; omitting the
    // loading attribute does not avoid it. So the first few tiles are all
    // preloaded and fetchPriority is what separates the LCP photo from the
    // rest (docs/SPEC.md 9.1).
    expect(render(<Photo photo={photo} imgBase="/seed" eager />)).toContain('rel="preload"');
    expect(render(<Photo photo={photo} imgBase="/seed" priority />)).toContain('rel="preload"');
    expect(render(<Photo photo={photo} imgBase="/seed" />)).not.toContain('rel="preload"');
  });
});
