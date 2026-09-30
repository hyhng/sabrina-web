import { describe, expect, it } from 'vitest';

import {
  accept,
  isFinished,
  type Item,
  patch,
  progressLabel,
  readyToStart,
  toRow,
} from './upload-queue.ts';

const jpeg = (name: string, size = 8_200_000) => ({ name, size, type: 'image/jpeg' });

/** A converted 4000px photo, the ordinary case. */
const converted: Item = {
  id: '0-a.jpg',
  filename: 'a.jpg',
  bytesOriginal: 8_200_000,
  stage: 'done',
  width: 4000,
  height: 2667,
  bytesWebp: 310_000,
};

describe('accept', () => {
  it('queues what the browser can convert', () => {
    const items = accept([jpeg('a.jpg'), { name: 'b.png', size: 100, type: 'image/png' }]);
    expect(items.map((item) => item.stage)).toEqual(['queued', 'queued']);
  });

  it('gives a rejected file a row too, with the reason on it', () => {
    // docs/SPEC.md 8.4: TIFF and HEIC are refused with an explanation, not
    // dropped silently.
    const [item] = accept([{ name: 'a.heic', size: 100, type: 'image/heic' }]);
    expect(item?.stage).toBe('rejected');
    expect(item?.message).toContain('JPEG');
  });

  it('keeps two files of the same name apart', () => {
    const items = accept([jpeg('a.jpg'), jpeg('a.jpg')]);
    expect(items[0]?.id).not.toBe(items[1]?.id);
  });
});

describe('readyToStart', () => {
  const queued = (count: number) =>
    accept(Array.from({ length: count }, (_, i) => jpeg(`${String(i)}.jpg`)));

  it('starts three at once and no more', () => {
    // docs/TECH.md 5: more than three queues a large original in front of the rest.
    expect(readyToStart(queued(7))).toHaveLength(3);
  });

  it('counts converting and uploading against the limit alike', () => {
    let items = queued(7);
    items = patch(items, items[0]!.id, { stage: 'converting' });
    items = patch(items, items[1]!.id, { stage: 'uploading' });
    expect(readyToStart(items)).toHaveLength(1);
  });

  it('does not count finished, rejected or failed files as busy', () => {
    let items = queued(5);
    items = patch(items, items[0]!.id, { stage: 'done' });
    items = patch(items, items[1]!.id, { stage: 'failed' });
    items = patch(items, items[2]!.id, { stage: 'rejected' });
    expect(readyToStart(items)).toHaveLength(2);
  });

  it('starts nothing when the slots are full', () => {
    let items = queued(4);
    for (const item of items.slice(0, 3)) items = patch(items, item.id, { stage: 'uploading' });
    expect(readyToStart(items)).toEqual([]);
  });
});

describe('isFinished', () => {
  it('is true only when nothing is still moving', () => {
    let items = accept([jpeg('a.jpg'), jpeg('b.jpg')]);
    expect(isFinished(items)).toBe(false);
    items = patch(items, items[0]!.id, { stage: 'done' });
    expect(isFinished(items)).toBe(false);
    // A file that broke is finished too — it will not move on its own.
    items = patch(items, items[1]!.id, { stage: 'failed' });
    expect(isFinished(items)).toBe(true);
  });
});

describe('toRow', () => {
  it('shows the sizes either side of an arrow, once there are two', () => {
    // docs/SPEC.md 8.4 point 6: "8,2 MB → 310 kB".
    expect(toRow(converted).size).toBe('8,2 MB → 310 kB');
  });

  it('shows the original alone while there is nothing to compare it to', () => {
    const row = toRow({ ...converted, stage: 'converting', bytesWebp: undefined });
    expect(row.size).toBe('8,2 MB');
    expect(row.size).not.toContain('→');
  });

  it('names the three states the spec asks for', () => {
    expect(toRow({ ...converted, stage: 'converting' }).status).toBe('Převádím…');
    expect(toRow(converted).status).toBe('✓ Připraveno');
    expect(toRow({ ...converted, stage: 'failed', message: 'Spadlo to.' }).status).toBe(
      '⚠ Spadlo to.',
    );
  });

  it('gives a broken file a status even with no reason to hand', () => {
    expect(toRow({ ...converted, stage: 'failed', message: undefined }).status).toContain('⚠');
  });

  it('stays quiet about a photo big enough for the detail', () => {
    expect(toRow(converted).warning).toBeUndefined();
  });

  it('warns about a photo that only works in the grid', () => {
    // docs/SPEC.md 8.4 point 7: contextual, and never blocking.
    expect(toRow({ ...converted, width: 1000 }).warning).toContain('detail');
  });

  it('warns harder about a photo too small even for the grid', () => {
    expect(toRow({ ...converted, width: 500 }).warning).toContain('mřížku');
  });

  it('says nothing about resolution before it knows the resolution', () => {
    const row = toRow({ ...converted, stage: 'queued', width: undefined, height: undefined });
    expect(row.resolution).toBe('');
    expect(row.warning).toBeUndefined();
  });

  it('writes the resolution the way a photographer reads it', () => {
    expect(toRow(converted).resolution).toBe('4000 × 2667 px');
  });
});

describe('progressLabel', () => {
  it('counts what is done against what she dropped', () => {
    let items = accept([jpeg('a.jpg'), jpeg('b.jpg'), jpeg('c.jpg')]);
    expect(progressLabel(items)).toBe('0 z 3 hotovo');
    items = patch(items, items[0]!.id, { stage: 'done' });
    expect(progressLabel(items)).toBe('1 z 3 hotovo');
  });

  it('mentions the ones that did not make it, so nothing is lost quietly', () => {
    let items = accept([jpeg('a.jpg'), { name: 'b.heic', size: 10, type: 'image/heic' }]);
    items = patch(items, items[0]!.id, { stage: 'done' });
    expect(progressLabel(items)).toBe('1 z 2 hotovo, 1 neprošlo');
  });
});
