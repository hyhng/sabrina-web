'use client';

import {
  GRID_DESKTOP,
  GRID_MOBILE,
  GRID_TABLET,
  placeTiles,
  type GridBreakpoint,
  type GridPlacement,
} from '@sabrina/shared/grid';
import type { Project } from '@sabrina/shared/schema';
import type { CSSProperties } from 'react';

import { Tile } from './Tile.tsx';

/**
 * The offset grid (docs/SPEC.md 3.1-3.2, docs/DESIGN.md → Grid).
 *
 * Three offset columns on desktop, two on tablet and mobile. Positions come
 * from the data — the client orders the projects, the algorithm decides where
 * they land — and are baked into the HTML for all three breakpoints at once,
 * switched by media queries. Nothing measures the DOM and nothing moves after
 * hydration (docs/TECH.md 4.5).
 *
 * Columns are flexible, so a tile's top is `columnWidth * scale + pixels` and
 * the browser finishes the sum in calc(). The column width is expressed in
 * `cqw` rather than `%`: a percentage in `top` would resolve against the
 * container's height, which is silently wrong.
 *
 * Filtering out a tile does not unmount it — it fades while the rest slide.
 * A hidden tile is placed where the unfiltered layout would put it, which is
 * exactly where it already is when coming from All, so it fades on the spot.
 * Switching straight from one category to another lets it drift as it goes,
 * which reads as the tile leaving. Remembering its last position instead would
 * mean reading and writing a ref during render — unsafe once React renders
 * speculatively, and caught by react-hooks/refs. The movement is a CSS
 * transition either way; no animation library.
 */

const BREAKPOINTS: { key: string; config: GridBreakpoint }[] = [
  { key: 'm', config: GRID_MOBILE },
  { key: 't', config: GRID_TABLET },
  { key: 'd', config: GRID_DESKTOP },
];

/** Enough precision for sub-pixel accuracy at any realistic viewport. */
const round = (value: number) => Number(value.toFixed(6));

type TileVars = Record<string, string | number>;

function tileVars(layouts: { key: string; placement: GridPlacement }[], index: number): TileVars {
  const vars: TileVars = {};
  for (const { key, placement } of layouts) {
    const tile = placement.tiles[index];
    if (tile === undefined) continue;
    vars[`--c-${key}`] = tile.column;
    vars[`--a-${key}`] = round(tile.scale);
    vars[`--b-${key}`] = `${tile.pixels}px`;
  }
  return vars;
}

export interface OffsetGridProps {
  /** Every project. Filtered-out ones stay mounted so they can fade. */
  projects: Project[];
  imgBase: string;
  /** Slugs to show. Undefined means all of them. */
  visibleSlugs?: ReadonlySet<string>;
  /** Leading tiles that skip lazy loading (docs/SPEC.md 9.1). */
  eagerCount?: number;
  /** Open a project without navigating. */
  onOpen?: (project: Project) => void;
}

export function OffsetGrid({
  projects,
  imgBase,
  visibleSlugs,
  eagerCount = 4,
  onOpen,
}: OffsetGridProps) {
  const isVisible = (project: Project) =>
    visibleSlugs === undefined || visibleSlugs.has(project.slug);
  const shown = projects.filter(isVisible);
  const positionOf = new Map(shown.map((project, index) => [project.slug, index]));

  const toItems = (list: Project[]) => list.map((p) => ({ aspectRatio: p.cover.aspectRatio }));
  const layouts = BREAKPOINTS.map((b) => ({
    ...b,
    placement: placeTiles(toItems(shown), b.config),
  }));
  /** Where a hidden tile sits: the layout as if nothing were filtered. */
  const unfiltered = BREAKPOINTS.map((b) => ({
    ...b,
    placement: placeTiles(toItems(projects), b.config),
  }));

  const canvas: Record<string, string> = {};
  for (const { key, config, placement } of layouts) {
    const columns = placement.columnBottoms
      .map((bottom) => `calc(var(--cw) * ${round(bottom.scale)} + ${bottom.pixels}px)`)
      .join(', ');
    canvas[`--h-${key}`] = `calc(max(${columns}) - ${config.gapY}px)`;
  }

  return (
    <div className="offset-grid">
      <div className="offset-grid__canvas" style={canvas as CSSProperties}>
        {projects.map((project, index) => {
          const position = positionOf.get(project.slug);
          const hidden = position === undefined;

          const vars =
            position === undefined ? tileVars(unfiltered, index) : tileVars(layouts, position);

          return (
            <div
              key={project.slug}
              className="offset-grid__item"
              data-hidden={hidden ? 'true' : undefined}
              inert={hidden}
              style={vars as CSSProperties}
            >
              <Tile
                project={project}
                imgBase={imgBase}
                eager={!hidden && (position ?? 0) < eagerCount}
                priority={position === 0}
                onOpen={onOpen}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
