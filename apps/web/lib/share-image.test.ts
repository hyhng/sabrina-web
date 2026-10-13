import { describe, expect, it } from 'vitest';

import { shareImage, variantFor } from './share-image.ts';

const photo = (id: string, widths: number[], aspectRatio: number) => ({
  id,
  width: 2400,
  height: Math.round(2400 / aspectRatio),
  aspectRatio,
  widths,
  dominantColor: '#000000',
  originalFilename: `${id}.jpg`,
  bytesOriginal: 1,
  bytesWebp: 1,
});

const BASE = 'https://img.example.com';

describe('shareImage', () => {
  const cover = photo('cover', [400, 800, 1200, 1600], 0.75);
  const og = photo('og', [400, 800, 1200, 1600], 1200 / 630);

  it('is the image she uploaded for sharing, at 1200px, with its real size', () => {
    expect(shareImage({ ogImage: og }, [{ cover }], BASE)).toEqual({
      url: 'https://img.example.com/photos/og/1200.webp',
      width: 1200,
      height: 630,
    });
  });

  it('falls back to the first project cover, so a shared link is never bare', () => {
    expect(shareImage({}, [{ cover }], BASE)).toEqual({
      url: 'https://img.example.com/photos/cover/1200.webp',
      width: 1200,
      height: 1600,
    });
  });

  it('is nothing when there is neither', () => {
    expect(shareImage({}, [], BASE)).toBeUndefined();
  });
});

describe('variantFor', () => {
  it('takes the largest variant that is not wider than asked for', () => {
    expect(variantFor({ widths: [1600, 400, 800] })).toBe(800);
    expect(variantFor({ widths: [400, 800, 1200, 1600] })).toBe(1200);
  });

  it('takes the smallest when every variant is wider, rather than none', () => {
    expect(variantFor({ widths: [1600, 2400] })).toBe(1600);
  });
});
