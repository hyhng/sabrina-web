'use client';

import { filterProjects } from '@sabrina/shared/filter';
import type { Project } from '@sabrina/shared/schema';
import { OffsetGrid } from '@sabrina/ui';

import { useFilter } from '../../lib/use-filter.ts';

/**
 * The grid, narrowed to the category in the URL (docs/SPEC.md 3.4).
 *
 * Every project is in the HTML; filtering decides which ones render and
 * re-runs the same pure layout function. Nothing is fetched.
 */
export function FilteredGrid({ projects, imgBase }: { projects: Project[]; imgBase: string }) {
  return <OffsetGrid projects={filterProjects(projects, useFilter())} imgBase={imgBase} />;
}
