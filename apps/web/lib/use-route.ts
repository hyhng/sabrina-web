'use client';

import { useSyncExternalStore } from 'react';

/**
 * The current path, kept in the URL (docs/TECH.md 4.1).
 *
 * A static export cannot use intercepting routes, so every URL has its own
 * prerendered HTML and, once the page is interactive, opening an overlay only
 * rewrites the URL — nothing is fetched and no route change happens. The
 * overlay is derived from the path.
 *
 * Same shape as lib/use-filter.ts, and for the same reason: useSearchParams
 * and usePathname behind a Suspense boundary would strip the prerendered
 * content out of the static HTML.
 */

const ROUTE_CHANGED = 'sabrina:routechanged';

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('popstate', onStoreChange);
  window.addEventListener(ROUTE_CHANGED, onStoreChange);
  return () => {
    window.removeEventListener('popstate', onStoreChange);
    window.removeEventListener(ROUTE_CHANGED, onStoreChange);
  };
}

function getSnapshot(): string {
  return window.location.pathname;
}

/** `initial` is the path this HTML file was generated for. */
export function usePath(initial: string): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => initial);
}

/**
 * How many steps of history this page owns. Closing an overlay opened here
 * goes back; closing one arrived at from outside replaces the URL instead, so
 * Back still leaves the site (docs/TECH.md 4.1, point 3).
 */
let ownedEntries = 0;

export function pushPath(path: string): void {
  window.history.pushState(null, '', path + window.location.search);
  ownedEntries += 1;
  window.dispatchEvent(new Event(ROUTE_CHANGED));
}

export function closeOverlay(): void {
  if (ownedEntries > 0) {
    ownedEntries -= 1;
    window.history.back();
    return;
  }
  window.history.replaceState(null, '', '/' + window.location.search);
  window.dispatchEvent(new Event(ROUTE_CHANGED));
}

export type Overlay =
  { kind: 'none' } | { kind: 'information' } | { kind: 'project'; slug: string };

export function overlayFromPath(pathname: string): Overlay {
  if (pathname === '/information' || pathname === '/information/') {
    return { kind: 'information' };
  }
  const project = /^\/work\/([^/]+)\/?$/.exec(pathname);
  return project?.[1] === undefined ? { kind: 'none' } : { kind: 'project', slug: project[1] };
}
