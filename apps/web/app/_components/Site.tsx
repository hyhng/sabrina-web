'use client';

import { filterProjects } from '@sabrina/shared/filter';
import type { Project, Settings } from '@sabrina/shared/schema';
import { DetailOverlay, Filter, Footer, Header, InfoOverlay, OffsetGrid } from '@sabrina/ui';
import { useMemo } from 'react';

import { setFilter, useFilter } from '../../lib/use-filter.ts';
import { closeOverlay, overlayFromPath, pushPath, usePath } from '../../lib/use-route.ts';

/**
 * The whole site. Every URL renders this same tree with a different starting
 * path, and once the page is interactive the overlay follows the URL without
 * anything being fetched (docs/TECH.md 4.1).
 */
export interface SiteProps {
  projects: Project[];
  settings: Settings;
  imgBase: string;
  /** The path this HTML file was prerendered for. */
  initialPath: string;
}

export function Site({ projects, settings, imgBase, initialPath }: SiteProps) {
  const path = usePath(initialPath);
  const overlay = useMemo(() => overlayFromPath(path), [path]);

  const filter = useFilter();
  const visibleSlugs = useMemo(
    () => new Set(filterProjects(projects, filter).map((project) => project.slug)),
    [projects, filter],
  );

  const open =
    overlay.kind === 'project'
      ? projects.find((project) => project.slug === overlay.slug)
      : undefined;

  return (
    <>
      <Header
        settings={settings}
        filter={<Filter value={filter} onChange={setFilter} />}
        onOpenInformation={() => {
          pushPath('/information/');
        }}
      />
      <main>
        <OffsetGrid
          projects={projects}
          visibleSlugs={visibleSlugs}
          imgBase={imgBase}
          onOpen={(project) => {
            pushPath(`/work/${project.slug}/`);
          }}
        />
      </main>
      <Footer
        settings={settings}
        onOpenInformation={() => {
          pushPath('/information/');
        }}
      />
      {open === undefined ? null : (
        <DetailOverlay project={open} imgBase={imgBase} onClose={closeOverlay} />
      )}
      {overlay.kind === 'information' ? (
        <InfoOverlay settings={settings} imgBase={imgBase} onClose={closeOverlay} />
      ) : null}
    </>
  );
}
