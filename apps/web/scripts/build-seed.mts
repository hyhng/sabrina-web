/**
 * Turns the photos exported from Figma UI 04 into seed content.
 *
 * Reads <source>/<slug>.png, writes WebP variants to
 * public/seed/photos/<slug>/<width>.webp and content/seed.json.
 *
 * This is the one place sharp is allowed. CLAUDE.md rule 10 keeps photo
 * processing in the browser so the production server never touches an image;
 * this script runs once, on a developer machine, to build a fixture that is
 * committed to the repo. docs/PHASES.md F1 grants the exception explicitly.
 * sharp is a devDependency and nothing under app/ or lib/ may import it.
 *
 * Usage: pnpm --filter web seed -- <source-dir>
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { contentSchema, photoKey, WEBP_WIDTHS, type Photo } from '@sabrina/shared';
import sharp from 'sharp';

import { SEED_PROJECTS } from './seed-projects.mts';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_SEED = path.join(WEB_ROOT, 'public', 'seed');
const CONTENT_FILE = path.join(WEB_ROOT, 'content', 'seed.json');

const WEBP_QUALITY = 82; // docs/SPEC.md 8.4

function hex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

async function buildPhoto(id: string, sourceFile: string): Promise<Photo> {
  const slug = id;
  const image = sharp(sourceFile);
  const { width, height } = await image.metadata();
  if (width === undefined || height === undefined) {
    throw new Error(`${sourceFile}: could not read dimensions`);
  }

  // docs/SPEC.md 8.4 asks for the average colour. sharp's `dominant` picks the
  // most common histogram bucket, which on these dark photographs collapses to
  // near-black for almost every frame and makes a poor placeholder.
  const { channels } = await image.stats();
  const [red, green, blue] = channels;
  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`${sourceFile}: expected at least three channels`);
  }

  // Never upscale past the original (docs/SPEC.md 8.4).
  const widths = WEBP_WIDTHS.filter((w) => w <= width);
  if (widths.length === 0) {
    throw new Error(`${sourceFile}: ${width}px is narrower than the smallest variant`);
  }

  let bytesWebp = 0;
  for (const variant of widths) {
    const target = path.join(PUBLIC_SEED, photoKey(slug, variant));
    await mkdir(path.dirname(target), { recursive: true });
    const { size } = await sharp(sourceFile)
      .resize({ width: variant })
      .webp({ quality: WEBP_QUALITY })
      .toFile(target);
    if (variant === widths[widths.length - 1]) bytesWebp = size;
  }

  return {
    id: slug,
    width,
    height,
    aspectRatio: width / height,
    widths: [...widths],
    dominantColor: hex(Math.round(red.mean), Math.round(green.mean), Math.round(blue.mean)),
    originalFilename: path.basename(sourceFile),
    bytesOriginal: (await sharp(sourceFile).toBuffer()).byteLength,
    bytesWebp,
  };
}

async function main(): Promise<void> {
  const source = process.argv[2];
  if (source === undefined) {
    throw new Error('usage: node scripts/build-seed.ts <source-dir>');
  }

  await rm(PUBLIC_SEED, { recursive: true, force: true });

  const projects = [];
  for (const project of SEED_PROJECTS) {
    const photo = await buildPhoto(project.slug, path.join(source, `${project.slug}.png`));
    const extras = [];
    for (const [index, file] of (project.extraPhotos ?? []).entries()) {
      extras.push(await buildPhoto(`${project.slug}-${index + 2}`, path.join(source, file)));
    }
    projects.push({
      title: project.title,
      slug: project.slug,
      category: project.category,
      ...(project.client === undefined ? {} : { client: project.client }),
      ...(project.clientLine2 === undefined ? {} : { clientLine2: project.clientLine2 }),
      // True for every project — she took the photographs.
      credits: [{ role: 'Photography', name: 'Sabrina Kulhankova' }],
      photos: [photo, ...extras],
      cover: photo,
      status: 'published' as const,
    });
    console.log(
      `${project.slug.padEnd(26)} ${photo.width}x${photo.height}  ` +
        `${photo.widths.join('/')}  ${photo.dominantColor}` +
        (extras.length > 0 ? `  +${extras.length} dalsi` : ''),
    );
  }

  // Placeholder until the client uploads her own (docs/PHASES.md, F5).
  const portrait = await buildPhoto('portrait', path.join(source, 'portrait.png'));

  const content = contentSchema.parse({
    homepage: { projects },
    settings: {
      portrait,
      // The copy sitting in Figma UI 07 (node 161:105) — still placeholder,
      // but closer to the real length than a single sentence, which matters
      // because the desktop overlay is not supposed to scroll.
      bio: [
        'Sabrina Kulhankova is a photographer based in Prague, working with both analog and digital formats.',
        'She has photographed model test shoots for agencies including Elite Prague and Scout Model Agency, and her work has been featured in publications such as Vogue and Merde Magazine.',
        'Alongside her editorial practice, she also works on selected commercial and commissioned projects.',
      ].join('\n\n'),
      location: 'Based in Prague.',
      email: 'sabrina.kulhankova@gmail.com',
      instagramHandle: '@sabrinakulhankova.photography',
      instagramUrl: 'https://www.instagram.com/sabrinakulhankova.photography/',
      seoDescription: 'Sabrina Kulhankova — photographer based in Prague.',
    },
  });

  await mkdir(path.dirname(CONTENT_FILE), { recursive: true });
  await writeFile(CONTENT_FILE, `${JSON.stringify(content, null, 2)}\n`);
  console.log(`\n${projects.length} projects -> ${path.relative(WEB_ROOT, CONTENT_FILE)}`);
}

await main();
