/**
 * When the sticky header is out of the way (docs/SPEC.md 7).
 *
 * It slides away while the visitor scrolls down and slides back as soon as they
 * scroll up, so the content gets the whole window but the navigation is never
 * more than a flick away. Kept as a plain function of the previous state and the
 * new scroll position so it can be tested without a browser.
 */
export interface HeaderScroll {
  hidden: boolean;
  /** The scroll position the last decision was made at. */
  lastY: number;
}

/**
 * [návrh] Pixels of travel before a change of direction counts. A trackpad
 * reports tiny reversals while it settles, and without this the header would
 * flutter.
 */
export const JITTER = 6;

export function nextHeaderScroll(
  state: HeaderScroll,
  y: number,
  headerHeight: number,
  jitter = JITTER,
): HeaderScroll {
  // Within the header's own height of the top there is nothing to make room
  // for. Also covers the negative values of an iOS rubber-band.
  if (y <= headerHeight) return { hidden: false, lastY: y };

  const travelled = y - state.lastY;
  // Not moved far enough to mean anything. lastY stays put, so a slow drift in
  // one direction still adds up to a decision.
  if (Math.abs(travelled) < jitter) return state;

  return { hidden: travelled > 0, lastY: y };
}
