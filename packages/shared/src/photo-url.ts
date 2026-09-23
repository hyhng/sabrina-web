import type { Photo } from './schema.ts';

/**
 * R2 keys and public URLs for photos (docs/TECH.md 4.2).
 *
 * Files are immutable — a new photo means a new id — so everything under
 * img.<domain> is cached forever. The <img> is a plain one with a srcset built
 * from the variants that actually exist; no next/image, because the variants
 * are pre-generated and the static export cannot run the default loader.
 */

/** Variant widths produced in the browser on upload (docs/SPEC.md 8.4). */
export const WEBP_WIDTHS = [400, 800, 1200, 1600, 2400] as const;

export function photoKey(photoId: string, width: number): string {
  return `photos/${photoId}/${width}.webp`;
}

export function originalKey(photoId: string, originalFilename: string): string {
  const dot = originalFilename.lastIndexOf('.');
  const extension = dot > 0 ? originalFilename.slice(dot + 1).toLowerCase() : 'jpg';
  return `originals/${photoId}.${extension}`;
}

function join(imgBase: string, key: string): string {
  return `${imgBase.replace(/\/+$/, '')}/${key}`;
}

export function photoUrl(photoId: string, width: number, imgBase: string): string {
  return join(imgBase, photoKey(photoId, width));
}

export function originalUrl(
  photo: Pick<Photo, 'id' | 'originalFilename'>,
  imgBase: string,
): string {
  return join(imgBase, originalKey(photo.id, photo.originalFilename));
}

/** Widest generated variant — the plain `src`, for browsers that ignore srcset. */
export function photoSrc(photo: Pick<Photo, 'id' | 'widths'>, imgBase: string): string {
  const widest = Math.max(...photo.widths);
  return photoUrl(photo.id, widest, imgBase);
}

/** `srcset` listing every variant that exists for this photo, narrowest first. */
export function photoSrcSet(photo: Pick<Photo, 'id' | 'widths'>, imgBase: string): string {
  return [...photo.widths]
    .sort((a, b) => a - b)
    .map((width) => `${photoUrl(photo.id, width, imgBase)} ${width}w`)
    .join(', ');
}
