import type { Category } from '@sabrina/shared';

/**
 * The nine projects on Figma UI 04 (node 154:3), in the order docs/TECH.md 4.5
 * fixes for the grid: they must land in columns 1,3,2,2,1,3,3,2,1.
 *
 * Titles and categories are read off the artboard. Everything else is
 * placeholder — the client fills the real content through the CMS in F5.
 */
export interface SeedProject {
  /** Figma node of the Fotka frame the photo was exported from. */
  node: string;
  title: string;
  slug: string;
  category: Category;
  client?: string;
  clientLine2?: string;
  /**
   * Extra photos in the series, as file names in the source directory. A
   * couple of projects carry several so the carousel, its arrows and the swipe
   * have something to act on; most real series will be longer than this.
   */
  extraPhotos?: string[];
}

export const SEED_PROJECTS: SeedProject[] = [
  {
    node: '154:17',
    title: 'Wool — SS26 Campaign',
    slug: 'wool-ss26-campaign',
    category: 'commercial',
    extraPhotos: ['extra-1.png', 'extra-2.png', 'extra-4.png'],
  },
  {
    node: '154:47',
    title: 'Summer in the Mountains',
    slug: 'summer-in-the-mountains',
    category: 'art',
  },
  { node: '154:32', title: 'Soda — Outdoor', slug: 'soda-outdoor', category: 'commercial' },
  {
    node: '154:37',
    title: 'Portraits — Business Weekly',
    slug: 'portraits-business-weekly',
    category: 'commercial',
  },
  { node: '154:22', title: 'Fog', slug: 'fog', category: 'art' },
  { node: '154:52', title: 'Hotel — Interiors', slug: 'hotel-interiors', category: 'commercial' },
  { node: '154:57', title: 'Silence', slug: 'silence', category: 'art' },
  { node: '154:42', title: 'Mirrors', slug: 'mirrors', category: 'commercial' },
  {
    node: '154:27',
    title: 'Marlow × Portrait',
    slug: 'marlow-portrait',
    category: 'commercial',
    // The one client pair docs/SPEC.md 4.1 names as an example.
    client: 'Marlow',
    clientLine2: 'Marlow Cosmetics',
    extraPhotos: ['extra-3.png', 'extra-5.png'],
  },
];
