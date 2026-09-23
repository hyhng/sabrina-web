import { CATEGORY_LABELS, type Project } from '@sabrina/shared';

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
  priority?: boolean;
}

export function Tile({ project, imgBase, priority = false }: TileProps) {
  return (
    <a
      href={`/work/${project.slug}/`}
      className="group flex w-full flex-col gap-[12px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <Photo
        photo={project.cover}
        imgBase={imgBase}
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
