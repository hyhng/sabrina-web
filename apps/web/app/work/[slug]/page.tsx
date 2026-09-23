import { getContent } from '../../../lib/content.ts';
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
