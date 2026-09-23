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
