import { describe, expect, it } from 'vitest';

import { COVER_TOLERANCE, DETAIL_AREA, DETAIL_AREA_RATIO, photoFit } from './detail.ts';

describe('photoFit', () => {
  it('crops a photo shaped like the area', () => {
    expect(photoFit(DETAIL_AREA_RATIO)).toBe('cover');
    expect(photoFit(620 / 740)).toBe('cover');
  });

  it('crops inside the tolerance and fits past it', () => {
    // Not tested exactly on the boundary: at 1 ± COVER_TOLERANCE the
    // comparison lands on floating-point noise, which is not a useful promise.
    expect(photoFit(DETAIL_AREA_RATIO * 1.07)).toBe('cover');
    expect(photoFit(DETAIL_AREA_RATIO * 0.93)).toBe('cover');
    expect(photoFit(DETAIL_AREA_RATIO * 1.09)).toBe('contain');
    expect(photoFit(DETAIL_AREA_RATIO * 0.91)).toBe('contain');
    expect(COVER_TOLERANCE).toBe(0.08);
  });

  it('fits a landscape photo — cropping it would lose almost half (UI 05B)', () => {
    // Soda — Outdoor, 401:267.
    expect(photoFit(401 / 267)).toBe('contain');
  });

  it('fits the seed portraits, which are tile crops at 401:535', () => {
    // 10.5% from the area ratio, outside the 8% the spec allows.
    expect(photoFit(401 / 535)).toBe('contain');
  });

  it('fits anything extreme rather than cropping most of it away', () => {
    expect(photoFit(0.5)).toBe('contain');
    expect(photoFit(3)).toBe('contain');
  });

  it('rejects a nonsense ratio instead of laying out garbage', () => {
    expect(() => photoFit(0)).toThrow(RangeError);
    expect(() => photoFit(-1)).toThrow(RangeError);
    expect(DETAIL_AREA).toEqual({ width: 620, height: 740 });
  });
});
