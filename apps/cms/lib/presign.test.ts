import { describe, expect, it, vi } from 'vitest';

import { MAX_TARGETS, PRESIGN_TTL_SECONDS, sign, type Target, targets } from './presign.ts';

const row = { id: 17, widths: [400, 800, 1200], originalFilename: 'DSC_0041.JPG' };

describe('targets', () => {
  it('asks for one file per variant plus the original', () => {
    expect(targets(row).map((target) => target.key)).toEqual([
      'photos/17/400.webp',
      'photos/17/800.webp',
      'photos/17/1200.webp',
      'originals/17.jpg',
    ]);
  });

  it('builds every key from the row, never from anything a caller sent', () => {
    // A signed PUT is a bearer token for writing to the bucket.
    for (const target of targets({ ...row, id: 17 })) {
      expect(target.key).toMatch(/^(photos\/17\/|originals\/17\.)/);
    }
  });

  it('says which variant each URL is for, so the client can match them up', () => {
    expect(targets(row).map((target) => target.of)).toEqual([400, 800, 1200, 'original']);
  });

  it('survives a row whose widths never got written', () => {
    // Still asks for the original: without it the photo is unrecoverable.
    expect(targets({ ...row, widths: undefined }).map((t) => t.of)).toEqual(['original']);
    expect(targets({ ...row, widths: 'nonsense' }).map((t) => t.of)).toEqual(['original']);
  });

  it('ignores anything in widths that is not a width', () => {
    const keys = targets({ ...row, widths: [400, '800', null, 1200] }).map((t) => t.key);
    expect(keys).toEqual(['photos/17/400.webp', 'photos/17/1200.webp', 'originals/17.jpg']);
  });

  it('gives every variant the WebP type, signed into the URL', () => {
    // Without it R2 would serve the file as a download rather than an image.
    for (const target of targets(row).filter((t) => t.of !== 'original')) {
      expect(target.contentType).toBe('image/webp');
    }
  });

  it('types the original from the key it built, not from what a caller claimed', () => {
    expect(targets({ ...row, originalFilename: 'a.PNG' }).at(-1)?.contentType).toBe('image/png');
    expect(targets({ ...row, originalFilename: 'a.jpeg' }).at(-1)?.contentType).toBe('image/jpeg');
    expect(targets({ ...row, originalFilename: 'no-extension' }).at(-1)?.contentType).toBe(
      'image/jpeg',
    );
  });

  it('keeps the original extension, lowercased', () => {
    expect(targets({ ...row, originalFilename: 'a.PNG' }).at(-1)?.key).toBe('originals/17.png');
    expect(targets({ ...row, originalFilename: 'no-extension' }).at(-1)?.key).toBe(
      'originals/17.jpg',
    );
  });
});

describe('sign', () => {
  it('signs every key and hands the URLs back beside what they are for', async () => {
    const signer = vi.fn((target: Target) =>
      Promise.resolve(`https://r2.example/${target.key}?sig=x`),
    );
    const signed = await sign(row, signer);
    expect(signer).toHaveBeenCalledTimes(4);
    expect(signed[0]).toEqual({
      key: 'photos/17/400.webp',
      of: 400,
      contentType: 'image/webp',
      url: 'https://r2.example/photos/17/400.webp?sig=x',
    });
  });

  it('refuses a row asking for an implausible number of files', async () => {
    const many = { ...row, widths: Array.from({ length: MAX_TARGETS }, (_, i) => 100 + i) };
    await expect(sign(many, () => Promise.resolve('x'))).rejects.toThrow('moc');
  });
});

describe('PRESIGN_TTL_SECONDS', () => {
  it('is the ten minutes docs/TECH.md 5 asks for', () => {
    expect(PRESIGN_TTL_SECONDS).toBe(600);
  });
});
