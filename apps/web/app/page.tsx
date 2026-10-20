import type { Metadata } from 'next';

import { getContent } from '../lib/content.ts';
import { shareImage } from '../lib/share-image.ts';
import { SITE_NAME, SITE_URL } from '../lib/site.ts';
import { Site } from './_components/Site.tsx';

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? '/seed';

export async function generateMetadata(): Promise<Metadata> {
  const { homepage, settings } = await getContent();
  const image = shareImage(settings, homepage.projects, IMG_BASE);
  return {
    description: settings.seoDescription,
    openGraph: {
      description: settings.seoDescription,
      ...(image === undefined ? {} : { images: [image] }),
    },
    // A large picture in the preview where there is one to show.
    twitter: { card: image === undefined ? 'summary' : 'summary_large_image' },
  };
}

export default async function HomePage() {
  const { homepage, settings } = await getContent();

  /**
   * Person, not Organization — this is one photographer, and it is what tells
   * a search engine the site and the name belong together (docs/SPEC.md 9.2).
   */
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_NAME,
    jobTitle: 'Photographer',
    url: `${SITE_URL}/`,
    email: settings.email,
    ...(settings.phone === undefined ? {} : { telephone: settings.phone }),
    sameAs: [settings.instagramUrl],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Prague',
      addressCountry: 'CZ',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escaped so a stray "</script>" in the data cannot break out of the tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(person).replace(/</g, '\\u003c'),
        }}
      />
      <Site
        projects={homepage.projects}
        categoryOrder={homepage.categoryOrder}
        settings={settings}
        imgBase={IMG_BASE}
        initialPath="/"
      />
    </>
  );
}
