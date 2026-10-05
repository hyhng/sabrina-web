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
 * A fixed template [rozhodnuto 5. 10. 2026, vzor: Rosée Marron na
 * lydiebonhomme.com]: the title and ✕ at the top, then a stage that holds only
 * the photos, then the meta. The stage is one size for every project and every
 * photo (Carousel.tsx), and each photo is fitted into it and centred, so the
 * plate is one size too and nothing moves between projects or while paging.
 * A portrait photo is scaled down to fit rather than making the window scroll.
 *
 * The column — title, ✕, stage and meta — is as wide as the stage is tall times
 * 0.8, up to 620px [rozhodnuto 5. 10. 2026]. The stage is 4:5, so the edges of
 * the text line up with the edges of the stage and with a 4:5 photo in it, and
 * the column is one width for every project at a given window size, so the ✕
 * does not shift sideways between them. A taller window gives a wider column;
 * a short one a narrower, never below 480px of stage.
 *
 * The plate is at least as tall as the window and grows only with the meta,
 * which can run long. What scrolls then is the layer behind it, which covers
 * the whole window, so the scrollbar sits at the edge of the browser rather
 * than inside the plate. Content is not centred vertically: that would put the
 * title in a different place for a short project than for a long one.
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
  'px-[16px] detail:mx-auto detail:w-(--col) detail:max-w-[calc(100%-48px)] detail:px-0';

export interface DetailOverlayProps {
  project: Project;
  imgBase: string;
  onClose: () => void;
}

export function DetailOverlay({ project, imgBase, onClose }: DetailOverlayProps) {
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
      className="fixed inset-0 z-50 overflow-y-auto bg-paper outline-none detail:bg-paper/88 detail:py-[35px]"
      onClick={onClose}
    >
      <div
        className="flex min-h-full flex-col bg-paper detail:[--col:min(620px,calc(var(--stage-h)*0.8))] detail:[--stage-h:clamp(480px,calc(100dvh-316px),775px)] detail:mx-auto detail:min-h-[calc(100dvh-70px)] detail:w-[min(800px,100vw-48px)] detail:pt-[48px] detail:pb-[61px]"
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
        <div className="detail:mx-auto detail:mt-[21px] detail:w-(--col) detail:max-w-[calc(100%-48px)]">
          <Carousel
            photos={project.photos}
            imgBase={imgBase}
            title={project.title}
            startIndex={coverIndex}
          />
        </div>

        <div
          className={`${COLUMN} flex flex-col gap-[16px] pt-[20px] pb-[40px] text-[14px] text-ink detail:mt-[26px] detail:flex-row detail:items-start detail:gap-0 detail:pt-0 detail:pb-0 detail:leading-[1.5]`}
        >
          {project.client === undefined ? null : (
            <div className="flex flex-col gap-[2px] detail:min-w-px detail:flex-1 detail:gap-0">
              <p className="opacity-50 detail:text-muted detail:opacity-100">Client :</p>
              <p className="font-medium">{project.client}</p>
              {project.clientLine2 === undefined ? null : <p>{project.clientLine2}</p>}
            </div>
          )}
          {project.credits.length === 0 ? null : (
            <div className="flex flex-col gap-[2px] detail:min-w-px detail:flex-1 detail:gap-0">
              <p className="opacity-50 detail:text-muted detail:opacity-100">Credits :</p>
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
