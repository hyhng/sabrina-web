/**
 * Where a project goes in the homepage order when it is published
 * (docs/SPEC.md 8.5) — at the top [rozhodnuto 5. 10. 2026, otevřená otázka 10;
 * SPEC said the end]. The newest work leads, and she can still drag it
 * anywhere. Projects already in the order keep their place.
 *
 * Plain functions of the data so they can be tested without a database; the
 * hook in Projects.ts does the reading and writing.
 */

/** Ids as the global holds them: bare ids or populated documents. */
export function orderIds(value: unknown): (string | number)[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: unknown) => {
    if (typeof entry === 'string' || typeof entry === 'number') return [entry];
    if (typeof entry === 'object' && entry !== null && 'id' in entry) {
      const id = (entry as { id: unknown }).id;
      return typeof id === 'string' || typeof id === 'number' ? [id] : [];
    }
    return [];
  });
}

/** True when this save is the one that makes the project public. */
export function becomesPublished(status: unknown, previousStatus: unknown): boolean {
  return status === 'published' && previousStatus !== 'published';
}

/** The order with `id` first, or undefined when it is already in it. */
export function withNewFirst(
  order: readonly (string | number)[],
  id: string | number,
): (string | number)[] | undefined {
  if (order.some((entry) => String(entry) === String(id))) return undefined;
  return [id, ...order];
}

/**
 * The homepage field that holds her order within one category. One name, used
 * by the global's config, the publish hook and the site's content mapping
 * (apps/web/lib/payload-content.ts reads `<category>Order`).
 */
export function categoryOrderField(category: string): string {
  return `${category}Order`;
}

/**
 * A category's list without the projects that are not in that category.
 *
 * A list may only hold its own category's projects — the field refuses anything
 * else — and a project's category can change after it was put on a list. Left
 * as it was, the stale entry made every save of the homepage order fail, and
 * with it every publish, since publishing writes to that order (13 October
 * 2026: Art projects were moved to Fashion and nothing could be published).
 */
export function keepCategory(
  list: readonly (string | number)[],
  categoryOf: ReadonlyMap<string, string>,
  category: string,
): (string | number)[] {
  return list.filter((id) => categoryOf.get(String(id)) === category);
}

/**
 * What a saved project changes in the homepage orders, or nothing.
 *
 * Published for the first time: first under All and first in its category.
 * Already on the homepage and moved to another category: first in the new
 * category's list. Leaving the old list is not written here — the homepage
 * drops what no longer belongs whenever it is saved (keepCategory).
 */
export function orderChanges(args: {
  homepage: Readonly<Record<string, unknown>>;
  id: string | number;
  status: unknown;
  previousStatus: unknown;
  category: unknown;
  previousCategory: unknown;
}): Record<string, (string | number)[]> {
  const { homepage, id, category } = args;
  const changes: Record<string, (string | number)[]> = {};
  const first = (field: string) => {
    const next = withNewFirst(orderIds(homepage[field]), id);
    if (next !== undefined) changes[field] = next;
  };
  const onHomepage = orderIds(homepage.projects).some((entry) => String(entry) === String(id));

  if (becomesPublished(args.status, args.previousStatus)) {
    first('projects');
    if (typeof category === 'string') first(categoryOrderField(category));
  } else if (onHomepage && typeof category === 'string' && category !== args.previousCategory) {
    first(categoryOrderField(category));
  }
  return changes;
}
