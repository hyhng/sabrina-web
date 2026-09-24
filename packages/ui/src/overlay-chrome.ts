'use client';

import { useEffect, type RefObject } from 'react';

/**
 * The behaviour every overlay needs but nobody sees (docs/SPEC.md 9.3, 4.5).
 */

/**
 * Stops the page behind the overlay from scrolling, and puts it back exactly
 * where it was on the way out.
 *
 * `overflow: hidden` on the body is the usual trick and iOS Safari ignores it,
 * which SPEC 9.4 calls a critical target — so the body is pinned with
 * `position: fixed` and offset by the scroll position instead. The width of
 * the scrollbar it removes is given back as padding, otherwise the page
 * shifts sideways the moment the overlay opens.
 */
export function lockScroll(): () => void {
  {
    const { body, documentElement } = document;
    const scrollY = window.scrollY;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.paddingRight = previous.paddingRight;

      window.scrollTo(0, scrollY);
    };
  }
}

export function useScrollLock(): void {
  useEffect(lockScroll, []);
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Keeps Tab inside the overlay while it is open, and hands focus back to
 * whatever opened it — the tile — on the way out, so a keyboard visitor
 * carries on from where they were rather than at the top of the page.
 */
export function trapFocus(node: HTMLElement): () => void {
  {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    /** Rendered and reachable — an `inert` or hidden photo has no rects. */
    const reachable = () =>
      [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.getClientRects().length > 0,
      );

    (reachable()[0] ?? node).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const items = reachable();
      const first = items[0];
      const last = items[items.length - 1];
      if (first === undefined || last === undefined) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }
}

export function useFocusTrap(container: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const node = container.current;
    return node === null ? undefined : trapFocus(node);
  }, [container]);
}
