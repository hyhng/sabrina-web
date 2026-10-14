/**
 * The homepage orders (docs/SPEC.md 8.5): plain functions of the data so they
 * can be tested without a database.
 *
 * Since 14 October 2026 nothing is added to a list when a project is published:
 * every published project is on the site, unplaced ones first
 * (packages/shared/order.ts). What is left here is keeping the lists valid.
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
