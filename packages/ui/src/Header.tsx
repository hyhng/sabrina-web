'use client';

import type { Settings } from '@sabrina/shared/schema';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';

import { nextHeaderScroll, type HeaderScroll } from './header-visibility.ts';

/**
 * Site header (Figma UI 04 node 154:4, UI 12 node 161:584, UI 06 node 154:320).
 *
 * Name on the left, links on the right, and the filter in the middle on
 * desktop but on its own row below on tablet and mobile (docs/SPEC.md 7).
 *
 * The filter is rendered once and moved by CSS rather than rendered twice and
 * hidden, so there is only ever one set of controls for a keyboard or a screen
 * reader to walk through.
 *
 * What the right-hand side shows narrows as the screen does: all three links
 * on desktop, Information and Instagram on tablet, Information alone on mobile.
 *
 * Sticky, and it gets out of the way: it slides up while the visitor scrolls
 * down and slides back down as soon as they scroll up [rozhodnuto 5. 10. 2026,
 * dřív „není sticky"]. Figma has no scroll state for it, so the rules are in
 * header-visibility.ts.
 *
 * It stays put while an overlay is open — the page is pinned then and its scroll
 * position says nothing about what the visitor is doing — and it comes back
 * when something in it takes keyboard focus, so Tab never lands on a link that
 * is off screen.
 */
export interface HeaderProps {
  settings: Settings;
  /** The category filter. Sits in the middle on desktop, below otherwise. */
  filter?: ReactNode;
  /** Open Information without navigating (docs/TECH.md 4.1). */
  onOpenInformation?: () => void;
}

const NAME = 'Sabrina Kulhankova';

export function Header({ settings, filter, onOpenInformation }: HeaderProps) {
  const openInformation =
    onOpenInformation === undefined
      ? undefined
      : (event: MouseEvent) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          onOpenInformation();
        };

  const element = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let state: HeaderScroll = { hidden: false, lastY: window.scrollY };

    function onScroll() {
      // An overlay pins the body with position: fixed (overlay-chrome.ts), which
      // reads as scrollY 0. Leave the state alone; closing it restores the
      // position and the header carries on from where it was.
      if (document.body.style.position === 'fixed') return;

      const next = nextHeaderScroll(state, window.scrollY, element.current?.offsetHeight ?? 0);
      if (next === state) return;
      state = next;
      setHidden(next.hidden);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header
      ref={element}
      onFocusCapture={() => {
        setHidden(false);
      }}
      className={`sticky top-0 z-40 bg-paper transition-transform duration-[280ms] ease-out motion-reduce:transition-none ${hidden ? '-translate-y-full' : ''}`}
    >
      <div className="flex items-center justify-between px-[16px] pt-[20px] pb-[12px] tablet:px-[24px] tablet:pt-[26px] tablet:pb-[14px] desktop:px-[34px] desktop:py-[30px]">
        {/* Clicking the name closes any overlay and resets the filter. [návrh] */}
        <a
          href="/"
          className="shrink-0 font-medium text-[16px] text-ink tablet:text-[18px] desktop:text-[19px] desktop:leading-[1.4] desktop:tracking-[-0.38px]"
        >
          {NAME}
        </a>

        <nav
          aria-label="Contact"
          className="flex shrink-0 items-start gap-[24px] text-[13px] text-ink tablet:text-[14px] desktop:gap-[28px] desktop:text-[15px] desktop:leading-[1.4]"
        >
          <a href="/information/" onClick={openInformation}>
            Information
          </a>
          <a href={`mailto:${settings.email}`} className="hidden desktop:inline">
            {settings.email}
          </a>
          <a
            href={settings.instagramUrl}
            className="hidden tablet:inline"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
        </nav>
      </div>

      {filter === undefined ? null : (
        <div className="px-[16px] pb-[20px] tablet:px-[24px] tablet:pb-[24px] desktop:absolute desktop:left-1/2 desktop:top-[30px] desktop:-translate-x-1/2 desktop:p-0">
          {filter}
        </div>
      )}
    </header>
  );
}
