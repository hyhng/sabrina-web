'use client';

/**
 * Carousel arrow (docs/SPEC.md 4.3, Figma note 156:2, arrows 154:251 / 154:253).
 *
 * A 40px circle of #9E9E9E at 55% with a soft blur behind it, and a thin white
 * chevron. The chevron path is the geometry Figma exports — 7 × 14 at 1.5
 * stroke — drawn inline rather than loaded as the exported .svg file, because
 * that export carries its blur in a foreignObject, which browsers will not
 * render inside an <img>. The blur has to be a CSS backdrop-filter on the
 * button, so the circle belongs to the button and only the chevron is vector.
 *
 * The chevron sits dead centre in the circle. SPEC 4.3 asked for a 1.5px
 * optical nudge against the way it points; the client looked at it and wanted
 * it centred, so the nudge is gone.
 *
 * Visibility is CSS — see .detail-arrow in the app's stylesheet. Hidden until
 * the photo is hovered, always shown on keyboard focus, never shown where
 * there is no hover at all, because there the gesture is a swipe.
 */

const CHEVRON = {
  previous: 'M23.5 13L16.5 20L23.5 27',
  next: 'M16.5 13L23.5 20L16.5 27',
} as const;

export interface ArrowButtonProps {
  direction: 'previous' | 'next';
  onClick: () => void;
  className?: string;
}

export function ArrowButton({ direction, onClick, className = '' }: ArrowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'previous' ? 'Previous photo' : 'Next photo'}
      className={`size-[40px] cursor-pointer rounded-full bg-arrow/55 opacity-0 backdrop-blur-[3px] transition-opacity duration-200 group-hover/photo:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none [@media(hover:none)]:hidden ${className}`}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path
          d={CHEVRON[direction]}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
