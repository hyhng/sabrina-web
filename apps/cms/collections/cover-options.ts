/**
 * Which photos may be the cover (docs/SPEC.md 8.3).
 *
 * Only the project's own. Payload would otherwise offer every photo in the
 * database, and picking one from another series would pass validation at the
 * field and fail at the document — a confusing way to find out.
 *
 * A project with no photos yet offers nothing rather than everything: the
 * cover is chosen after uploading, not before.
 */

export type CoverOptions = false | { id: { in: unknown[] } };

export function coverOptions(photos: unknown): CoverOptions {
  if (!Array.isArray(photos) || photos.length === 0) return false;
  const ids = photos.map((photo) =>
    typeof photo === 'object' && photo !== null && 'id' in photo
      ? (photo as { id: unknown }).id
      : photo,
  );
  return { id: { in: ids } };
}
