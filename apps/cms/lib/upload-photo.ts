import type { Converted } from './browser-image.ts';
import type { Signed } from './presign.ts';

/**
 * Getting one converted photo into the bucket and the database
 * (docs/TECH.md 5).
 *
 * The order matters and is not the obvious one: the row is written first,
 * because the R2 key contains the photo's id and the database is what assigns
 * it. Everything the server does is behind `Api`, so the order, and what
 * happens when a PUT fails halfway through, can be tested without a network.
 */

export type PhotoMeta = {
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: number;
  readonly widths: number[];
  readonly dominantColor: string;
  readonly originalFilename: string;
  readonly bytesOriginal: number;
  readonly bytesWebp: number;
};

export type Api = {
  createPhoto: (meta: PhotoMeta) => Promise<string>;
  presign: (photoId: string) => Promise<Signed[]>;
  put: (url: string, body: Blob, contentType: string) => Promise<void>;
  /** Only ever called to clean up after ourselves. */
  deletePhoto: (photoId: string) => Promise<void>;
};

export const UPLOAD_FAILED = 'Nahrávání se nepovedlo. Zkus fotku nahrát znovu.';

export function photoMeta(
  file: { readonly name: string; readonly size: number },
  converted: Converted,
): PhotoMeta {
  return {
    width: converted.width,
    height: converted.height,
    aspectRatio: converted.aspectRatio,
    widths: converted.widths,
    dominantColor: converted.dominantColor,
    originalFilename: file.name,
    bytesOriginal: file.size,
    bytesWebp: converted.bytesWebp,
  };
}

/**
 * Pairs each signed URL with the blob that belongs at it, original included.
 * The content type comes from the target rather than from the blob: it was
 * signed into the URL, so it is the one R2 will accept.
 */
export function bodies(
  targets: readonly Signed[],
  converted: Converted,
  original: Blob,
): { url: string; body: Blob; contentType: string }[] {
  return targets.flatMap((target) => {
    const body = target.of === 'original' ? original : converted.variants.get(target.of);
    // A target with nothing to put at it is a bug, not a thing to upload empty.
    return body === undefined ? [] : [{ url: target.url, body, contentType: target.contentType }];
  });
}

export async function uploadPhoto(file: File, converted: Converted, api: Api): Promise<string> {
  const photoId = await api.createPhoto(photoMeta(file, converted));
  try {
    const targets = await api.presign(photoId);
    // Serial: three photos are already in flight, each with six files of its own.
    for (const { url, body, contentType } of bodies(targets, converted, file)) {
      await api.put(url, body, contentType);
    }
    return photoId;
  } catch (error) {
    /*
     * A row pointing at bytes that never arrived would show up in the grid as a
     * hole. Better to lose the row and let her drop the file again.
     */
    await api.deletePhoto(photoId).catch(() => {
      // Nothing more to try; the failure below is what she needs to see.
    });
    throw error instanceof Error ? error : new Error(UPLOAD_FAILED);
  }
}
