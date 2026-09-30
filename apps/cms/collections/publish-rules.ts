/**
 * What a project needs before it may be published (docs/SPEC.md 8.8).
 *
 * A published project with no cover cannot be laid out: the grid works out
 * every position from the cover's aspect ratio. The site drops such a project
 * with a warning in the build log — which nobody reads — so it is refused
 * here instead, while she is looking at it.
 *
 * Messages follow the shape SPEC 8.8 asks for: what happened, what to do
 * about it, and what did not happen.
 */

export interface PublishState {
  _status?: unknown;
  title?: unknown;
  cover?: unknown;
  photos?: unknown;
}

export function isPublishing(data: PublishState | undefined): boolean {
  return data?._status === 'published';
}

/** The reason it cannot go out, or undefined when it can. */
export function publishBlocker(data: PublishState | undefined): string | undefined {
  if (!isPublishing(data)) return undefined;

  const photos = data?.photos;
  if (!Array.isArray(photos) || photos.length === 0) {
    return 'Projekt nemá žádné fotky. Nahraj je na záložce Fotky a zkus to znovu — rozepsaný projekt zůstal uložený jako koncept.';
  }

  const cover = data?.cover;
  if (cover === undefined || cover === null || cover === '') {
    return 'Chybí titulní fotka. Vyber ji na záložce Fotky — bez ní nejde spočítat, jak se dlaždice vejde do mřížky. Projekt zůstal uložený jako koncept.';
  }

  return undefined;
}
