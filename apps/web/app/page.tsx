import { Footer, Header } from '@sabrina/ui';

import { getContent } from '../lib/content.ts';
import { FilteredGrid } from './_components/FilteredGrid.tsx';
import { GridFilter } from './_components/GridFilter.tsx';

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? '/seed';

export default async function HomePage() {
  const { homepage, settings } = await getContent();
  return (
    <>
      <Header settings={settings} filter={<GridFilter />} />
      <main>
        <FilteredGrid projects={homepage.projects} imgBase={IMG_BASE} />
      </main>
      <Footer settings={settings} />
    </>
  );
}
