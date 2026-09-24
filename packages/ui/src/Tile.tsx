'use client';

import { CATEGORY_LABELS } from '@sabrina/shared/categories';
import type { Project } from '@sabrina/shared/schema';

import { Photo } from './Photo.tsx';

/**
 * One project in the grid (docs/SPEC.md 3.3, Figma UI 04 node 154:16).
 *
 * Photo, then a 12px gap, then the caption: category above title, 3px apart.
 * Type sizes are the ones Figma actually carries — 12.5 and 15.5 at
 * line-height 1.4. DESIGN.md's 17 and 22 are the resulting line boxes, which
 * is why the caption block measures 42px and the grid maths works out.
 *
 * No frame, no mat, no shadow, no rounded corners (CLAUDE.md, rule 5).
 */
export interface TileProps {
  project: Project;
  imgBase: string;
  /** Above the fold — docs/SPEC.md 9.1 wants the first few tiles eager. */
  eager?: boolean;
  /** The LCP photo. One per page. */
  priority?: boolean;
  /**
   * Open the detail without navigating. The href stays real, so the link is
   * crawlable and middle-click still opens a tab; only a plain left click is
   * intercepted (docs/TECH.md 4.1).
   */
  onOpen?: (project: Project) => void;
}

export function Tile({ project, imgBase, eager = false, priority = false, onOpen }: TileProps) {
  return (
    <a
      href={`/work/${project.slug}/`}
      onClick={
        onOpen === undefined
          ? undefined
          : (event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onOpen(project);
            }
      }
      className="group flex w-full flex-col gap-[12px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <Photo
        photo={project.cover}
        imgBase={imgBase}
        eager={eager}
        priority={priority}
        alt={project.cover.alt ?? `${project.title} — cover`}
        className="w-full object-cover"
      />
      <span className="flex flex-col gap-[3px] leading-[1.4]">
        {/* Darkens on hover, per docs/SPEC.md 3.3. */}
        <span className="text-[12.5px] text-soft transition-colors group-hover:text-muted">
          {CATEGORY_LABELS[project.category]}
        </span>
        {/* The photo must not scale on hover — it would shove its neighbours. */}
        <span className="text-[15.5px] text-ink group-hover:underline">{project.title}</span>
      </span>
    </a>
  );
}
