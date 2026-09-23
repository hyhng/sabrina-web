import type { Settings } from '@sabrina/shared';
import type { ReactNode } from 'react';

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
 * Not sticky — it scrolls away with the content. [návrh] Figma has no scroll
 * state for it.
 */
export interface HeaderProps {
  settings: Settings;
  /** The category filter. Sits in the middle on desktop, below otherwise. */
  filter?: ReactNode;
}

const NAME = 'Sabrina Kulhankova';

export function Header({ settings, filter }: HeaderProps) {
  return (
    <header className="relative">
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
          <a href="/information/">Information</a>
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
