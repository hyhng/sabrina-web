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

/** More than the five widths plus the original would mean something is wrong. */
export const MAX_TARGETS = 8;

export type Target = {
  readonly key: string;
  /** The variant this is for, or 'original'. Echoed back so the client can match. */
  readonly of: number | 'original';
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
    .map((width) => ({ key: photoKey(id, width), of: width }));

  return [...variants, { key: originalKey(id, filename), of: 'original' as const }];
}

export type Signer = (key: string) => Promise<string>;

export async function sign(row: PhotoRow, signer: Signer): Promise<Signed[]> {
  const list = targets(row);
  if (list.length > MAX_TARGETS) {
    throw new Error(`Fotka žádá o ${String(list.length)} souborů, což je moc.`);
  }
  return Promise.all(list.map(async (target) => ({ ...target, url: await signer(target.key) })));
}
