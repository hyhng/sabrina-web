import { CATEGORIES, type Category } from './categories.ts';
import type { Project } from './schema.ts';

/**
 * Category filter (docs/SPEC.md 3.4). All, Commercial, Art — All is the
 * default, and an unrecognised value in the URL falls back to it rather than
 * showing an empty page (docs/SPEC.md 2).
 */

export type FilterValue = 'all' | Category;

export const FILTER_VALUES: readonly FilterValue[] = ['all', ...CATEGORIES];

export const FILTER_LABELS: Record<FilterValue, string> = {
  all: 'All',
  commercial: 'Commercial',
  art: 'Art',
};

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

/** The URL a filter choice should produce, keeping the current path. */
export function filterUrl(pathname: string, value: FilterValue): string {
  return value === 'all' ? pathname : `${pathname}?filter=${value}`;
}
