import { describe, expect, it, vi } from 'vitest';

import { averageColor, encodeVariant, isWebp, MAX_CONCURRENT_UPLOADS } from './photo-pipeline.ts';

const blob = (type: string) => ({ type }) as Blob;

describe('isWebp', () => {
  it('believes only the type the browser actually reports', () => {
    expect(isWebp(blob('image/webp'))).toBe(true);
    expect(isWebp(blob('image/png'))).toBe(false);
    expect(isWebp(blob(''))).toBe(false);
  });
});

describe('encodeVariant', () => {
  it('uses the canvas when the canvas did the job', async () => {
    const wasm = vi.fn();
    const result = await encodeVariant(800, {
      canvas: () => Promise.resolve(blob('image/webp')),
      wasm,
    });
    expect(result.type).toBe('image/webp');
    expect(wasm).not.toHaveBeenCalled();
  });

  it('falls back when the canvas quietly hands back a PNG', async () => {
    // Safari does exactly this: no error, just the wrong format.
    const wasm = vi.fn(() => Promise.resolve(blob('image/webp')));
    const result = await encodeVariant(800, {
      canvas: () => Promise.resolve(blob('image/png')),
      wasm,
    });
    expect(wasm).toHaveBeenCalledWith(800);
    expect(result.type).toBe('image/webp');
  });

  it('asks the fallback for the same width it was given', async () => {
    const wasm = vi.fn(() => Promise.resolve(blob('image/webp')));
    await encodeVariant(1600, { canvas: () => Promise.resolve(blob('image/png')), wasm });
    expect(wasm).toHaveBeenCalledWith(1600);
  });
});

describe('averageColor', () => {
  it('averages the pixels rather than picking the commonest', () => {
    // Half black, half white — the average is grey, the commonest is a tie.
    const pixels = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
    expect(averageColor(pixels)).toBe('#808080');
  });

  it('pads each channel to two digits', () => {
    expect(averageColor(new Uint8ClampedArray([1, 2, 3, 255]))).toBe('#010203');
  });

  it('gives back a colour even for nothing', () => {
    expect(averageColor(new Uint8ClampedArray([]))).toBe('#000000');
  });

  it('always produces what the schema accepts', () => {
    const pixels = new Uint8ClampedArray([12, 200, 45, 255, 90, 10, 250, 255]);
    expect(averageColor(pixels)).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('upload concurrency', () => {
  it('pushes a few at a time, not everything at once', () => {
    expect(MAX_CONCURRENT_UPLOADS).toBe(3);
  });
});
