'use client';

import type { Project } from '@sabrina/shared/schema';
import { useEffect, useRef } from 'react';

import { Carousel } from './Carousel.tsx';
import { useFocusTrap, useScrollLock } from './overlay-chrome.ts';

/**
 * Project detail (Figma UI 05 node 154:71, UI 09 node 161:278).
 *
 * From 768 up it is an overlay: the homepage showing through at 12% behind a
 * veil, a plate 800px wide, and a 620px column carrying the title and ✕, the
 * photo, and the meta in two columns.
 *
 * The plate is sized by the window, not by its contents — a fixed height of
 * the viewport less its margins, scrolling inside itself. Letting the photo
 * drive the height meant the plate jumped every time a series moved from a
 * portrait to a landscape. This is the pattern the client pointed at on
 * lydiebonhomme.com, where the panel is `position: fixed` with
 * `max-height: 100dvh` and the content scrolls within it.
 *
 * Below that it is a page of its own — full screen on paper, no ghost of the
 * grid behind it, a top bar, the photo full-bleed, and the meta stacked
 * underneath (docs/SPEC.md 4.4). The plate fills the viewport there, so there
 * is no backdrop left to click and the gesture is a swipe instead of arrows.
 *
 * The plate is paper, not white. DESIGN.md calls it "bílá plocha" and its
 * colour table lists white, but node 154:170 is #faf9f6 and Figma wins on
 * pixel values (CLAUDE.md). It reads right too: the plate is there to mask the
 * ghost of the grid behind the text, not to be a white card.
 */

/** The 620 column on desktop; plain 16px gutters on mobile. */
const COLUMN =
  'px-[16px] detail:mx-auto detail:w-[620px] detail:max-w-[calc(100%-48px)] detail:px-0';

export interface DetailOverlayProps {
  project: Project;
  imgBase: string;
  onClose: () => void;
  /** Shared transition name tying the detail photo back to its tile. */
  viewTransitionName?: string;
}

export function DetailOverlay({
  project,
  imgBase,
  onClose,
  viewTransitionName,
}: DetailOverlayProps) {
  const dialog = useRef<HTMLDivElement>(null);
  useScrollLock();
  useFocusTrap(dialog);

  // Open on the cover, so the detail starts on the photo the tile showed.
  const coverIndex = Math.max(
    0,
    project.photos.findIndex((photo) => photo.id === project.cover.id),
  );

  // Esc closes, alongside ✕, the backdrop and Back (docs/SPEC.md 4.5).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto bg-paper outline-none detail:overflow-hidden detail:bg-paper/88"
      onClick={onClose}
    >
      <div
        className="min-h-full bg-paper detail:mx-auto detail:my-[35px] detail:h-[calc(100dvh-70px)] detail:min-h-0 detail:w-[min(800px,100vw-48px)] detail:overflow-y-auto detail:pt-[48px] detail:pb-[61px]"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div
          className={`${COLUMN} flex items-center justify-between pt-[20px] pb-[16px] detail:items-start detail:pt-0 detail:pb-0`}
        >
          <h1
            id="detail-title"
            className="font-medium text-[15px] text-ink detail:text-[18px] detail:leading-[1.5]"
          >
            {project.title}
          </h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-[17px] text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink detail:text-[18px] detail:leading-[1.5]"
          >
            ✕
          </button>
        </div>

        {/* Full-bleed on mobile, inside the column from 768 up. */}
        <div className="detail:mx-auto detail:mt-[21px] detail:w-[620px] detail:max-w-[calc(100%-48px)]">
          <Carousel
            photos={project.photos}
            imgBase={imgBase}
            title={project.title}
            startIndex={coverIndex}
            viewTransitionName={viewTransitionName}
          />
        </div>

        <div
          className={`${COLUMN} flex flex-col gap-[16px] pt-[20px] pb-[40px] text-[13px] text-ink detail:mt-[26px] detail:flex-row detail:items-start detail:gap-0 detail:pt-0 detail:pb-0 detail:text-[12.5px] detail:leading-[1.5]`}
        >
          {project.client === undefined ? null : (
            <div className="flex flex-col gap-[2px] detail:min-w-px detail:flex-1 detail:gap-0">
              <p className="text-[12.5px] opacity-50 detail:text-muted detail:opacity-100">
                Client :
              </p>
              <p className="font-medium">{project.client}</p>
              {project.clientLine2 === undefined ? null : <p>{project.clientLine2}</p>}
            </div>
          )}
          {project.credits.length === 0 ? null : (
            <div className="flex flex-col gap-[2px] detail:min-w-px detail:flex-1 detail:gap-0">
              <p className="text-[12.5px] opacity-50 detail:text-muted detail:opacity-100">
                Credits :
              </p>
              {project.credits.map((credit) => (
                <p key={`${credit.role}-${credit.name}`}>
                  {credit.role} · {credit.name}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
