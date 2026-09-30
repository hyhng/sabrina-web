/**
 * Puts the seed content into the database (docs/PHASES.md F4).
 *
 * The public site can read from Payload only once Payload has something in it,
 * and until Sabrina uploads her own work the seed built in F1 is the only real
 * content there is. This is a one-off developer script, not part of the app:
 * it runs against a local database and refuses to touch one that already has
 * projects in it.
 *
 * It also lays out the seed's WebP variants under apps/web/public/cms in the
 * same shape R2 will serve them — photos/<id>/<width>.webp — keyed by the ids
 * the database has just assigned. That pairing is the whole point of the
 * script: with NEXT_PUBLIC_IMG_BASE=/cms the payload branch can be walked
 * end to end, photographs included, before the bucket exists.
 *
 * Usage: pnpm --filter cms exec payload run ./scripts/import-seed.ts
 */
import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { contentSchema, type Photo, type Project } from '@sabrina/shared';
import { getPayload } from 'payload';

import config from '../payload.config.ts';

const CMS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_ROOT = path.resolve(CMS_ROOT, '..', 'web');
const SEED_JSON = path.join(WEB_ROOT, 'content', 'seed.json');
const SEED_PHOTOS = path.join(WEB_ROOT, 'public', 'seed', 'photos');
/** Gitignored: a local stand-in for the bucket, not something to commit. */
const FIXTURE = path.join(WEB_ROOT, 'public', 'cms', 'photos');

const payload = await getPayload({ config });

const existing = await payload.count({ collection: 'projects', overrideAccess: true });
if (existing.totalDocs > 0) {
  console.error(
    `Refusing to import: the database already has ${String(existing.totalDocs)} project(s).\n` +
      'This script is for filling an empty database. Clear it first if that is what you want.',
  );
  process.exit(1);
}

const seed = contentSchema.parse(JSON.parse(await readFile(SEED_JSON, 'utf8')));

/**
 * seed photo id → the id the database gave it, for the image fixture below.
 * Kept as the database's own type: relationship fields are validated against
 * the collection's id type, so a stringified integer is refused.
 */
type Id = string | number;
const photoIds = new Map<string, Id>();

async function createPhoto(photo: Photo): Promise<Id> {
  const known = photoIds.get(photo.id);
  if (known !== undefined) return known;
  const doc = await payload.create({
    collection: 'photos',
    data: {
      width: photo.width,
      height: photo.height,
      aspectRatio: photo.aspectRatio,
      widths: photo.widths,
      dominantColor: photo.dominantColor,
      originalFilename: photo.originalFilename,
      bytesOriginal: photo.bytesOriginal,
      bytesWebp: photo.bytesWebp,
      ...(photo.alt === undefined ? {} : { alt: photo.alt }),
    },
    overrideAccess: true,
  });
  photoIds.set(photo.id, doc.id);
  return doc.id;
}

async function createProject(project: Project): Promise<Id> {
  const photos: Id[] = [];
  for (const photo of project.photos) photos.push(await createPhoto(photo));
  const cover = await createPhoto(project.cover);

  const doc = await payload.create({
    collection: 'projects',
    data: {
      title: project.title,
      slug: project.slug,
      category: project.category,
      credits: project.credits,
      photos,
      cover,
      // The seed is what the site shows, so it goes in published.
      _status: 'published',
      ...(project.year === undefined ? {} : { year: project.year }),
      ...(project.client === undefined ? {} : { client: project.client }),
      ...(project.clientLine2 === undefined ? {} : { clientLine2: project.clientLine2 }),
    } as never,
    overrideAccess: true,
  });

  // The slug is generated from the title by the collection's own hook. If the
  // two ever disagree, every link in the seed's own fixtures points at nothing.
  const written = (doc as { slug?: string }).slug;
  if (written !== project.slug) {
    throw new Error(
      `slug mismatch for "${project.title}": seed ${project.slug}, CMS ${String(written)}`,
    );
  }
  return doc.id;
}

const projectIds: Id[] = [];
for (const project of seed.homepage.projects) {
  let id: Id;
  try {
    id = await createProject(project);
  } catch (error) {
    const errors = (error as { data?: { errors?: unknown[] } }).data?.errors;
    console.error(`  ${project.slug} refused:`, JSON.stringify(errors, null, 1));
    throw error;
  }
  projectIds.push(id);
  console.log(`  project ${project.slug} → ${String(id)}`);
}

await payload.updateGlobal({
  slug: 'homepage',
  data: { projects: projectIds } as never,
  overrideAccess: true,
});

const { settings } = seed;
await payload.updateGlobal({
  slug: 'settings',
  data: {
    bio: settings.bio,
    location: settings.location,
    email: settings.email,
    instagramHandle: settings.instagramHandle,
    instagramUrl: settings.instagramUrl,
    seoDescription: settings.seoDescription,
    ...(settings.portrait === undefined ? {} : { portrait: await createPhoto(settings.portrait) }),
    ...(settings.ogImage === undefined ? {} : { ogImage: await createPhoto(settings.ogImage) }),
  } as never,
  overrideAccess: true,
});

// The bucket stand-in. Same layout as R2, keyed by the new ids.
await rm(path.join(WEB_ROOT, 'public', 'cms'), { recursive: true, force: true });
for (const [seedId, dbId] of photoIds) {
  const target = path.join(FIXTURE, String(dbId));
  await mkdir(target, { recursive: true });
  await cp(path.join(SEED_PHOTOS, seedId), target, { recursive: true });
}

console.log(
  `\n${String(projectIds.length)} projects, ${String(photoIds.size)} photos.\n` +
    `Photos copied to apps/web/public/cms/photos/<id>/ — build the web with\n` +
    `  CONTENT_SOURCE=payload NEXT_PUBLIC_IMG_BASE=/cms PAYLOAD_PUBLIC_URL=http://localhost:3001`,
);
process.exit(0);
