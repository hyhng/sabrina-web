import { photoUrl } from '@sabrina/shared/photo-url';
import type { Photo, Project, Settings } from '@sabrina/shared/schema';

/**
 * The picture shown when a link to the site is shared (docs/SPEC.md 9.2).
 *
 * The one she uploaded in Nastavení webu → Obrázek pro sdílení. Until there is
 * one, the cover of the first project, so a shared link is never a bare line of
 * text. Project pages have their own: the project's cover.
 *
 * 1200px wide is what the previews are drawn from; the variant nearest to it
 * from below is used, and its real size is stated so nothing has to fetch the
 * file to lay the preview out.
 */
export const SHARE_WIDTH = 1200;

export interface ShareImage {
  url: string;
  width: number;
  height: number;
}

export function variantFor(photo: Pick<Photo, 'widths'>, wanted = SHARE_WIDTH): number | undefined {
  const sorted = [...photo.widths].sort((a, b) => a - b);
  return sorted.filter((width) => width <= wanted).at(-1) ?? sorted[0];
}

export function shareImage(
  settings: Pick<Settings, 'ogImage'>,
  projects: readonly Pick<Project, 'cover'>[],
  imgBase: string,
): ShareImage | undefined {
  const photo = settings.ogImage ?? projects[0]?.cover;
  if (photo === undefined) return undefined;
  const width = variantFor(photo);
  if (width === undefined) return undefined;
  return {
    url: photoUrl(photo.id, width, imgBase),
    width,
    height: Math.round(width / photo.aspectRatio),
  };
}
