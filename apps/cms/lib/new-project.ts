/**
 * Creating a project from a title alone (docs/SPEC.md 8.2).
 *
 * The dialog asks one question because the rest can be typed while the photos
 * upload — and uploading takes minutes where metadata takes seconds. The
 * project is therefore created as a draft: `category` is required, and drafts
 * are allowed to be half-finished, which is what makes a one-field dialog
 * possible at all. The slug comes from the title in the collection's own hook.
 */

/**
 * Where the Fotky tab is in the editor, for the preference below. Zero-based,
 * counted from the order in collections/Projects.ts.
 */
export const PHOTOS_TAB_INDEX = 1;

export const NEW_PROJECT_ERROR = 'Projekt se nepovedlo vytvořit.';

export type Created = { readonly id: string };

export async function createProject(
  title: string,
  request: typeof fetch = fetch,
): Promise<Created> {
  const response = await request('/api/projects?draft=true', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title.trim(), _status: 'draft' }),
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    const errors = (body as { errors?: { message?: string }[] } | undefined)?.errors;
    throw new Error(errors?.[0]?.message ?? NEW_PROJECT_ERROR);
  }
  const body = (await response.json()) as { doc?: { id?: string | number } };
  const id = body.doc?.id;
  if (id === undefined) throw new Error(NEW_PROJECT_ERROR);
  return { id: String(id) };
}

/**
 * The two keys Payload's tabs field looks under. Read off what it writes when
 * the tab is clicked: `_index-0` is the field's path — the tabs are the first
 * field in collections/Projects.ts — and `tabs-0` its fallback. It restores
 * from the path, so that one is the one that matters.
 */
const TAB_PREFERENCE_KEYS = ['_index-0', 'tabs-0'];

/**
 * Opens the new project on its Fotky tab (docs/SPEC.md 8.2 point 3).
 *
 * Payload keeps the active tab in its own preferences, per document, under keys
 * of its own making, so this is a bet on an internal shape — including on the
 * tabs staying the first field in the collection. It is a safe bet to lose: if
 * the shape changes she lands on Podrobnosti and clicks Fotky, which is where
 * she was going anyway.
 */
export async function openOnPhotosTab(
  projectId: string,
  request: typeof fetch = fetch,
): Promise<void> {
  const fields = Object.fromEntries(
    TAB_PREFERENCE_KEYS.map((key) => [key, { tabIndex: PHOTOS_TAB_INDEX }]),
  );
  await request(`/api/payload-preferences/collection-projects-${projectId}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: { fields } }),
  }).catch(() => {
    // A preference that would not save is not worth failing the creation over.
  });
}

export function projectPath(projectId: string): string {
  return `/admin/collections/projects/${projectId}`;
}
