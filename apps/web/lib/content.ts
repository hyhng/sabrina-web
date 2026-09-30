import { contentSchema, type Content } from '@sabrina/shared';

/**
 * Where the build reads content from (docs/TECH.md 4.4).
 *
 * Everything goes through the canonical zod schema, so broken data fails the
 * build rather than deploying a broken site — the previously deployed version
 * stays online.
 */

const SOURCES = ['seed', 'payload'] as const;
type ContentSource = (typeof SOURCES)[number];

export function contentSource(): ContentSource {
  const value = process.env.CONTENT_SOURCE ?? 'seed';
  if (!(SOURCES as readonly string[]).includes(value)) {
    throw new Error(`CONTENT_SOURCE must be one of ${SOURCES.join(' | ')}, got "${value}"`);
  }
  return value as ContentSource;
}

async function readSeed(): Promise<unknown> {
  // A dynamic import rather than a filesystem read: it resolves the same way
  // under Turbopack, Vite and plain Node, and keeps the fixture out of the
  // bundle when the source is payload.
  const module_ = (await import('../content/seed.json')) as { default: unknown };
  return module_.default;
}

/**
 * The CMS is read *before* the build, by scripts/fetch-content.mts, which
 * writes content/payload.json — so this reads a file exactly as the seed does.
 *
 * It is not done with a fetch from here, and the reason is worth keeping: a
 * static export only prerenders a route whose data is cacheable, and Next's
 * fetch cache outlives the build. Measured on 30 September — a project renamed
 * in the admin did not appear in the next build's HTML. The Publikovat button
 * exists so that a change shows up, so a cached fetch is the one thing this
 * must not lean on.
 */
async function readPayload(): Promise<unknown> {
  try {
    const module_ = (await import('../content/payload.json')) as { default: unknown };
    return module_.default;
  } catch {
    throw new Error(
      'CONTENT_SOURCE=payload needs content/payload.json — run scripts/fetch-content.mts ' +
        '(pnpm --filter web build does it for you). See docs/PHASES.md F4.',
    );
  }
}

/**
 * Homepage may point at a project that has no photos yet — Payload lets a
 * draft be referenced (docs/TECH.md 4.4). Those are dropped with a warning
 * before validation, because a project without a cover cannot be laid out.
 */
export function dropIncompleteProjects(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const content = raw as { homepage?: { projects?: unknown } };
  const projects = content.homepage?.projects;
  if (!Array.isArray(projects)) return raw;

  const keep = projects.filter((project) => {
    const candidate = project as { title?: unknown; cover?: unknown; photos?: unknown } | null;
    const complete =
      candidate !== null &&
      typeof candidate === 'object' &&
      candidate.cover !== null &&
      candidate.cover !== undefined &&
      Array.isArray(candidate.photos) &&
      candidate.photos.length > 0;
    if (!complete) {
      const name = typeof candidate?.title === 'string' ? candidate.title : 'untitled project';
      console.warn(`[content] skipping "${name}": no cover photo`);
    }
    return complete;
  });

  return { ...content, homepage: { ...content.homepage, projects: keep } };
}

export async function getContent(): Promise<Content> {
  const raw = contentSource() === 'seed' ? await readSeed() : await readPayload();
  return contentSchema.parse(dropIncompleteProjects(raw));
}
