/**
 * Offset grid layout (docs/SPEC.md 3.2, docs/TECH.md 4.5).
 *
 * The client sets the order of projects, not their position. Each column
 * starts at its own vertical offset; every next project goes into the column
 * whose bottom edge sits highest, ties going to the leftmost column.
 *
 * This is a pure function of the data. Nothing here measures the DOM — tile
 * heights come from the cover photo's aspect ratio, so the grid renders in its
 * final shape before a single photo has loaded (CLAUDE.md, rule 3).
 */

export interface GridConfig {
  columns: number;
  columnWidth: number;
  /** Vertical start of each column, relative to the top of the first tile. */
  offsets: number[];
  /** Vertical gap between tiles in the same column. */
  gapY: number;
  /**
   * [proposal] Gap between the photo and its caption. TECH 4.5 sketches the
   * config with captionHeight alone; DESIGN.md gives the two numbers
   * separately (12 and 42 on desktop), so they stay separate here.
   */
  captionGap: number;
  /** Caption block: category + title. */
  captionHeight: number;
}

export interface GridItem {
  aspectRatio: number;
}

/** Full tile height: photo scaled to the column, plus the caption below it. */
export function tileHeight(aspectRatio: number, cfg: GridConfig): number {
  if (!(aspectRatio > 0)) {
    throw new RangeError(`aspectRatio must be positive, got ${aspectRatio}`);
  }
  return Math.round(cfg.columnWidth / aspectRatio) + cfg.captionGap + cfg.captionHeight;
}

/** Column index for each item, in the order the items were given. */
export function layoutColumns(items: readonly GridItem[], cfg: GridConfig): number[] {
  if (cfg.columns < 1) {
    throw new RangeError(`columns must be at least 1, got ${cfg.columns}`);
  }
  if (cfg.offsets.length !== cfg.columns) {
    throw new RangeError(
      `offsets must have one entry per column: ${cfg.columns} columns, ${cfg.offsets.length} offsets`,
    );
  }

  const bottoms = cfg.offsets.slice();
  const assigned: number[] = [];

  for (const item of items) {
    let best = 0;
    let bestBottom = bottoms[0] ?? 0;
    for (let column = 1; column < bottoms.length; column += 1) {
      const bottom = bottoms[column] ?? 0;
      // Strictly lower, so a tie keeps the leftmost column.
      if (bottom < bestBottom) {
        best = column;
        bestBottom = bottom;
      }
    }

    assigned.push(best);
    bottoms[best] = bestBottom + tileHeight(item.aspectRatio, cfg) + cfg.gapY;
  }

  return assigned;
}

/** A breakpoint's full grid spec, including the page margin and column gutter. */
export interface GridBreakpoint extends GridConfig {
  /** Page margin left and right. */
  margin: number;
  /** Gutter between columns. */
  gapX: number;
}

/** docs/DESIGN.md → Grid. Figma UI 04, UI 12 and UI 06. */
export const GRID_DESKTOP: GridBreakpoint = {
  columns: 3,
  columnWidth: 401,
  offsets: [0, 170, 70],
  gapY: 96,
  captionGap: 12,
  captionHeight: 42,
  margin: 34,
  gapX: 84,
};

export const GRID_TABLET: GridBreakpoint = {
  columns: 2,
  columnWidth: 371,
  offsets: [0, 96],
  gapY: 48,
  captionGap: 10,
  captionHeight: 36,
  margin: 24,
  gapX: 20,
};

export const GRID_MOBILE: GridBreakpoint = {
  columns: 2,
  columnWidth: 173,
  offsets: [0, 56],
  gapY: 28,
  captionGap: 8,
  captionHeight: 32,
  margin: 16,
  gapX: 12,
};

/**
 * Where a tile sits, expressed so CSS can do the final arithmetic.
 *
 * Columns are flexible (1fr), so a tile's top cannot be a fixed pixel value:
 * it depends on the heights of the tiles above it, which depend on the column
 * width. Splitting it into `scale * columnWidth + pixels` lets the browser
 * resolve it with calc() at any viewport width, with no measuring and no
 * second pass after hydration.
 *
 * Offsets scale with the column too (docs/DESIGN.md), so they land in `scale`.
 */
export interface TilePlacement {
  column: number;
  /** Multiplier of the rendered column width. */
  scale: number;
  /** Fixed pixels: caption blocks and vertical gaps. */
  pixels: number;
}

export interface GridPlacement {
  tiles: TilePlacement[];
  /** Bottom edge of each column, same units, for the container height. */
  columnBottoms: Omit<TilePlacement, 'column'>[];
}

export function placeTiles(items: readonly GridItem[], cfg: GridConfig): GridPlacement {
  const columns = layoutColumns(items, cfg);
  const perTile = cfg.captionGap + cfg.captionHeight + cfg.gapY;

  const bottoms = cfg.offsets.map((offset) => ({
    scale: offset / cfg.columnWidth,
    pixels: 0,
  }));

  const tiles = items.map((item, index) => {
    const column = columns[index] ?? 0;
    const bottom = bottoms[column] ?? { scale: 0, pixels: 0 };
    const placement: TilePlacement = { column, scale: bottom.scale, pixels: bottom.pixels };
    bottoms[column] = {
      scale: bottom.scale + 1 / item.aspectRatio,
      pixels: bottom.pixels + perTile,
    };
    return placement;
  });

  return { tiles, columnBottoms: bottoms };
}
