import { CATEGORIES } from '@sabrina/shared/categories';
import { GRID_DESKTOP, layoutColumns } from '@sabrina/shared/grid';

import { categoryOrderField } from '../collections/homepage-order.ts';

/**
 * The ordering screen as a grid she drags (docs/SPEC.md 8.5) — the rules,
 * apart from the component so they can be tested without a browser.
 */

export interface OrderProject {
  id: string;
  title: string;
  category?: string;
  published: boolean;
  cover?: { id: string; aspectRatio: number; widths: number[]; dominantColor: string };
}

/** Which category a homepage field orders; undefined for the order under All. */
export function categoryOfField(path: string): string | undefined {
  return CATEGORIES.find((category) => categoryOrderField(category) === path);
}

/** A Payload project record, reduced to what a tile needs. */
export function toOrderProject(raw: unknown): OrderProject | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const doc = raw as Record<string, unknown>;
  if (typeof doc.id !== 'string' && typeof doc.id !== 'number') return undefined;
  const cover = doc.cover;
  const usable =
    typeof cover === 'object' && cover !== null ? (cover as Record<string, unknown>) : undefined;
  return {
    id: String(doc.id),
    title: typeof doc.title === 'string' ? doc.title : '',
    category: typeof doc.category === 'string' ? doc.category : undefined,
    published: doc._status === 'published',
    cover:
      usable !== undefined && typeof usable.aspectRatio === 'number' && Array.isArray(usable.widths)
        ? {
            id: String(usable.id),
            aspectRatio: usable.aspectRatio,
            widths: usable.widths.filter((width): width is number => typeof width === 'number'),
            dominantColor:
              typeof usable.dominantColor === 'string' ? usable.dominantColor : '#e2dfd7',
          }
        : undefined,
  };
}

/**
 * The listed projects dealt into the site's three columns, each with its place
 * in her order. The same layoutColumns the site runs, so what she drags is the
 * arrangement visitors get.
 */
export function orderColumns(
  listed: readonly OrderProject[],
): { project: OrderProject; position: number }[][] {
  const assigned = layoutColumns(
    listed.map((project) => ({ aspectRatio: project.cover?.aspectRatio ?? 1 })),
    GRID_DESKTOP,
  );
  const columns = Array.from(
    { length: GRID_DESKTOP.columns },
    () => [] as { project: OrderProject; position: number }[],
  );
  listed.forEach((project, position) => {
    columns[assigned[position] ?? 0]?.push({ project, position });
  });
  return columns;
}

/**
 * Projects that could be on this list and are not: published, of the list's
 * category when it has one. What the "add" row offers.
 */
export function addable(
  all: readonly OrderProject[],
  listedIds: readonly string[],
  category: string | undefined,
): OrderProject[] {
  const listed = new Set(listedIds);
  return all.filter(
    (project) =>
      project.published &&
      !listed.has(project.id) &&
      (category === undefined || project.category === category),
  );
}
