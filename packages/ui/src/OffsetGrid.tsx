'use client';

import {
  GRID_DESKTOP,
  GRID_MOBILE,
  GRID_TABLET,
  layoutColumns,
  type GridBreakpoint,
} from '@sabrina/shared/grid';
import type { CategoryLabels } from '@sabrina/shared/categories';
import type { Project } from '@sabrina/shared/schema';
import { useState, type CSSProperties } from 'react';

import { openFade } from './overlay-chrome.ts';
import { Tile } from './Tile.tsx';

/**
 * The offset grid (docs/SPEC.md 3.1-3.2, docs/DESIGN.md → Grid).
 *
 * Three offset columns on desktop, two on tablet and mobile. The client orders
 * the projects and the algorithm decides which column each lands in, from the
 * data (packages/shared/grid.ts).
 *
 * Within a column the tiles simply follow one another [rozhodnuto 13. 10. 2026].
 * They used to be positioned absolutely, each at a top worked out from the tiles
 * above it on the assumption that a caption is one line. A title that wrapped —
 * on a phone a column is 173px wide and "Similivinlife x Loudz - SEEYA" does not
 * fit — ran under the next photo, because that photo's position knew nothing
 * about it. In a column that flows, the next tile is wherever the one above it
 * ends, at any width and for any title.
 *
 * Nothing measures the DOM and nothing moves once the page is drawn: a photo's
 * box still has its proportions from the data before a byte of it has arrived
 * (CLAUDE.md rule 3), and text is laid out by the browser before first paint.
 *
 * The cost is two copies of the tiles in the HTML. Which column a tile is in
 * differs between two columns and three, and columns that flow have to be real
 * elements, so each arrangement is its own tree and CSS shows the one that fits
 * (display: none on the other — out of the accessibility tree and out of tab
 * order). Both ask for the same image files, so nothing is fetched twice.
 *
 * Filtering lays the remaining projects out afresh. The tiles used to slide to
 * their new places; that needed fixed positions and went with them. The grid
 * fades in instead when the filter changes.
 */

interface Arrangement {
  key: 'narrow' | 'wide';
  /** Decides the columns. Mobile and tablet share one: both are two columns. */
  layout: GridBreakpoint;
  /** Column offsets as multiples of the column width, per breakpoint. */
  offsets: Record<string, GridBreakpoint>;
}

const ARRANGEMENTS: Arrangement[] = [
  { key: 'narrow', layout: GRID_TABLET, offsets: { m: GRID_MOBILE, t: GRID_TABLET } },
  { key: 'wide', layout: GRID_DESKTOP, offsets: { d: GRID_DESKTOP } },
];

/** Enough precision for sub-pixel accuracy at any realistic viewport. */
const round = (value: number) => Number(value.toFixed(6));

/** Projects dealt into columns, each keeping its place in the overall order. */
export function intoColumns(
  projects: readonly Project[],
  layout: GridBreakpoint,
): { project: Project; position: number }[][] {
  const assigned = layoutColumns(
    projects.map((project) => ({ aspectRatio: project.cover.aspectRatio })),
    layout,
  );
  const columns = Array.from(
    { length: layout.columns },
    () => [] as { project: Project; position: number }[],
  );
  projects.forEach((project, position) => {
    columns[assigned[position] ?? 0]?.push({ project, position });
  });
  return columns;
}

export interface OffsetGridProps {
  /** Every project, in the client's order. */
  projects: Project[];
  imgBase: string;
  /** Slugs to show. Undefined means all of them. */
  visibleSlugs?: ReadonlySet<string>;
  /** Leading tiles that skip lazy loading (docs/SPEC.md 9.1). */
  eagerCount?: number;
  /** Open a project without navigating. */
  onOpen?: (project: Project) => void;
  /** The client's own names for the categories. */
  categoryLabels?: CategoryLabels;
}

export function OffsetGrid({
  projects,
  imgBase,
  visibleSlugs,
  eagerCount = 4,
  onOpen,
  categoryLabels,
}: OffsetGridProps) {
  const shown =
    visibleSlugs === undefined
      ? projects
      : projects.filter((project) => visibleSlugs.has(project.slug));

  return (
    <div className="offset-grid">
      {/* Keyed by what is shown, so a change of filter mounts it anew and it fades in. */}
      <Columns
        key={shown.map((project) => project.slug).join('|')}
        shown={shown}
        imgBase={imgBase}
        eagerCount={eagerCount}
        onOpen={onOpen}
        categoryLabels={categoryLabels}
      />
    </div>
  );
}

function Columns({
  shown,
  imgBase,
  eagerCount,
  onOpen,
  categoryLabels,
}: {
  shown: Project[];
  imgBase: string;
  eagerCount: number;
  onOpen?: (project: Project) => void;
  categoryLabels?: CategoryLabels;
}) {
  // Decided once per mount: nothing on first load, a fade after a filter change.
  const [fade] = useState(openFade);

  return (
    <>
      {ARRANGEMENTS.map(({ key, layout, offsets }) => (
        <div key={key} className={`offset-grid__columns offset-grid__columns--${key} ${fade}`}>
          {intoColumns(shown, layout).map((column, index) => {
            const vars: Record<string, number> = {};
            for (const [breakpoint, config] of Object.entries(offsets)) {
              vars[`--o-${breakpoint}`] = round((config.offsets[index] ?? 0) / config.columnWidth);
            }
            return (
              <div
                // Columns are fixed in number and order for an arrangement.
                key={index}
                className="offset-grid__column"
                style={vars as CSSProperties}
              >
                {column.map(({ project, position }) => (
                  <div key={project.slug} className="offset-grid__item">
                    <Tile
                      project={project}
                      imgBase={imgBase}
                      eager={position < eagerCount}
                      priority={position === 0}
                      onOpen={onOpen}
                      categoryLabels={categoryLabels}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
