import { describe, expect, it } from 'vitest';

import {
  detailWidth,
  fieldId,
  idOf,
  idsOf,
  metaFromRecord,
  moveBy,
  moveTo,
  position,
  thumbWidth,
  without,
} from './photo-tiles.ts';

describe('idOf / idsOf', () => {
  it('reads an id however the form happens to hold it', () => {
    expect(idOf(36)).toBe('36');
    expect(idOf('36')).toBe('36');
    expect(idOf({ id: 36, width: 1360 })).toBe('36');
    // Polymorphic relationship shape.
    expect(idOf({ relationTo: 'photos', value: 36 })).toBe('36');
    expect(idOf({ relationTo: 'photos', value: { id: 36 } })).toBe('36');
  });

  it('refuses what is not an id', () => {
    for (const nothing of [undefined, null, '', {}, [], true])
      expect(idOf(nothing)).toBeUndefined();
  });

  it('lists a photo once, in the order it first appears', () => {
    expect(idsOf([36, '37', { id: 36 }, 38, null])).toEqual(['36', '37', '38']);
  });

  it('treats a missing or empty field as an empty list', () => {
    expect(idsOf(undefined)).toEqual([]);
    expect(idsOf(null)).toEqual([]);
    expect(idsOf('36')).toEqual([]);
  });
});

describe('fieldId', () => {
  it('turns a database id back into the integer the field validates against', () => {
    expect(fieldId('36')).toBe(36);
    expect(fieldId('0042')).toBe(42);
  });

  it('leaves anything that is not purely digits alone', () => {
    expect(fieldId('abc-1')).toBe('abc-1');
    expect(fieldId('12abc')).toBe('12abc');
  });
});

describe('metaFromRecord', () => {
  const record = {
    id: 36,
    originalFilename: 'A7402886.jpg',
    width: 1360,
    height: 2040,
    widths: [400, 800, 1200],
    dominantColor: '#2c2d29',
    bytesOriginal: 3_227_568,
    bytesWebp: 698_052,
    alt: null,
  };

  it('reads a Payload photo', () => {
    expect(metaFromRecord(record)).toEqual({
      id: '36',
      filename: 'A7402886.jpg',
      width: 1360,
      height: 2040,
      widths: [400, 800, 1200],
      dominantColor: '#2c2d29',
      bytesOriginal: 3_227_568,
      bytesWebp: 698_052,
    });
  });

  it('keeps alt text only when there is some — Payload sends null for none', () => {
    expect(metaFromRecord(record)).not.toHaveProperty('alt');
    expect(metaFromRecord({ ...record, alt: 'Fog over the lake' })?.alt).toBe('Fog over the lake');
    expect(metaFromRecord({ ...record, alt: '' })).not.toHaveProperty('alt');
  });

  it('gives back nothing for what is not a record', () => {
    expect(metaFromRecord(null)).toBeUndefined();
    expect(metaFromRecord({ width: 1 })).toBeUndefined();
  });

  it('survives a record with holes rather than throwing on them', () => {
    const meta = metaFromRecord({ id: 1 });
    expect(meta?.widths).toEqual([]);
    expect(meta?.filename).toBe('');
  });
});

describe('which variant to show', () => {
  it('picks the smallest that is still sharp at tile size', () => {
    expect(thumbWidth([400, 800, 1200])).toBe(400);
    expect(thumbWidth([1200, 800, 400])).toBe(400);
    expect(thumbWidth([800, 1200])).toBe(800);
  });

  it('falls back to the biggest when nothing reaches the wanted size', () => {
    // A photo narrower than 400 gets one variant at its own width.
    expect(thumbWidth([320])).toBe(320);
    expect(thumbWidth([])).toBeUndefined();
  });

  it('shows the detail at up to 1200, not the 2400 original-sized one', () => {
    expect(detailWidth([400, 800, 1200, 1600, 2400])).toBe(1200);
    expect(detailWidth([400, 800])).toBe(800);
  });

  it('uses the nearest above when every variant is over the limit', () => {
    expect(detailWidth([1600, 2400])).toBe(1600);
    expect(detailWidth([])).toBeUndefined();
  });
});

describe('reordering', () => {
  const ids = ['a', 'b', 'c', 'd'];

  it('drops a photo where another one is, shifting the rest', () => {
    expect(moveTo(ids, 'a', 'c')).toEqual(['b', 'c', 'a', 'd']);
    expect(moveTo(ids, 'd', 'b')).toEqual(['a', 'd', 'b', 'c']);
  });

  it('leaves the order alone for a move that goes nowhere or names a stranger', () => {
    expect(moveTo(ids, 'b', 'b')).toEqual(ids);
    expect(moveTo(ids, 'zzz', 'a')).toEqual(ids);
    expect(moveTo(ids, 'a', 'zzz')).toEqual(ids);
  });

  it('never mutates what it was given', () => {
    const before = [...ids];
    moveTo(ids, 'a', 'd');
    moveBy(ids, 'b', 1);
    expect(ids).toEqual(before);
  });

  it('steps one place and stops at the ends', () => {
    expect(moveBy(ids, 'b', -1)).toEqual(['b', 'a', 'c', 'd']);
    expect(moveBy(ids, 'b', 1)).toEqual(['a', 'c', 'b', 'd']);
    expect(moveBy(ids, 'a', -1)).toEqual(ids);
    expect(moveBy(ids, 'd', 1)).toEqual(ids);
  });

  it('removes a photo', () => {
    expect(without(ids, 'c')).toEqual(['a', 'b', 'd']);
    expect(without(ids, 'zzz')).toEqual(ids);
  });

  it('says where a photo stands', () => {
    expect(position(ids, 'c')).toBe('3 z 4');
    expect(position(ids, 'zzz')).toBe('');
  });
});
