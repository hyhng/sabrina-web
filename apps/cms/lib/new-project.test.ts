import { describe, expect, it } from 'vitest';

import {
  createProject,
  NEW_PROJECT_ERROR,
  openOnPhotosTab,
  PHOTOS_TAB_INDEX,
  projectPath,
} from './new-project.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Records what was asked of the server, and answers with what is given. */
function recorder(...answers: (Response | Error)[]) {
  const calls: { url: string; body: unknown }[] = [];
  let index = 0;
  const request: typeof fetch = (url, init) => {
    const raw = init?.body;
    calls.push({
      url: String(url),
      body: typeof raw === 'string' ? JSON.parse(raw) : undefined,
    });
    const answer = answers[Math.min(index, answers.length - 1)];
    index += 1;
    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer ?? json({}));
  };
  return { calls, request };
}

describe('createProject', () => {
  it('creates a draft, because a title alone is not a publishable project', async () => {
    // docs/SPEC.md 8.2: one field. `category` is required, and only a draft may
    // be half-finished.
    const { calls, request } = recorder(json({ doc: { id: 12 } }));
    await createProject('Marlow', request);
    expect(calls[0]?.url).toBe('/api/projects?draft=true');
    expect(calls[0]?.body).toEqual({ title: 'Marlow', _status: 'draft' });
  });

  it('trims the title, so a stray space does not end up in the slug', async () => {
    const { calls, request } = recorder(json({ doc: { id: 1 } }));
    await createProject('  Marlow  ', request);
    expect((calls[0]?.body as { title: string }).title).toBe('Marlow');
  });

  it('gives back the id as a string, ready for the URL', async () => {
    const { request } = recorder(json({ doc: { id: 12 } }));
    await expect(createProject('Marlow', request)).resolves.toEqual({ id: '12' });
  });

  it("passes on the server's own complaint, which is already Czech", async () => {
    const { request } = recorder(json({ errors: [{ message: 'Adresa už existuje.' }] }, 400));
    await expect(createProject('Marlow', request)).rejects.toThrow('Adresa už existuje.');
  });

  it('falls back to its own message when the server says nothing useful', async () => {
    const { request } = recorder(new Response('not json', { status: 500 }));
    await expect(createProject('Marlow', request)).rejects.toThrow(NEW_PROJECT_ERROR);
  });

  it('refuses a response with no id rather than navigating nowhere', async () => {
    const { request } = recorder(json({ doc: {} }));
    await expect(createProject('Marlow', request)).rejects.toThrow(NEW_PROJECT_ERROR);
  });
});

describe('openOnPhotosTab', () => {
  it('stores the tab under the document’s own preference key', async () => {
    const { calls, request } = recorder(json({}));
    await openOnPhotosTab('12', request);
    expect(calls[0]?.url).toBe('/api/payload-preferences/collection-projects-12');
    // Both keys: Payload restores from the field's path (`_index-0`) and falls
    // back to `tabs-0`. Writing one alone does nothing — measured in the admin.
    expect(calls[0]?.body).toEqual({
      value: {
        fields: {
          '_index-0': { tabIndex: PHOTOS_TAB_INDEX },
          'tabs-0': { tabIndex: PHOTOS_TAB_INDEX },
        },
      },
    });
  });

  it('shrugs off a failure — a preference is not worth losing the project over', async () => {
    const { request } = recorder(new Error('offline'));
    await expect(openOnPhotosTab('12', request)).resolves.toBeUndefined();
  });
});

describe('projectPath', () => {
  it('is the editor for that project', () => {
    expect(projectPath('12')).toBe('/admin/collections/projects/12');
  });
});
