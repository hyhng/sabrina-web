import { slugify } from '@sabrina/shared/slug';

/**
 * How a project's address behaves (docs/SPEC.md 8.3).
 *
 * While the project is a draft the address follows the title, so renaming
 * before anyone has seen it just works. The first time it is published the
 * address freezes: it is what links point at, and a published URL that stops
 * resolving is worse than an address that no longer matches the title.
 *
 * Kept as plain functions so the rule can be tested without a database.
 */

export interface SlugState {
  title?: unknown;
  slug?: unknown;
  slugLocked?: unknown;
}

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined;

export function isLocked(data: SlugState | undefined, original: SlugState | undefined): boolean {
  return data?.slugLocked === true || original?.slugLocked === true;
}

/** The address a save should end up with. */
export function nextSlug(
  data: SlugState | undefined,
  original: SlugState | undefined,
): string | undefined {
  if (isLocked(data, original)) {
    // Frozen: whatever it already was, never what the title now says.
    return text(original?.slug) ?? text(data?.slug);
  }
  const title = text(data?.title) ?? text(original?.title);
  return title === undefined ? text(data?.slug) : slugify(title);
}

/** Publishing is what locks it, and only ever in that direction. */
export function locksOnPublish(status: unknown): boolean {
  return status === 'published';
}
