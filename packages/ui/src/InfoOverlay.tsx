'use client';

import type { Settings } from '@sabrina/shared/schema';
import { useEffect, useRef } from 'react';

import { useFocusTrap, useScrollLock } from './overlay-chrome.ts';
import { Photo } from './Photo.tsx';

/**
 * Information (Figma UI 07 node 161:2, UI 08 node 161:266).
 *
 * From 768 up: the homepage at full strength behind a white veil at 93% — a
 * real layer, not the grid turned down (docs/SPEC.md 5) — with the portrait,
 * the biography and the contact details side by side. Below that it stacks and
 * scrolls, like the detail does.
 *
 * The contact block is text and links, never a form. [rozhodnuto]
 *
 * Column widths are percentages of the artboard's own proportions — 343, 471
 * and 340 inside 64px margins at 1440 — so the three columns hold their
 * relationship down to the breakpoint instead of running off a 1024 screen.
 */

/** 343 : 70 : 471 : 97 : 340 of the 1321px the artboard gives the content. */
const COLUMN = {
  portrait: 'detail:w-[25.96%]',
  bioGap: 'detail:ml-[5.3%]',
  bio: 'detail:w-[35.66%]',
  contactGap: 'detail:ml-[7.34%]',
  contact: 'detail:w-[25.74%]',
};

export interface InfoOverlayProps {
  settings: Settings;
  imgBase: string;
  onClose: () => void;
}

const TITLE = 'Sabrina Kulhankova, photographer.';

export function InfoOverlay({ settings, imgBase, onClose }: InfoOverlayProps) {
  const dialog = useRef<HTMLDivElement>(null);
  useScrollLock();
  useFocusTrap(dialog);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const paragraphs = settings.bio.split(/\n\s*\n/).filter((text) => text.trim() !== '');

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto bg-paper outline-none detail:bg-white/93"
      onClick={onClose}
    >
      <div
        className="min-h-full detail:min-h-0"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between px-[16px] pt-[20px] pb-[16px] detail:items-start detail:px-[64px] detail:pt-[70px] detail:pb-0">
          <h1
            id="info-title"
            className="font-medium text-[15px] text-ink detail:text-[18px] detail:leading-[1.55]"
          >
            {TITLE}
          </h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-[17px] text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink detail:text-[18px] detail:leading-[1.55]"
          >
            ✕
          </button>
        </div>

        <div className="px-[16px] pb-[40px] text-[15px] leading-[1.55] text-ink detail:flex detail:items-start detail:px-[64px] detail:pb-0 detail:mt-[34px]">
          {settings.portrait === undefined ? null : (
            <div className={`mt-[4px] detail:mt-0 detail:shrink-0 ${COLUMN.portrait}`}>
              <Photo
                photo={settings.portrait}
                imgBase={imgBase}
                sizes="(min-width: 768px) 26vw, calc(100vw - 32px)"
                eager
                alt="Sabrina Kulhankova"
                className="h-auto w-full"
              />
            </div>
          )}

          <div className={`mt-[24px] detail:mt-0 ${COLUMN.bioGap} ${COLUMN.bio}`}>
            {paragraphs.map((text) => (
              <p key={text.slice(0, 40)} className="mb-[1.55em] last:mb-0">
                {text}
              </p>
            ))}
          </div>

          <div
            className={`mt-[24px] flex flex-col gap-[22px] detail:mt-0 detail:shrink-0 ${COLUMN.contactGap} ${COLUMN.contact}`}
          >
            <p className="font-medium">{settings.location}</p>
            <div className="flex flex-col gap-[2px]">
              <a href={`mailto:${settings.email}`} className="underline">
                {settings.email}
              </a>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {settings.instagramHandle}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
