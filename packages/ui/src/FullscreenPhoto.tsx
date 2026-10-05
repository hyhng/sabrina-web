'use client';

import type { Photo as PhotoData } from '@sabrina/shared/schema';
import { useEffect, useRef } from 'react';

import { ArrowButton } from './ArrowButton.tsx';
import { OPEN_FADE } from './overlay-chrome.ts';
import { Photo } from './Photo.tsx';

/**
 * One photo of a series over the whole window (docs/SPEC.md 4.6) [rozhodnuto
 * 5. 10. 2026, vzor lydiebonhomme.com]. Opened by clicking the photo in a
 * project detail; no title, no meta, just the picture as large as it fits,
 * whole, with the arrows at the window's edges and a round ✕ top right.
 *
 * It sits inside the detail and shares its place in the series with it, so ←
 * → page the same photos and closing lands on the photo last looked at. Esc
 * closes this layer only: it is caught on the way down, before the detail's
 * own Esc listener would close the whole detail as well.
 *
 * The photo's box is sized from its aspect ratio, not measured (CLAUDE.md
 * rule 3): the smaller of the free width and the free height times the ratio.
 */

/** [návrh] Space kept clear round the photo: room for the arrows either side. */
const MARGIN_X = 96;
const MARGIN_Y = 40;

export interface FullscreenPhotoProps {
  photo: PhotoData;
  imgBase: string;
  alt: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onClose: () => void;
}

export function FullscreenPhoto({
  photo,
  imgBase,
  alt,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onClose,
}: FullscreenPhotoProps) {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    layer.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      // Capture phase: the detail listens for Esc too, and must not hear this one.
      event.stopPropagation();
      onClose();
    }
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [onClose]);

  const ratio = String(photo.aspectRatio);

  return (
    <div
      ref={layer}
      tabIndex={-1}
      aria-label="Full screen photo"
      className={`group/photo fixed inset-0 z-[60] flex items-center justify-center bg-paper outline-none ${OPEN_FADE}`}
    >
      <div
        style={{
          width: `min(calc(100vw - ${String(2 * MARGIN_X)}px), calc((100dvh - ${String(2 * MARGIN_Y)}px) * ${ratio}))`,
          aspectRatio: ratio,
        }}
      >
        <Photo
          photo={photo}
          imgBase={imgBase}
          sizes="100vw"
          eager
          alt={alt}
          className="size-full"
        />
      </div>

      {canGoBack ? (
        <ArrowButton
          direction="previous"
          onClick={onBack}
          className="absolute left-[24px] top-1/2 -translate-y-1/2"
        />
      ) : null}
      {canGoForward ? (
        <ArrowButton
          direction="next"
          onClick={onForward}
          className="absolute right-[24px] top-1/2 -translate-y-1/2"
        />
      ) : null}

      <button
        type="button"
        onClick={onClose}
        aria-label="Close full screen"
        className="absolute top-[24px] right-[24px] flex size-[40px] cursor-pointer items-center justify-center rounded-full bg-arrow/55 backdrop-blur-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M14 14L26 26M26 14L14 26"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
