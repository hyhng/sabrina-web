import {
  CATEGORIES,
  CATEGORY_LABELS,
  categoryLabel,
  type Category,
  type CategoryLabels,
} from './categories.ts';
import type { Project } from './schema.ts';

/**
 * Category filter (docs/SPEC.md 3.4). All, then every category — All is the
 * default, and an unrecognised value in the URL falls back to it rather than
 * showing an empty page (docs/SPEC.md 2).
 */

export type FilterValue = 'all' | Category;

export const FILTER_VALUES: readonly FilterValue[] = ['all', ...CATEGORIES];

/** From the category labels, so a new category cannot be missing from the filter. */
export const FILTER_LABELS: Record<FilterValue, string> = { all: 'All', ...CATEGORY_LABELS };

/** What a filter item is called, with the client's own category names applied. */
export function filterLabel(value: FilterValue, labels: CategoryLabels = {}): string {
  return value === 'all' ? FILTER_LABELS.all : categoryLabel(value, labels);
}

/** Read the filter out of a `?filter=` value, however mangled. */
export function readFilter(raw: string | null | undefined): FilterValue {
  return raw !== null && raw !== undefined && (CATEGORIES as readonly string[]).includes(raw)
    ? (raw as Category)
    : 'all';
}

export function filterProjects<T extends Pick<Project, 'category'>>(
  projects: readonly T[],
  value: FilterValue,
): T[] {
  return value === 'all' ? [...projects] : projects.filter((p) => p.category === value);
}

/**
 * The projects a filter shows, in the order to show them.
 *
 * All is the homepage order. A category uses the client's own order for that
 * category where she has set one [rozhodnuto 13. 10. 2026]: projects on her
 * list come first, in her order; any project of the category she has not placed
 * follows in the homepage order, so a project is never missing from the site
 * because a list was not kept up. Slugs on the list that are not in the category
 * (the project was moved to another one) are simply not shown here.
 */
export function orderedFor<T extends Pick<Project, 'category' | 'slug'>>(
  projects: readonly T[],
  value: FilterValue,
  categoryOrder: Readonly<Record<string, readonly string[]>> = {},
): T[] {
  const shown = filterProjects(projects, value);
  if (value === 'all') return shown;
  const rank = new Map((categoryOrder[value] ?? []).map((slug, index) => [slug, index]));
  // Array.prototype.sort is stable, so equal ranks keep the homepage order.
  const last = rank.size;
  return shown.sort((a, b) => (rank.get(a.slug) ?? last) - (rank.get(b.slug) ?? last));
}

/** The URL a filter choice should produce, keeping the current path. */
export function filterUrl(pathname: string, value: FilterValue): string {
  return value === 'all' ? pathname : `${pathname}?filter=${value}`;
}
