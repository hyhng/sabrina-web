import { photoSrc, photoSrcSet } from '@sabrina/shared/photo-url';
import type { Photo as PhotoData } from '@sabrina/shared/schema';

/**
 * A photo (docs/TECH.md 4.2).
 *
 * A plain <img> with a srcset over the pre-generated variants — not
 * next/image, whose default loader the static export cannot run, and which
 * would have nothing to do anyway.
 *
 * The aspect ratio comes from the data, so the box is the right shape before
 * a single byte of the photo has arrived: no reflow, no layout shift
 * (CLAUDE.md, rule 3). Behind it sits the photo's average colour, so an empty
 * slot reads as part of the picture rather than a hole in the page.
 */

/**
 * Column widths in the grid, per docs/DESIGN.md: three columns inside 34px
 * margins with 84px gutters, two inside 24/20 on tablet, two inside 16/12 on
 * mobile. At 1440 this resolves to 401px, at 810 to 371px, at 390 to 173px.
 */
export const GRID_SIZES =
  '(min-width: 1024px) calc((100vw - 236px) / 3), ' +
  '(min-width: 600px) calc((100vw - 68px) / 2), ' +
  'calc((100vw - 44px) / 2)';

export interface PhotoProps {
  photo: PhotoData;
  /** Base URL for the variants: /seed in development, img.<domain> in production. */
  imgBase: string;
  /** The `sizes` attribute. Defaults to the grid; overlays pass their own. */
  sizes?: string;
  /** Skip lazy loading. docs/SPEC.md 9.1 wants the first few tiles eager. */
  eager?: boolean;
  /**
   * The LCP photo. Implies eager, and lets React hoist a preload link.
   * Only ever one per page — SPEC 9.1 puts high priority on the first tile.
   */
  priority?: boolean;
  className?: string;
  /** Falls back to the pattern in docs/SPEC.md 9.3 when the CMS has no alt. */
  alt?: string;
}

export function Photo({
  photo,
  imgBase,
  sizes = GRID_SIZES,
  eager = false,
  priority = false,
  className,
  alt,
}: PhotoProps) {
  return (
    <img
      src={photoSrc(photo, imgBase)}
      srcSet={photoSrcSet(photo, imgBase)}
      sizes={sizes}
      width={photo.width}
      height={photo.height}
      alt={alt ?? photo.alt ?? ''}
      loading={eager || priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={className}
      style={{
        aspectRatio: `${photo.width} / ${photo.height}`,
        backgroundColor: photo.dominantColor,
      }}
    />
  );
}
