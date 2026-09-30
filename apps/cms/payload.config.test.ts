import { CATEGORIES } from '@sabrina/shared/categories';
import { describe, expect, it } from 'vitest';

import configPromise from './payload.config.ts';

/**
 * Loading the config runs Payload's own validation, which typechecking does
 * not. No database is involved — the adapter only connects when Payload
 * initialises.
 */
const config = await configPromise;

const collection = (slug: string) => config.collections.find((entry) => entry.slug === slug);

describe('payload config', () => {
  it('registers the three collections we wrote', () => {
    for (const slug of ['projects', 'photos', 'users']) {
      expect(collection(slug), slug).toBeDefined();
    }
  });

  it('speaks Czech to the client and nothing else', () => {
    expect(Object.keys(config.i18n?.supportedLanguages ?? {})).toEqual(['cs']);
    expect(config.i18n?.fallbackLanguage).toBe('cs');
  });

  it('has no upload collection — photos are converted in the browser', () => {
    // CLAUDE.md rule 10: a Payload upload would resize on the server via sharp.
    for (const entry of config.collections) {
      expect(entry.upload, entry.slug).toBeFalsy();
    }
  });
});

describe('projects', () => {
  const projects = collection('projects');

  it('keeps drafts, so a half-finished series stays unpublished', () => {
    expect(projects?.versions).toMatchObject({ drafts: expect.anything() });
  });

  it('takes its categories from packages/shared, not a second list', () => {
    const field = projects?.fields.find((f) => 'name' in f && f.name === 'category');
    const options = (field as { options: { value: string }[] }).options;
    expect(options.map((option) => option.value)).toEqual([...CATEGORIES]);
  });

  it('shows the public only what is published', () => {
    const read = projects?.access?.read;
    expect(read).toBeTypeOf('function');
    // An unauthenticated build gets a filter, not everything.
    const asVisitor = read?.({ req: {} } as never);
    expect(asVisitor).toEqual({ _status: { equals: 'published' } });
    // A logged-in client sees drafts too.
    expect(read?.({ req: { user: { id: 1 } } } as never)).toBe(true);
  });

  it('lets nobody but the client write', () => {
    for (const action of ['create', 'update', 'delete'] as const) {
      expect(projects?.access?.[action]?.({ req: {} } as never)).toBe(false);
    }
  });
});

describe('users', () => {
  const users = collection('users');

  it('is an auth collection with registration closed', () => {
    expect(users?.auth).toBeTruthy();
    expect(users?.access?.create?.({ req: {} } as never)).toBe(false);
    // Payload still allows the very first user through its own screen.
  });

  it('cannot be deleted away, locking her out of her own site', () => {
    expect(users?.access?.delete?.({ req: { user: { id: 1 } } } as never)).toBe(false);
  });
});
