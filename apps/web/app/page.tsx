import { getContent } from '../lib/content.ts';
import { Site } from './_components/Site.tsx';

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? '/seed';

export default async function HomePage() {
  const { homepage, settings } = await getContent();
  return (
    <Site projects={homepage.projects} settings={settings} imgBase={IMG_BASE} initialPath="/" />
  );
}
