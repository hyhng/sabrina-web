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

function project(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const photos = Array.isArray(raw.photos) ? raw.photos.map(photo) : raw.photos;
  return {
    ...raw,
    status: raw._status,
    year: present(raw.year),
    client: present(raw.client),
    clientLine2: present(raw.clientLine2),
    photos,
    cover: photo(raw.cover),
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
    if (isRecord(entry)) return [project(entry)];
    console.warn(`[content] skipping project ${String(entry)}: not published`);
    return [];
  });
}

function settings(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  return {
    ...raw,
    portrait: raw.portrait === null ? undefined : photo(raw.portrait),
    ogImage: raw.ogImage === null ? undefined : photo(raw.ogImage),
  };
}

export function toContent(homepage: unknown, settingsRaw: unknown): unknown {
  return {
    homepage: { projects: projects(isRecord(homepage) ? homepage.projects : undefined) },
    settings: settings(settingsRaw),
  };
}
