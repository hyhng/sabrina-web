'use client';

import { photoFit } from '@sabrina/shared/detail';
import type { Project } from '@sabrina/shared/schema';

import { Photo } from './Photo.tsx';

/**
 * Project detail (Figma UI 05 node 154:71).
 *
 * The homepage stays behind at 12% — a veil of paper over it, not a dimming
 * of the grid — and a plate 800px wide carries a 620px content column: title
 * and ✕, the photo, then the meta in two columns.
 *
 * The plate is paper, not white. DESIGN.md calls it "bílá plocha" and lists
 * white for it, but node 154:170 is #faf9f6. Figma wins on pixel values
 * (CLAUDE.md), and it reads correctly: the plate is there to mask the ghost
 * of the grid behind the text, not to be a white card.
 *
 * A photo shaped roughly like the area fills it and takes the small crop the
 * design signs off on; anything further off — a landscape frame above all — is
 * fitted inside and centred, with the title, meta and arrows staying put
 * (Figma UI 05B).
 *
 * The area is a fixed 620 × 740 here, matching a 1024-tall window. Scaling it
 * to shorter windows, the carousel, the arrows and the mobile layout are the
 * next tasks in docs/PHASES.md F2.
 */
export interface DetailOverlayProps {
  project: Project;
  imgBase: string;
  onClose: () => void;
}

export function DetailOverlay({ project, imgBase, onClose }: DetailOverlayProps) {
  const photo = project.cover;
  const fit = photoFit(photo.aspectRatio);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-paper/88"
      onClick={onClose}
    >
      <div
        className="mx-auto my-[35px] w-[800px] max-w-[calc(100vw-48px)] bg-paper px-[90px] pt-[48px] pb-[61px]"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="flex items-start justify-between text-[18px] leading-[1.5]">
          <h1 id="detail-title" className="font-medium text-ink">
            {project.title}
          </h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            ✕
          </button>
        </div>

        <div className="mt-[21px] flex h-[740px] w-full items-center justify-center">
          <Photo
            photo={photo}
            imgBase={imgBase}
            sizes="620px"
            eager
            alt={photo.alt ?? `${project.title} — photo 1`}
            className={
              fit === 'cover'
                ? 'h-full w-full object-cover'
                : 'max-h-full max-w-full object-contain'
            }
          />
        </div>

        <div className="mt-[26px] flex items-start text-[12.5px] leading-[1.5]">
          {project.client === undefined ? null : (
            <div className="min-w-px flex-1">
              <p className="text-muted">Client :</p>
              <p className="font-medium text-ink">{project.client}</p>
              {project.clientLine2 === undefined ? null : (
                <p className="text-ink">{project.clientLine2}</p>
              )}
            </div>
          )}
          {project.credits.length === 0 ? null : (
            <div className="min-w-px flex-1">
              <p className="text-muted">Credits :</p>
              {project.credits.map((credit) => (
                <p key={`${credit.role}-${credit.name}`} className="text-ink">
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
