import { CATEGORY_LABELS } from '@sabrina/shared/categories';
import { photoSrc } from '@sabrina/shared/photo-url';
import type { Metadata } from 'next';

import { getContent } from '../../../lib/content.ts';
import { SITE_NAME } from '../../../lib/site.ts';
import { Site } from '../../_components/Site.tsx';

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? '/seed';

/**
 * One prerendered page per project, so /work/<slug>/ is a real, shareable,
 * indexable URL and not something only JavaScript can produce
 * (docs/TECH.md 4.1, docs/SPEC.md 9.2).
 */
export async function generateStaticParams() {
  const { homepage } = await getContent();
  return homepage.projects.map((project) => ({ slug: project.slug }));
}

/** Anything not generated above is a 404, not a runtime lookup. */
export const dynamicParams = false;

/**
 * Its own title, description and preview image, so a shared link shows the
 * project rather than the site (docs/SPEC.md 9.2). The image is the cover —
 * the same photo the tile shows.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { homepage } = await getContent();
  const project = homepage.projects.find((candidate) => candidate.slug === slug);
  if (project === undefined) return {};

  const description = [
    `${CATEGORY_LABELS[project.category]} photography by ${SITE_NAME}`,
    project.client === undefined ? undefined : `for ${project.client}`,
  ]
    .filter((part) => part !== undefined)
    .join(' ');

  return {
    title: project.title,
    description,
    openGraph: {
      title: `${project.title} — ${SITE_NAME}`,
      description,
      images: [photoSrc(project.cover, IMG_BASE)],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { homepage, settings } = await getContent();
  return (
    <Site
      projects={homepage.projects}
      settings={settings}
      imgBase={IMG_BASE}
      initialPath={`/work/${slug}/`}
    />
  );
}
