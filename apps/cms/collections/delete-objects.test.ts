import { describe, expect, it, vi } from 'vitest';

import { orphanWarning, removeObjects } from './delete-objects.ts';

const row = { id: 17, widths: [400, 800], originalFilename: 'DSC_0041.JPG' };

describe('removeObjects', () => {
  it('removes exactly what the upload put there', async () => {
    const remove = vi.fn(() => Promise.resolve());
    const outcome = await removeObjects(row, remove, 'unused');
    expect(remove).toHaveBeenCalledWith([
      'photos/17/400.webp',
      'photos/17/800.webp',
      'originals/17.jpg',
    ]);
    expect(outcome).toEqual({
      removed: ['photos/17/400.webp', 'photos/17/800.webp', 'originals/17.jpg'],
    });
  });

  it('reports what is left when R2 is not set up', async () => {
    const outcome = await removeObjects(row, undefined, 'v .env chybí R2_BUCKET');
    expect('left' in outcome && outcome.left).toHaveLength(3);
    expect('left' in outcome && outcome.reason).toContain('R2_BUCKET');
  });

  it('reports what is left when the delete fails, with the reason', async () => {
    const outcome = await removeObjects(
      row,
      () => Promise.reject(new Error('AccessDenied')),
      'fallback',
    );
    expect('left' in outcome && outcome.reason).toBe('AccessDenied');
  });

  it('never throws — the row is already gone by the time it runs', async () => {
    // An afterDelete hook cannot refuse anything; throwing would only confuse.
    await expect(
      removeObjects(row, () => Promise.reject(new Error('boom')), 'x'),
    ).resolves.toBeDefined();
  });
});

describe('orphanWarning', () => {
  it('names the keys and the reason, so they can be swept by hand', () => {
    const warning = orphanWarning(['photos/17/400.webp', 'originals/17.jpg'], 'AccessDenied');
    expect(warning).toContain('2 object(s)');
    expect(warning).toContain('AccessDenied');
    // The keys themselves, or nobody can find them again.
    expect(warning).toContain('photos/17/400.webp');
    expect(warning).toContain('originals/17.jpg');
  });
});
