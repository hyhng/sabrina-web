/**
 * The one source of truth for project categories (CLAUDE.md, rule 4).
 * The web filter, the tile caption and the Payload field all read from here.
 *
 * Fashion was added on 13 October 2026 at the client's request; the two before
 * it date from 23 September. The order here is the order of the filter. A new
 * value also needs a database migration: Postgres holds the list as an enum.
 */
export const CATEGORIES = ['commercial', 'art', 'fashion'] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * The names the categories go by unless the client has given them her own in
 * Nastavení webu — the site is English (docs/SPEC.md 3.4).
 *
 * `art` reads Documentary since 13 October 2026. Only the name changed: the
 * value stays `art` in the database, in the order lists and in `?filter=art`,
 * so nothing that already points at it breaks.
 */
export const CATEGORY_LABELS: Record<Category, string> = {
  commercial: 'Commercial',
  art: 'Documentary',
  fashion: 'Fashion',
};

/** Her own names, by category; anything missing or blank falls back to the default. */
export type CategoryLabels = Readonly<Record<string, string | undefined>>;

/**
 * What a category is called on the site: her name for it if she has set one
 * [rozhodnuto 13. 10. 2026], otherwise the default. The categories themselves
 * stay a fixed list (CLAUDE.md rule 4) — this renames, it does not add.
 */
export function categoryLabel(category: Category, labels: CategoryLabels = {}): string {
  const own = labels[category]?.trim();
  return own === undefined || own === '' ? CATEGORY_LABELS[category] : own;
}

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}
