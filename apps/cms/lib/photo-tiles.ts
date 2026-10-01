import { photoUrl } from '@sabrina/shared/photo-url';

/**
 * What the photo grid needs to know about a photo, and the arithmetic of
 * reordering it (docs/SPEC.md 8.3).
 *
 * Pure on purpose. The grid itself is React and Payload; the parts that can be
 * wrong — which variant to show, how an id arrives from a form, where a photo
 * ends up after a move — are not, and are worth testing without either.
 */

export type PhotoMeta = {
  readonly id: string;
  readonly filename: string;
  readonly width: number;
  readonly height: number;
  readonly widths: readonly number[];
  readonly dominantColor: string;
  readonly bytesOriginal: number;
  readonly bytesWebp: number;
  readonly alt?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * An id as the form holds it. A relationship value arrives as a bare id, as a
 * populated document, or — for a polymorphic field — as `{ relationTo, value }`,
 * and which one depends on where the form state came from. Everything is
 * compared as a string from here on.
 */
export function idOf(value: unknown): string | undefined {
  if (typeof value === 'string' && value !== '') return value;
  if (typeof value === 'number') return String(value);
  if (isRecord(value)) {
    if ('id' in value) return idOf(value.id);
    if ('value' in value) return idOf(value.value);
  }
  return undefined;
}

export function idsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const entry of value) {
    const id = idOf(entry);
    // A photo listed twice would be two tiles with one identity.
    if (id !== undefined && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Back to what the field wants. The database ids are integers, and a numeric
 * string is not the same thing to a relationship's validation.
 */
export function fieldId(id: string): string | number {
  return /^\d+$/.test(id) ? Number(id) : id;
}

/** From a Payload record, or undefined if it is not one. */
export function metaFromRecord(record: unknown): PhotoMeta | undefined {
  if (!isRecord(record)) return undefined;
  const id = idOf(record.id);
  if (id === undefined) return undefined;
  const widths = Array.isArray(record.widths)
    ? record.widths.filter((w): w is number => typeof w === 'number')
    : [];
  return {
    id,
    filename: typeof record.originalFilename === 'string' ? record.originalFilename : '',
    width: typeof record.width === 'number' ? record.width : 0,
    height: typeof record.height === 'number' ? record.height : 0,
    widths,
    dominantColor: typeof record.dominantColor === 'string' ? record.dominantColor : '#cccccc',
    bytesOriginal: typeof record.bytesOriginal === 'number' ? record.bytesOriginal : 0,
    bytesWebp: typeof record.bytesWebp === 'number' ? record.bytesWebp : 0,
    ...(typeof record.alt === 'string' && record.alt !== '' ? { alt: record.alt } : {}),
  };
}

/** The smallest variant that is still sharp at the size of a tile. */
export function thumbWidth(widths: readonly number[], wanted = 400): number | undefined {
  const sorted = [...widths].sort((a, b) => a - b);
  return sorted.find((width) => width >= wanted) ?? sorted.at(-1);
}

/** What the detail shows: the biggest variant up to 1200, else the nearest above. */
export function detailWidth(widths: readonly number[], limit = 1200): number | undefined {
  const sorted = [...widths].sort((a, b) => a - b);
  const fitting = sorted.filter((width) => width <= limit);
  return fitting.at(-1) ?? sorted[0];
}

export function variantSrc(
  meta: PhotoMeta,
  pick: (widths: readonly number[]) => number | undefined,
  imgBase: string,
): string | undefined {
  const width = pick(meta.widths);
  return width === undefined ? undefined : photoUrl(meta.id, width, imgBase);
}

/** Moves `id` to where `target` is. Anything unknown leaves the order alone. */
export function moveTo(ids: readonly string[], id: string, target: string): string[] {
  const from = ids.indexOf(id);
  const to = ids.indexOf(target);
  if (from === -1 || to === -1 || from === to) return [...ids];
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}

/** One step either way; stops at the ends rather than wrapping. */
export function moveBy(ids: readonly string[], id: string, delta: -1 | 1): string[] {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= ids.length) return [...ids];
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}

export function without(ids: readonly string[], id: string): string[] {
  return ids.filter((entry) => entry !== id);
}

/** "3 z 8", for a screen reader and for the order badge. */
export function position(ids: readonly string[], id: string): string {
  const index = ids.indexOf(id);
  return index === -1 ? '' : `${String(index + 1)} z ${String(ids.length)}`;
}
