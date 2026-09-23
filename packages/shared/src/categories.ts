/**
 * The one source of truth for project categories (CLAUDE.md, rule 4).
 * The web filter, the tile caption and the Payload field all read from here.
 */
export const CATEGORIES = ['commercial', 'art'] as const;

export type Category = (typeof CATEGORIES)[number];

/** Labels as they appear on the site — the site is English (docs/SPEC.md 3.4). */
export const CATEGORY_LABELS: Record<Category, string> = {
  commercial: 'Commercial',
  art: 'Art',
};

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}
