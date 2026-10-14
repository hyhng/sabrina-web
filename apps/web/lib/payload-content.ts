/**
 * Payload's two globals, reshaped into the canonical content schema
 * (docs/TECH.md 4.4).
 *
 * The schema in packages/shared is what the site is built against, and Payload
 * does not speak it exactly. The differences are small, real, and were read off
 * a running admin rather than guessed at:
 *
 * - ids are integers; the schema wants strings, because an id is also the key
 *   prefix in R2 (`photos/<id>/<width>.webp`)
 * - an empty field comes back as `null`; the schema's optionals mean absent
 * - a project's state is `_status`, and the schema calls it `status`
 * - a project the reader may not see comes back as a bare id instead of an
 *   object. For an anonymous build that means drafts drop out on their own —
 *   see collections/Projects.ts, where read access is limited to published
 *
 * Nothing here validates. This produces the shape; `contentSchema.parse` in
 * content.ts decides whether it is good enough to build a site from, so a
 * mistake in this file fails the build rather than reaching the site.
 */
import { CATEGORIES } from '@sabrina/shared/categories';
import { unplacedFirst } from '@sabrina/shared/order';

/** Payload writes `null` for an empty field; the schema means absent. */
function present(value: unknown): unknown {
  return value === null ? undefined : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function photo(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  return {
    ...raw,
    // Also the key prefix in R2, which is why it has to be a string.
    id: String(raw.id),
    alt: present(raw.alt),
  };
}

/**
 * A project as the site wants it, or undefined when there is nothing to show.
 *
 * Photos that did not come back as documents are left out. If the cover is
 * gone — she deleted the photo that was the cover of a published project — the
 * first remaining photo stands in, which is what the admin would offer next. A
 * project with no photos at all cannot be drawn and is left out by `projects`.
 *
 * One incomplete project must never fail the whole build: the site would then
 * silently stay as it was, however many times Publikovat was pressed, with
 * nothing in the admin to say why (found on 13 October 2026 by walking through
 * her actions, not by her).
 */
function project(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const photos = (Array.isArray(raw.photos) ? raw.photos : []).filter(isRecord).map(photo);
  const coverId = isRecord(raw.cover) ? String(raw.cover.id) : undefined;
  const cover = photos.find((entry) => isRecord(entry) && entry.id === coverId);
  return {
    ...raw,
    status: raw._status,
    year: present(raw.year),
    client: present(raw.client),
    clientLine2: present(raw.clientLine2),
    photos,
    cover: cover ?? photos[0],
  };
}

/**
 * The projects the build can actually use, in her order.
 *
 * A bare id means Payload would not hand the document over — a draft, read
 * anonymously. Said out loud rather than dropped in silence: if the whole page
 * came back as ids, something is wrong with the request, and a silently empty
 * homepage would be a long afternoon.
 */
function projects(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (isRecord(entry)) {
      const mapped = project(entry);
      if (isRecord(mapped) && Array.isArray(mapped.photos) && mapped.photos.length > 0) {
        return [mapped];
      }
      console.warn(`[content] skipping project "${String(entry.title)}": it has no photos`);
      return [];
    }
    console.warn(`[content] skipping project ${String(entry)}: not published`);
    return [];
  });
}

/** Her names for the categories: the group as Payload sends it, minus the blanks. */
function categoryLabels(raw: unknown): Record<string, string> {
  if (!isRecord(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim() !== '',
    ),
  );
}

function settings(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  return {
    ...raw,
    portrait: raw.portrait === null ? undefined : photo(raw.portrait),
    ogImage: raw.ogImage === null ? undefined : photo(raw.ogImage),
    categoryLabels: categoryLabels(raw.categoryLabels),
  };
}

/** The id of a relationship entry, whether Payload sent the id or the document. */
function idOf(entry: unknown): string | undefined {
  const id = isRecord(entry) ? entry.id : entry;
  return typeof id === 'string' || typeof id === 'number' ? String(id) : undefined;
}

/** The published projects that can be drawn, keyed by id, with their dates. */
function pool(raw: unknown[]): { id: string; createdAt?: string; doc: Record<string, unknown> }[] {
  const seen = new Set<string>();
  return raw.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const id = idOf(entry);
    if (id === undefined || seen.has(id)) return [];
    seen.add(id);
    return [
      {
        id,
        createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : undefined,
        doc: entry,
      },
    ];
  });
}

/** Ids on one of her lists, in her order. */
function listIds(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.flatMap((entry) => idOf(entry) ?? []) : [];
}

/**
 * The content the site is built from (docs/SPEC.md 8.5).
 *
 * `published` is every published project, read anonymously. Each of them is on
 * the site: her lists only order them, and one she has not placed comes first,
 * newest first (packages/shared/order.ts). Without `published` — an older call,
 * or a test — the projects on the homepage list are all there is.
 */
export function toContent(homepage: unknown, settingsRaw: unknown, published?: unknown): unknown {
  const home = isRecord(homepage) ? homepage : {};
  const available = pool(
    Array.isArray(published) ? published : Array.isArray(home.projects) ? home.projects : [],
  );
  const ordered = unplacedFirst(available, listIds(home.projects));
  const shown = projects(ordered.map((entry) => entry.doc));
  const slugs = new Set(
    shown.flatMap((entry) =>
      isRecord(entry) && typeof entry.slug === 'string' ? [entry.slug] : [],
    ),
  );

  // The same rule within each category: unplaced first, newest first, then her order.
  const categoryOrder: Record<string, string[]> = {};
  for (const category of CATEGORIES) {
    const inCategory = available.filter((entry) => entry.doc.category === category);
    categoryOrder[category] = unplacedFirst(inCategory, listIds(home[`${category}Order`])).flatMap(
      (entry) =>
        typeof entry.doc.slug === 'string' && slugs.has(entry.doc.slug) ? [entry.doc.slug] : [],
    );
  }

  return {
    homepage: { projects: shown, categoryOrder },
    settings: settings(settingsRaw),
  };
}
