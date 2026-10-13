import type { Metadata } from 'next';

import { getContent } from '../../lib/content.ts';
import { shareImage } from '../../lib/share-image.ts';
import { Site } from '../_components/Site.tsx';

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? '/seed';

export async function generateMetadata(): Promise<Metadata> {
  const { homepage, settings } = await getContent();
  const image = shareImage(settings, homepage.projects, IMG_BASE);
  return {
    title: 'Information',
    description: settings.seoDescription,
    openGraph: {
      description: settings.seoDescription,
      ...(image === undefined ? {} : { images: [image] }),
    },
    twitter: { card: image === undefined ? 'summary' : 'summary_large_image' },
  };
}

/**
 * /information/ is a real prerendered page, not something only JavaScript can
 * produce (docs/TECH.md 4.1) — shareable and indexable like a project.
 */
export default async function InformationPage() {
  const { homepage, settings } = await getContent();
  return (
    <Site
      projects={homepage.projects}
      categoryOrder={homepage.categoryOrder}
      settings={settings}
      imgBase={IMG_BASE}
      initialPath="/information/"
    />
  );
}
