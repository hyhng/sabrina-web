'use client';

import { flushSync } from 'react-dom';

/**
 * Runs a state change inside a view transition, so the browser morphs the
 * elements that carry the same `view-transition-name` from where they were to
 * where they end up (docs/SPEC.md 4.5 — the tile's photo growing into the
 * detail, which is the client's own idea).
 *
 * Native rather than `motion`, which docs/TECH.md 2 names for its layoutId.
 * motion unpacks to about 750 kB and would add roughly 38 kB gzipped to a
 * budget that allows 25 kB of our own code in total; this costs nothing and
 * does the same job. If a browser has no view transitions, or the visitor has
 * asked for less motion, the change simply happens at once — which is exactly
 * what the site did before.
 */

type WithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

export function withViewTransition(update: () => void): void {
  const start = (document as WithViewTransition).startViewTransition;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (start === undefined || reduced) {
    update();
    return;
  }

  // flushSync, because the browser snapshots the DOM as soon as the callback
  // returns — a render still sitting in React's queue would be missed.
  start.call(document, () => {
    flushSync(update);
  });
}

/** The shared name tying a tile's photo to the same photo in the detail. */
export function photoTransitionName(slug: string): string {
  return `photo-${slug}`;
}
