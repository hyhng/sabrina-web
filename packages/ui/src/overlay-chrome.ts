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

/**
 * Overlays fade in when they are opened on the page [rozhodnuto 5. 10. 2026],
 * but not when the visitor arrives on an overlay's own address: then it is
 * simply open (docs/SPEC.md 4.5). The HTML for that address already carries
 * the overlay, and a CSS animation on it would play on page load.
 *
 * So the fade is switched on only once the page is interactive. A module
 * value rather than state: the render that hydrates the server HTML must read
 * false, as the server did, and every overlay mounted after it reads true.
 */
let interactive = false;

/** Called once the page has hydrated (apps/web Site). */
export function markInteractive(): void {
  interactive = true;
}

/** The fade-in classes for an overlay opened now, or nothing on arrival. */
export function openFade(): string {
  return interactive ? OPEN_FADE : '';
}

export const OPEN_FADE = 'animate-fade-in motion-reduce:animate-none';

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

    /*
     * The dialog itself, not its first control. Focusing the ✕ draws a focus
     * ring around it the moment the overlay opens, which a mouse visitor has
     * not asked for. The container carries tabindex="-1", so a screen reader
     * still announces the dialog and Tab still walks into it.
     */
    node.focus();

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
      if (opener === null) return;
      opener.focus();
      /*
       * Closing with Esc is a key press, so the browser draws its focus ring on
       * the tile the focus lands on — a ring the visitor did not ask for, round
       * a photograph. Focus is what matters to a keyboard visitor, and it is
       * there; only the ring is held back until focus moves on, and Tab shows
       * the next one as usual.
       */
      opener.style.outline = 'none';
      opener.addEventListener(
        'blur',
        () => {
          opener.style.outline = '';
        },
        { once: true },
      );
    };
  }
}

export function useFocusTrap(container: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const node = container.current;
    return node === null ? undefined : trapFocus(node);
  }, [container]);
}
