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
