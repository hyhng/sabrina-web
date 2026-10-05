'use client';

import type { Photo as PhotoData } from '@sabrina/shared/schema';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { ArrowButton } from './ArrowButton.tsx';
import { Photo } from './Photo.tsx';

/**
 * The photo series in a project detail (docs/SPEC.md 4.2).
 *
 * One photo at a time, swapped in place, with no counter — the client decided
 * against one, accepting that a long series gives the visitor no sense of how
 * much is left.
 *
 * It does not wrap. There is no back arrow on the first photo and no forward
 * arrow on the last, which without a counter is the only signal that the
 * series has ended.
 *
 * The photos live in a stage — a container of one fixed size for every project
 * [rozhodnuto 5. 10. 2026, vzor: Rosée Marron na lydiebonhomme.com]. From 768 up
 * it is the width of the content column and a height worked out from the
 * window, so the whole detail is one size and nothing moves between projects.
 * The height is `--stage-h`, set by DetailOverlay, which also derives the
 * column's width from it so the stage is always 4:5.
 * Each photo is fitted inside it and centred both ways: a portrait is scaled
 * down to fit, a landscape has room above and below. Nothing is cropped, and
 * nothing is enlarged past the stage.
 *
 * The fit is arithmetic on the aspect ratio from the data, not a measurement
 * (CLAUDE.md rule 3): the photo's width is the smaller of the stage's width and
 * its height times the ratio, in the stage's own container units.
 *
 * Below 768 the photo runs the full width and the stage is as tall as the
 * tallest photo of the series would be at that width, so the page still has
 * room for the meta underneath.
 *
 * The arrows sit 16px in from the stage's edge, vertically centred, so they
 * stay put whatever shape the photo is. They were flush with the photo's edge
 * between 24 Sep and 5 Oct 2026, and read as part of the frame.
 *
 * Photos slide rather than crossfade: each sits one box-width to the left or
 * right of the one on screen and the whole row shifts. Only the current photo
 * and its neighbours exist, so that is also what preloads ±1.
 *
 * On a touch screen the arrows are hidden and the gesture is a swipe
 * (docs/SPEC.md 4.4). [návrh] 48px before a drag counts as one — far enough
 * not to fire while scrolling the page, close enough not to feel stubborn.
 */

/** [návrh] Horizontal distance before a drag is taken as a swipe. */
export const SWIPE_THRESHOLD = 48;

/**
 * Which way a drag went, or null if it was too short to mean anything.
 * Dragging left reveals what is to the right, so it moves forward.
 */
export function swipeDirection(
  from: number,
  to: number,
  threshold = SWIPE_THRESHOLD,
): 'previous' | 'next' | null {
  const travelled = to - from;
  if (Math.abs(travelled) < threshold) return null;
  return travelled < 0 ? 'next' : 'previous';
}
export interface CarouselProps {
  photos: PhotoData[];
  imgBase: string;
  /** Alt text stem; each photo gets its position appended. */
  title: string;
  /** Where to open — the cover, so the detail starts on the tile's photo. */
  startIndex?: number;
}

export function Carousel({ photos, imgBase, title, startIndex = 0 }: CarouselProps) {
  const [index, setIndex] = useState(startIndex);
  const swipeFrom = useRef<number | null>(null);

  const last = photos.length - 1;
  /** The tallest frame at a given width is the one with the smallest ratio. */
  const tallest = Math.min(...photos.map((photo) => photo.aspectRatio));
  const goBack = () => {
    setIndex((current) => Math.max(0, current - 1));
  };
  const goForward = () => {
    setIndex((current) => Math.min(last, current + 1));
  };
  const canGoBack = index > 0;
  const canGoForward = index < last;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') setIndex((current) => Math.max(0, current - 1));
      if (event.key === 'ArrowRight') setIndex((current) => Math.min(last, current + 1));
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [last]);

  return (
    <div
      className="group/photo relative aspect-(--ratio) w-full overflow-hidden detail:aspect-auto detail:h-(--stage-h)"
      /*
       * `--ratio` is the mobile height, from the tallest photo; from 768 the
       * stage has a height of its own. `container-type: size` is what lets a
       * photo be sized in the stage's units below.
       */
      style={{ '--ratio': String(tallest), containerType: 'size' } as CSSProperties}
      onTouchStart={(event) => {
        swipeFrom.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const from = swipeFrom.current;
        swipeFrom.current = null;
        if (from === null) return;
        const direction = swipeDirection(from, event.changedTouches[0]?.clientX ?? from);
        if (direction === 'next') goForward();
        if (direction === 'previous') goBack();
      }}
    >
      {photos.map((photo, position) => {
        if (Math.abs(position - index) > 1) return null;
        const current = position === index;
        return (
          <div
            key={photo.id}
            className="absolute inset-0 flex items-center justify-center transition-transform duration-[380ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(${String((position - index) * 100)}%)` }}
            aria-hidden={current ? undefined : true}
            inert={!current}
          >
            {/*
             * The box takes the photo's own proportions and is bounded by the
             * stage — never the other way round. Stretching the element to the
             * stage and fitting the image inside left the placeholder colour
             * showing in the gutters, which read as bars round the picture.
             */}
            <div
              style={{
                width: `min(100cqw, calc(100cqh * ${String(photo.aspectRatio)}))`,
                aspectRatio: String(photo.aspectRatio),
              }}
            >
              <Photo
                photo={photo}
                imgBase={imgBase}
                sizes="620px"
                eager
                alt={photo.alt ?? `${title} — photo ${position + 1}`}
                className="size-full"
              />
            </div>
          </div>
        );
      })}

      {canGoBack ? (
        <ArrowButton
          direction="previous"
          onClick={goBack}
          className="absolute left-[16px] top-1/2 -translate-y-1/2"
        />
      ) : null}
      {canGoForward ? (
        <ArrowButton
          direction="next"
          onClick={goForward}
          className="absolute right-[16px] top-1/2 -translate-y-1/2"
        />
      ) : null}
    </div>
  );
}
