'use client';

import type { Project } from '@sabrina/shared/schema';

import { Photo } from './Photo.tsx';

/**
 * Project detail (Figma UI 05 node 154:71).
 *
 * Minimal for now — this commit is the routing underneath it (docs/TECH.md
 * 4.1). The exact plate, the carousel, the arrows and the meta block are the
 * next tasks in docs/PHASES.md F2.
 */
export interface DetailOverlayProps {
  project: Project;
  imgBase: string;
  onClose: () => void;
}

export function DetailOverlay({ project, imgBase, onClose }: DetailOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      className="fixed inset-0 z-50 overflow-auto bg-paper/85"
      onClick={onClose}
    >
      <div
        className="mx-auto my-[35px] w-[min(800px,100vw-48px)] bg-white px-[90px] py-[35px]"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="mb-[24px] flex items-start justify-between">
          <h1 id="detail-title" className="text-[19px] text-ink">
            {project.title}
          </h1>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[19px]">
            ✕
          </button>
        </div>
        <Photo
          photo={project.cover}
          imgBase={imgBase}
          sizes="620px"
          className="w-full object-contain"
          alt={project.cover.alt ?? `${project.title} — photo 1`}
        />
      </div>
    </div>
  );
}
