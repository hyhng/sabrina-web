'use client';

import type { Photo as PhotoData } from '@sabrina/shared/schema';
import { useEffect, useRef, useState } from 'react';

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
 * Only the current photo and its two neighbours are mounted. That is what
 * preloads ±1, and it is also what makes the crossfade possible: the next
 * photo is already decoded and sitting underneath at zero opacity.
 *
 * The photo spans the full width of the content column, so its left and right
 * edges line up with the title above it and the meta below. The height simply
 * follows the photo's own proportion — the box is never fixed and the picture
 * is never cropped or padded to fit one.
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
  const current = photos[index] ?? photos[0];
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
      className="group/photo relative w-full"
      /* The box takes the current photo's shape, so nothing is letterboxed. */
      style={
        current === undefined ? undefined : { aspectRatio: `${current.width} / ${current.height}` }
      }
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
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-[250ms] motion-reduce:duration-[120ms]"
            style={{ opacity: current ? 1 : 0 }}
            aria-hidden={current ? undefined : true}
            inert={!current}
          >
            <Photo
              photo={photo}
              imgBase={imgBase}
              sizes="620px"
              eager
              alt={photo.alt ?? `${title} — photo ${position + 1}`}
              /*
               * The box takes the photo's own proportions, bounded by the
               * area — never the other way round. Stretching the element to
               * the area and fitting the image inside left the placeholder
               * colour showing in the gutters, which read as deliberate bars
               * around the picture.
               */
              className="h-full w-full object-contain"
            />
          </div>
        );
      })}

      {canGoBack ? (
        <ArrowButton
          direction="previous"
          onClick={goBack}
          className="absolute left-0 top-1/2 -translate-y-1/2"
        />
      ) : null}
      {canGoForward ? (
        <ArrowButton
          direction="next"
          onClick={goForward}
          className="absolute right-0 top-1/2 -translate-y-1/2"
        />
      ) : null}
    </div>
  );
}
