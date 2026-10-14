/**
 * The order projects are shown in (docs/SPEC.md 8.5) [rozhodnuto 14. 10. 2026].
 *
 * Every published project is on the site. Her lists only order them: a project
 * she has not placed yet comes first, newest first by when it was created, and
 * then the ones she has placed, in her order. Nothing waits to be added and
 * nothing drops off the site for not being on a list — taking a project off the
 * site is unpublishing it.
 *
 * It used to be the other way round: the site showed only what was on the list,
 * and a project joined the list only at the moment it was first published. Ones
 * published before that rule existed, or while publishing was failing, never
 * did, and sat published and invisible.
 *
 * One function for the site's build and for the admin's grid, so what she drags
 * is what visitors get.
 */
export interface Orderable {
  id: string;
  /** ISO date; newer first among the unplaced. Missing sorts last. */
  createdAt?: string;
}

export function unplacedFirst<T extends Orderable>(
  items: readonly T[],
  order: readonly string[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const placed = new Set<string>();
  const inOrder: T[] = [];
  for (const id of order) {
    const item = byId.get(id);
    if (item === undefined || placed.has(id)) continue;
    placed.add(id);
    inOrder.push(item);
  }
  const unplaced = items
    .filter((item) => !placed.has(item.id))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  return [...unplaced, ...inOrder];
}
