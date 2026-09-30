import { WEBP_WIDTHS } from './photo-url.ts';

/**
 * The rules the admin's upload follows (docs/SPEC.md 8.4).
 *
 * Kept here rather than inside the upload component so they can be tested
 * without a browser, and so the thresholds are named numbers instead of
 * magic ones buried in a progress table.
 *
 * Messages are Czech: the admin is hers, the public site is English.
 */

/** What a camera export should be. Anything else is asked to be converted. */
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png'] as const;

/** docs/SPEC.md 8.4. High enough to stay sharp, low enough to stay small. */
export const WEBP_QUALITY = 0.82;

export type Accepted = { ok: true } | { ok: false; message: string };

export function acceptFile(type: string): Accepted {
  if ((ACCEPTED_TYPES as readonly string[]).includes(type)) return { ok: true };
  return {
    ok: false,
    // Says what to do about it, not just what went wrong (docs/SPEC.md 8.8).
    message: 'Tenhle formát neumím zpracovat. Exportuj fotku prosím jako JPEG.',
  };
}

/**
 * Which variants to make. Never wider than the original — enlarging a photo
 * only makes a bigger file out of the same detail.
 *
 * A photo narrower than the narrowest variant gets one at its own width.
 * [návrh] docs/SPEC.md 8.4 does not say what happens below 400 px, and the
 * alternatives are worse: no variant at all leaves the site with nothing to
 * serve, and refusing the upload contradicts "publikovat jde i s varováním".
 * The low-resolution warning already says it will look bad.
 */
export function variantWidths(originalWidth: number): number[] {
  const fitting = WEBP_WIDTHS.filter((width) => width <= originalWidth);
  return fitting.length > 0 ? fitting : [Math.max(1, Math.round(originalWidth))];
}

/**
 * [návrh] The thresholds are the rendered sizes doubled, for a retina screen:
 * the detail column is 620 and the grid column 401.
 */
export const DETAIL_MIN_WIDTH = 1240;
export const GRID_MIN_WIDTH = 800;

export type ResolutionWarning = { level: 'detail' | 'grid'; message: string };

/**
 * The only warning the upload gives (docs/SPEC.md 8.4). It never blocks
 * publishing — it says what the photo will and will not carry.
 */
export function resolutionWarning(width: number): ResolutionWarning | null {
  if (width < GRID_MIN_WIDTH) {
    return { level: 'grid', message: 'Málo i pro mřížku — fotka bude rozmazaná.' };
  }
  if (width < DETAIL_MIN_WIDTH) {
    return { level: 'detail', message: 'Málo pro detail — v mřížce OK.' };
  }
  return null;
}

/** "8,2 MB → 310 kB" for the upload table (docs/SPEC.md 8.4). */
export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${String(bytes)} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} kB`;
  return `${(bytes / 1_000_000).toFixed(1).replace('.', ',')} MB`;
}
