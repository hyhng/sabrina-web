import {
  GRID_DESKTOP,
  GRID_MOBILE,
  GRID_TABLET,
  placeTiles,
  type GridBreakpoint,
  type Project,
} from '@sabrina/shared';
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
 * container's height instead of its width, which is silently wrong.
 */

const BREAKPOINTS: { key: string; config: GridBreakpoint }[] = [
  { key: 'm', config: GRID_MOBILE },
  { key: 't', config: GRID_TABLET },
  { key: 'd', config: GRID_DESKTOP },
];

/** Enough precision for sub-pixel accuracy at any realistic viewport. */
const round = (value: number) => Number(value.toFixed(6));

export interface OffsetGridProps {
  projects: Project[];
  imgBase: string;
  /** Leading tiles that skip lazy loading (docs/SPEC.md 9.1). */
  eagerCount?: number;
}

export function OffsetGrid({ projects, imgBase, eagerCount = 4 }: OffsetGridProps) {
  const items = projects.map((project) => ({ aspectRatio: project.cover.aspectRatio }));
  const layouts = BREAKPOINTS.map((breakpoint) => ({
    ...breakpoint,
    placement: placeTiles(items, breakpoint.config),
  }));

  const canvas: Record<string, string> = {};
  for (const { key, config, placement } of layouts) {
    const columns = placement.columnBottoms
      .map((bottom) => `calc(var(--cw) * ${round(bottom.scale)} + ${bottom.pixels}px)`)
      .join(', ');
    // The tallest column, less the gap trailing its last tile.
    canvas[`--h-${key}`] = `calc(max(${columns}) - ${config.gapY}px)`;
  }

  return (
    <div className="offset-grid">
      <div className="offset-grid__canvas" style={canvas as CSSProperties}>
        {projects.map((project, index) => {
          const vars: Record<string, string | number> = {};
          for (const { key, placement } of layouts) {
            const tile = placement.tiles[index];
            if (tile === undefined) continue;
            vars[`--c-${key}`] = tile.column;
            vars[`--a-${key}`] = round(tile.scale);
            vars[`--b-${key}`] = `${tile.pixels}px`;
          }
          return (
            <div key={project.slug} className="offset-grid__item" style={vars as CSSProperties}>
              <Tile
                project={project}
                imgBase={imgBase}
                eager={index < eagerCount}
                priority={index === 0}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
