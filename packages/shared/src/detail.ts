/**
 * Project detail geometry (docs/SPEC.md 4.1, Figma UI 05 and UI 05B).
 *
 * The photo sits in a fixed 620 × 740 area. A photo close enough to that
 * shape fills it and takes the small crop, which the design signs off on.
 * Anything further away — a landscape frame above all — is fitted inside the
 * area and centred, leaving the title, meta and arrows exactly where they were.
 */

export const DETAIL_AREA = { width: 620, height: 740 } as const;

export const DETAIL_AREA_RATIO = DETAIL_AREA.width / DETAIL_AREA.height;

/**
 * How far a photo's aspect ratio may sit from the area's before it is fitted
 * rather than cropped. docs/SPEC.md 4.1 puts it at about 8%.
 */
export const COVER_TOLERANCE = 0.08;

export type PhotoFit = 'cover' | 'contain';

export function photoFit(aspectRatio: number): PhotoFit {
  if (!(aspectRatio > 0)) {
    throw new RangeError(`aspectRatio must be positive, got ${aspectRatio}`);
  }
  const difference = Math.abs(aspectRatio - DETAIL_AREA_RATIO) / DETAIL_AREA_RATIO;
  return difference <= COVER_TOLERANCE ? 'cover' : 'contain';
}
