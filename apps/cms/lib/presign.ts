import { originalKey, photoKey } from '@sabrina/shared/photo-url';

/**
 * Signed PUT URLs for one photo's files (docs/TECH.md 5).
 *
 * Every key is derived here from the photo row, never taken from the request.
 * That is the point: a signed URL is a bearer token for writing to the bucket,
 * and a caller who could name the key could sign a write over anything in it.
 *
 * Ten minutes is long enough for a slow connection to push a 40 MB original
 * and short enough that a URL left in a log is worthless by the time anyone
 * reads it.
 */

export const PRESIGN_TTL_SECONDS = 600;

/**
 * Files in R2 are immutable — a new photo means a new id — so they are cached
 * for a year and never revalidated (docs/TECH.md 4.2). This is set on the
 * object at upload time because there is no later chance: nothing rewrites
 * these files afterwards.
 *
 * It is the browser that has to send it. The signature covers the host and
 * nothing else — measured against the real bucket on 1 October — so R2 stores
 * whatever headers arrive with the PUT. Putting it on the command and calling
 * it signed, as this file first did, stored nothing at all.
 */
export const CACHE_CONTROL = 'public, max-age=31536000, immutable';

/** More than the five widths plus the original would mean something is wrong. */
export const MAX_TARGETS = 8;

export type Target = {
  readonly key: string;
  /** The variant this is for, or 'original'. Echoed back so the client can match. */
  readonly of: number | 'original';
  /**
   * What the browser sends as Content-Type. Not enforced by the signature (see
   * CACHE_CONTROL), so this is a convention the upload keeps rather than a
   * guarantee R2 gives — but it is what makes img.<doména> serve the file as an
   * image instead of a download.
   */
  readonly contentType: string;
  /** What the browser sends as Cache-Control; the same for every file. */
  readonly cacheControl: string;
};

export type Signed = Target & { readonly url: string };

export type PhotoRow = {
  readonly id: string | number;
  readonly widths: unknown;
  readonly originalFilename: unknown;
};

/**
 * The files this photo needs in the bucket: one per variant, plus the original
 * she gave us. The original is kept so the site can be rebuilt from it if the
 * variants ever need remaking (docs/TECH.md 4.2).
 */
export function targets(row: PhotoRow): Target[] {
  const widths = Array.isArray(row.widths) ? row.widths : [];
  const id = String(row.id);
  const filename = typeof row.originalFilename === 'string' ? row.originalFilename : 'photo.jpg';

  const variants = widths
    .filter((width): width is number => typeof width === 'number' && Number.isFinite(width))
    .map((width) => ({
      key: photoKey(id, width),
      of: width,
      contentType: 'image/webp',
      cacheControl: CACHE_CONTROL,
    }));

  const key = originalKey(id, filename);
  return [
    ...variants,
    {
      key,
      of: 'original' as const,
      contentType: originalContentType(key),
      cacheControl: CACHE_CONTROL,
    },
  ];
}

/** From the key, which was built here — never from what the browser claimed. */
function originalContentType(key: string): string {
  return key.endsWith('.png') ? 'image/png' : 'image/jpeg';
}

export type Signer = (target: Target) => Promise<string>;

export async function sign(row: PhotoRow, signer: Signer): Promise<Signed[]> {
  const list = targets(row);
  if (list.length > MAX_TARGETS) {
    throw new Error(`Fotka žádá o ${String(list.length)} souborů, což je moc.`);
  }
  return Promise.all(list.map(async (target) => ({ ...target, url: await signer(target) })));
}
