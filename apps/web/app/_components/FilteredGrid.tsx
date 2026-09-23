'use client';

import { filterProjects } from '@sabrina/shared/filter';
import type { Project } from '@sabrina/shared/schema';
import { OffsetGrid } from '@sabrina/ui';
import { useMemo } from 'react';

import { useFilter } from '../../lib/use-filter.ts';

/**
 * The grid, narrowed to the category in the URL (docs/SPEC.md 3.4).
 *
 * Every project stays in the page and in the DOM; the filter only decides
 * which ones are visible, and the same pure layout function runs again over
 * the ones that are. Nothing is fetched.
 */
export function FilteredGrid({ projects, imgBase }: { projects: Project[]; imgBase: string }) {
  const value = useFilter();
  const visibleSlugs = useMemo(
    () => new Set(filterProjects(projects, value).map((project) => project.slug)),
    [projects, value],
  );

  return <OffsetGrid projects={projects} visibleSlugs={visibleSlugs} imgBase={imgBase} />;
}
