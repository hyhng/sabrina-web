import { describe, expect, it, vi } from 'vitest';

import type { Browser, Decoded } from './browser-image.ts';
import { CONVERT_FAILED, handleConvert } from './upload-protocol.ts';

const working: Browser<Decoded> = {
  decode: () => Promise.resolve({ width: 800, height: 600 }),
  pixels: (_image, width) =>
    Promise.resolve(new Uint8ClampedArray(new ArrayBuffer(width * 4)).fill(0x40)),
  encode: (_image, width) =>
    Promise.resolve(new Blob([new Uint8Array(width)], { type: 'image/webp' })),
  encodeWasm: (_pixels, width) =>
    Promise.resolve(new Blob([new Uint8Array(width)], { type: 'image/webp' })),
};

describe('handleConvert', () => {
  it('answers about the row that asked', async () => {
    const response = await handleConvert({ id: '3-a.jpg', file: new Blob() }, working);
    expect(response.id).toBe('3-a.jpg');
    expect(response.ok).toBe(true);
  });

  it('carries the conversion back whole', async () => {
    const response = await handleConvert({ id: '0-a.jpg', file: new Blob() }, working);
    expect(response.ok && response.converted.widths).toEqual([400, 800]);
    expect(response.ok && response.converted.variants.size).toBe(2);
  });

  it('turns a broken conversion into one row failing, not the worker dying', async () => {
    const broken: Browser<Decoded> = {
      ...working,
      decode: vi.fn(() => Promise.reject(new Error('The source image cannot be decoded.'))),
    };
    const response = await handleConvert({ id: '0-a.jpg', file: new Blob() }, broken);
    expect(response.ok).toBe(false);
    expect(response.ok === false && response.message).toBe(CONVERT_FAILED);
  });

  it('keeps the browser’s own wording out of the admin', async () => {
    const broken: Browser<Decoded> = {
      ...working,
      encode: () => Promise.reject(new Error('canvas exceeds the maximum size')),
    };
    const response = await handleConvert({ id: '0-a.jpg', file: new Blob() }, broken);
    // True, and no use to her.
    expect(response.ok === false && response.message).not.toContain('canvas');
    expect(response.ok === false && response.message).toContain('JPEG');
  });
});
