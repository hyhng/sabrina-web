'use client';

import { orderedFor } from '@sabrina/shared/filter';
import type { Project, Settings } from '@sabrina/shared/schema';
import {
  DetailOverlay,
  Filter,
  Footer,
  Header,
  InfoOverlay,
  markInteractive,
  OffsetGrid,
} from '@sabrina/ui';
import { useEffect, useMemo } from 'react';

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
  /** Her order within each category, as slugs; All uses `projects` as given. */
  categoryOrder?: Readonly<Record<string, readonly string[]>>;
  /** The path this HTML file was prerendered for. */
  initialPath: string;
}

export function Site({ projects, categoryOrder, settings, imgBase, initialPath }: SiteProps) {
  const path = usePath(initialPath);
  // From here on, an overlay that opens fades in (overlay-chrome.ts).
  useEffect(markInteractive, []);
  const overlay = useMemo(() => overlayFromPath(path), [path]);

  const filter = useFilter();
  // What the filter shows, in her order for that category (docs/SPEC.md 8.5).
  const shown = useMemo(
    () => orderedFor(projects, filter, categoryOrder),
    [projects, filter, categoryOrder],
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
          projects={shown}
          imgBase={imgBase}
          onOpen={(project) => {
            pushPath(`/work/${project.slug}/`);
          }}
        />
      </main>
      <Footer />
      {open === undefined ? null : (
        <DetailOverlay project={open} imgBase={imgBase} onClose={closeOverlay} />
      )}
      {overlay.kind === 'information' ? (
        <InfoOverlay settings={settings} imgBase={imgBase} onClose={closeOverlay} />
      ) : null}
    </>
  );
}
