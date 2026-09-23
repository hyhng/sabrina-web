import { OffsetGrid } from '@sabrina/ui';

import { getContent } from '../lib/content.ts';

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? '/seed';

export default async function HomePage() {
  const { homepage } = await getContent();
  return (
    <main>
      <OffsetGrid projects={homepage.projects} imgBase={IMG_BASE} />
    </main>
  );
}
