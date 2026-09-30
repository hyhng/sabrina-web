import { describe, expect, it, vi } from 'vitest';

import {
  type Browser,
  COLOR_SAMPLE_WIDTH,
  convert,
  type Decoded,
  variantHeight,
  WASM_QUALITY,
} from './browser-image.ts';

/**
 * A stand-in browser. `canvasType` is the whole point: Safari hands back a PNG
 * from `toBlob('image/webp')` without failing, which is the one behaviour that
 * cannot be tested any other way (docs/TECH.md 5).
 */
function fakeBrowser(image: Decoded, { canvasType = 'image/webp' }: { canvasType?: string } = {}) {
  const browser = {
    decode: () => Promise.resolve(image),
    // Mid-grey everywhere, so the average is knowable.
    pixels: vi.fn((_image: Decoded, width: number) =>
      Promise.resolve(new Uint8ClampedArray(new ArrayBuffer(width * 4)).fill(0x80)),
    ),
    // Size scales with width, the way a real encoder's output does.
    encode: vi.fn((_image: Decoded, width: number) =>
      Promise.resolve(new Blob([new Uint8Array(width)], { type: canvasType })),
    ),
    encodeWasm: vi.fn((_pixels: Uint8ClampedArray<ArrayBuffer>, width: number) =>
      Promise.resolve(new Blob([new Uint8Array(width)], { type: 'image/webp' })),
    ),
    release: vi.fn(),
  };
  return browser satisfies Browser<Decoded>;
}

const landscape = { width: 4000, height: 2667 };

describe('convert', () => {
  it('reads the shape from the decoded bitmap, not from the file', () => {
    // CLAUDE.md rule 3: the ratio comes from the data, never measured later.
    return convert(new Blob(), fakeBrowser(landscape)).then((result) => {
      expect(result.width).toBe(4000);
      expect(result.height).toBe(2667);
      expect(result.aspectRatio).toBeCloseTo(4000 / 2667, 6);
    });
  });

  it('makes every variant up to the original, narrowest first', async () => {
    const result = await convert(new Blob(), fakeBrowser({ width: 1604, height: 1000 }));
    expect(result.widths).toEqual([400, 800, 1200, 1600]);
    expect([...result.variants.keys()]).toEqual([400, 800, 1200, 1600]);
  });

  it('adds the variants up, so the table has an "after" to show', async () => {
    const result = await convert(new Blob(), fakeBrowser({ width: 900, height: 600 }));
    // The fake encoder makes one byte per pixel of width.
    expect(result.bytesWebp).toBe(400 + 800);
  });

  it('averages the pixels for the placeholder colour', async () => {
    const result = await convert(new Blob(), fakeBrowser(landscape));
    expect(result.dominantColor).toBe('#808080');
  });

  it('samples a small square for that colour, not the full-size photo', async () => {
    const browser = fakeBrowser(landscape);
    await convert(new Blob(), browser);
    expect(browser.pixels).toHaveBeenCalledWith(landscape, COLOR_SAMPLE_WIDTH);
  });

  it('trusts the canvas when the canvas produces WebP', async () => {
    const browser = fakeBrowser(landscape);
    await convert(new Blob(), browser);
    expect(browser.encodeWasm).not.toHaveBeenCalled();
    expect(browser.encode).toHaveBeenCalledTimes(5);
  });

  it('falls back to WASM for every variant when the canvas lies', async () => {
    // Safari: toBlob('image/webp') returns a PNG and reports success.
    const browser = fakeBrowser(landscape, { canvasType: 'image/png' });
    const result = await convert(new Blob(), browser);
    expect(browser.encodeWasm).toHaveBeenCalledTimes(5);
    for (const blob of result.variants.values()) {
      expect(blob.type).toBe('image/webp');
    }
  });

  it('hands the WASM encoder the size of the variant, not of the original', async () => {
    const browser = fakeBrowser(landscape, { canvasType: 'image/png' });
    await convert(new Blob(), browser);
    expect(browser.encodeWasm).toHaveBeenCalledWith(expect.anything(), 400, 267);
  });

  it('lets go of the bitmap even when a variant breaks', async () => {
    const browser = fakeBrowser(landscape);
    browser.encode.mockRejectedValueOnce(new Error('canvas too large'));
    await expect(convert(new Blob(), browser)).rejects.toThrow('canvas too large');
    expect(browser.release).toHaveBeenCalledWith(landscape);
  });

  it('gives a photo narrower than the smallest variant one at its own width', async () => {
    const result = await convert(new Blob(), fakeBrowser({ width: 320, height: 320 }));
    expect(result.widths).toEqual([320]);
    expect(result.variants.size).toBe(1);
  });
});

describe('variantHeight', () => {
  it('keeps the photo in proportion', () => {
    expect(variantHeight(400, landscape)).toBe(267);
    expect(variantHeight(4000, landscape)).toBe(2667);
  });

  it('never rounds a very wide panorama down to nothing', () => {
    expect(variantHeight(400, { width: 40_000, height: 1000 })).toBe(10);
    expect(variantHeight(1, { width: 40_000, height: 1000 })).toBe(1);
  });
});

describe('WASM_QUALITY', () => {
  it('is the canvas quality on the scale @jsquash uses', () => {
    expect(WASM_QUALITY).toBe(82);
  });
});
