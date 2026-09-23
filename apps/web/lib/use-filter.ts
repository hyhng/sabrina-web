'use client';

import { filterUrl, readFilter, type FilterValue } from '@sabrina/shared';
import { useSyncExternalStore } from 'react';

/**
 * The category filter, kept in the URL (docs/SPEC.md 3.4).
 *
 * Deliberately not useSearchParams. docs/TECH.md 4.1 suggests it behind a
 * Suspense boundary, but under `output: 'export'` that boundary renders its
 * fallback at build time: the grid and the filter drop out of the static HTML
 * entirely — measured, zero tiles and zero project links. That costs the LCP
 * target in SPEC 9.1 and the indexable project URLs in SPEC 9.2.
 *
 * So the server snapshot is always All, which puts the whole grid in the HTML,
 * and the real value is read from the URL once the page is interactive. A
 * visitor arriving at /?filter=art sees every project for a moment before it
 * narrows — a fair trade for a page that renders without JavaScript.
 */

const FILTER_CHANGED = 'sabrina:filterchanged';

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('popstate', onStoreChange);
  window.addEventListener(FILTER_CHANGED, onStoreChange);
  return () => {
    window.removeEventListener('popstate', onStoreChange);
    window.removeEventListener(FILTER_CHANGED, onStoreChange);
  };
}

function getSnapshot(): FilterValue {
  return readFilter(new URLSearchParams(window.location.search).get('filter'));
}

function getServerSnapshot(): FilterValue {
  return 'all';
}

export function useFilter(): FilterValue {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * replaceState, not pushState: Back should leave the page rather than walk
 * back through every filter click (docs/SPEC.md 2).
 */
export function setFilter(value: FilterValue): void {
  window.history.replaceState(null, '', filterUrl(window.location.pathname, value));
  window.dispatchEvent(new Event(FILTER_CHANGED));
}
