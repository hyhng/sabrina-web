import { describe, expect, it, vi } from 'vitest';

import type { Converted } from './browser-image.ts';
import type { Signed } from './presign.ts';
import { type Api, bodies, photoMeta, uploadPhoto } from './upload-photo.ts';

const variant = (width: number) => new Blob([new Uint8Array(width)], { type: 'image/webp' });

const converted: Converted = {
  width: 900,
  height: 600,
  aspectRatio: 1.5,
  dominantColor: '#808080',
  widths: [400, 800],
  variants: new Map([
    [400, variant(400)],
    [800, variant(800)],
  ]),
  bytesWebp: 1200,
};

const file = new File([new Uint8Array(8200)], 'DSC_0041.JPG', { type: 'image/jpeg' });

const CACHE = 'public, max-age=31536000, immutable';

const signed: Signed[] = [
  {
    key: 'photos/7/400.webp',
    of: 400,
    contentType: 'image/webp',
    cacheControl: CACHE,
    url: 'https://r2/400',
  },
  {
    key: 'photos/7/800.webp',
    of: 800,
    contentType: 'image/webp',
    cacheControl: CACHE,
    url: 'https://r2/800',
  },
  {
    key: 'originals/7.jpg',
    of: 'original',
    contentType: 'image/jpeg',
    cacheControl: CACHE,
    url: 'https://r2/original',
  },
];

/** Each method is a mock, so a test can make any one of them fail. */
function fakeApi() {
  const api = {
    createPhoto: vi.fn(() => Promise.resolve('7')),
    presign: vi.fn(() => Promise.resolve(signed)),
    put: vi.fn(() => Promise.resolve()),
    deletePhoto: vi.fn(() => Promise.resolve()),
  };
  return api satisfies Api;
}

describe('photoMeta', () => {
  it('records what the browser worked out, so the grid never measures again', () => {
    // CLAUDE.md rule 3.
    expect(photoMeta(file, converted)).toEqual({
      width: 900,
      height: 600,
      aspectRatio: 1.5,
      widths: [400, 800],
      dominantColor: '#808080',
      originalFilename: 'DSC_0041.JPG',
      bytesOriginal: 8200,
      bytesWebp: 1200,
    });
  });
});

describe('bodies', () => {
  it('puts each variant at its own URL and the file itself at the original', () => {
    const paired = bodies(signed, converted, file);
    expect(paired.map((entry) => entry.url)).toEqual([
      'https://r2/400',
      'https://r2/800',
      'https://r2/original',
    ]);
    expect(paired.at(-1)?.body).toBe(file);
  });

  it('sends the type and the caching from the target, not from the blob', () => {
    /*
     * Neither header is part of the signature — measured against the real
     * bucket — so R2 stores exactly what the browser sends. Whatever is not sent
     * here is simply not there: a photo with no Cache-Control is re-downloaded on
     * every visit.
     */
    expect(bodies(signed, converted, file).map((entry) => entry.headers)).toEqual([
      { 'Content-Type': 'image/webp', 'Cache-Control': CACHE },
      { 'Content-Type': 'image/webp', 'Cache-Control': CACHE },
      { 'Content-Type': 'image/jpeg', 'Cache-Control': CACHE },
    ]);
  });

  it('skips a target with no blob rather than uploading nothing to it', () => {
    const extra = [
      ...signed,
      {
        key: 'photos/7/2400.webp',
        of: 2400 as const,
        contentType: 'image/webp',
        cacheControl: CACHE,
        url: 'https://r2/x',
      },
    ];
    expect(bodies(extra, converted, file)).toHaveLength(3);
  });
});

describe('uploadPhoto', () => {
  it('writes the row before the bytes, because the key needs its id', async () => {
    const api = fakeApi();
    const order: string[] = [];
    api.createPhoto.mockImplementation(() => {
      order.push('create');
      return Promise.resolve('7');
    });
    api.presign.mockImplementation(() => {
      order.push('presign');
      return Promise.resolve(signed);
    });
    api.put.mockImplementation(() => {
      order.push('put');
      return Promise.resolve();
    });

    await expect(uploadPhoto(file, converted, api)).resolves.toBe('7');
    expect(order).toEqual(['create', 'presign', 'put', 'put', 'put']);
  });

  it('presigns for the row it just created', async () => {
    const api = fakeApi();
    await uploadPhoto(file, converted, api);
    expect(api.presign).toHaveBeenCalledWith('7');
  });

  it('sends each file with its own type and the caching the target asks for', async () => {
    const api = fakeApi();
    await uploadPhoto(file, converted, api);
    expect(api.put).toHaveBeenNthCalledWith(1, 'https://r2/400', expect.anything(), {
      'Content-Type': 'image/webp',
      'Cache-Control': CACHE,
    });
    expect(api.put).toHaveBeenNthCalledWith(3, 'https://r2/original', file, {
      'Content-Type': 'image/jpeg',
      'Cache-Control': CACHE,
    });
  });

  it('takes the row back down when a PUT fails', async () => {
    // A row pointing at bytes that never arrived is a hole in the grid.
    const api = fakeApi();
    api.put.mockRejectedValue(new Error('503 from R2'));
    await expect(uploadPhoto(file, converted, api)).rejects.toThrow('503 from R2');
    expect(api.deletePhoto).toHaveBeenCalledWith('7');
  });

  it('takes it back down when presigning fails too', async () => {
    const api = fakeApi();
    api.presign.mockRejectedValue(new Error('503'));
    await expect(uploadPhoto(file, converted, api)).rejects.toThrow();
    expect(api.deletePhoto).toHaveBeenCalledWith('7');
  });

  it('still reports the upload failure when the cleanup also fails', async () => {
    const api = fakeApi();
    api.put.mockRejectedValue(new Error('503 from R2'));
    api.deletePhoto.mockRejectedValue(new Error('and the delete broke'));
    // What she needs to see is that the photo did not go up.
    await expect(uploadPhoto(file, converted, api)).rejects.toThrow('503 from R2');
  });

  it('never deletes anything when the upload works', async () => {
    const api = fakeApi();
    await uploadPhoto(file, converted, api);
    expect(api.deletePhoto).not.toHaveBeenCalled();
  });

  it('stops at the first broken PUT instead of pushing the rest', async () => {
    const api = fakeApi();
    api.put
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('503 from R2'))
      .mockResolvedValue(undefined);
    await expect(uploadPhoto(file, converted, api)).rejects.toThrow();
    expect(api.put).toHaveBeenCalledTimes(2);
  });
});
