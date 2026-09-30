import { CATEGORIES } from '@sabrina/shared/categories';
import { describe, expect, it } from 'vitest';

import configPromise from './payload.config.ts';

/**
 * Loading the config runs Payload's own validation, which typechecking does
 * not. No database is involved — the adapter only connects when Payload
 * initialises.
 */
const config = await configPromise;

/** Field names anywhere in a tree of tabs, rows and collapsibles. */
function fieldNames(fields: unknown): string[] {
  if (!Array.isArray(fields)) return [];
  return fields.flatMap((field) => {
    const node = field as { name?: string; fields?: unknown; tabs?: { fields?: unknown }[] };
    if (typeof node.name === 'string') return [node.name];
    if (Array.isArray(node.tabs)) return node.tabs.flatMap((tab) => fieldNames(tab.fields));
    return fieldNames(node.fields);
  });
}

/** The first field with this name, however deeply nested. */
function fieldNamed(fields: unknown, name: string): Record<string, unknown> | undefined {
  if (!Array.isArray(fields)) return undefined;
  for (const field of fields) {
    const node = field as { name?: string; fields?: unknown; tabs?: { fields?: unknown }[] };
    if (node.name === name) return node as Record<string, unknown>;
    const nested = Array.isArray(node.tabs)
      ? node.tabs.map((tab) => fieldNamed(tab.fields, name)).find((f) => f !== undefined)
      : fieldNamed(node.fields, name);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

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
    const field = fieldNamed(projects?.fields, 'category');
    const options = field?.['options'] as { value: string }[];
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
    // The client's own account still gets in: Payload's create-first-user
    // operation runs with overrideAccess and does not consult this.
  });

  it('cannot be deleted away, locking her out of her own site', () => {
    expect(users?.access?.delete?.({ req: { user: { id: 1 } } } as never)).toBe(false);
  });
});

describe('globals', () => {
  const global_ = (slug: string) => config.globals.find((entry) => entry.slug === slug);

  it('registers Homepage and Settings', () => {
    expect(global_('homepage')).toBeDefined();
    expect(global_('settings')).toBeDefined();
  });

  it('lets the build read them but only the client change them', () => {
    for (const slug of ['homepage', 'settings']) {
      const access = global_(slug)?.access;
      expect(access?.read?.({ req: {} } as never), slug).toBe(true);
      expect(access?.update?.({ req: {} } as never), slug).toBe(false);
      expect(access?.update?.({ req: { user: { id: 1 } } } as never), slug).toBe(true);
    }
  });

  it('caps the biography where Information would start to scroll', () => {
    // docs/SPEC.md 5: the desktop overlay must not scroll.
    const bio = global_('settings')?.fields.find((f) => 'name' in f && f.name === 'bio');
    expect((bio as { maxLength: number }).maxLength).toBe(1200);
  });

  it('counts the biography beside the field, against the same maximum', () => {
    /*
     * docs/SPEC.md 8.4 asks for a counter; Payload's textarea draws none, only
     * refusing the save. If the cap here and the number in the counter ever
     * part ways, the counter lies — which is the point of this test.
     */
    const bio = global_('settings')?.fields.find((f) => 'name' in f && f.name === 'bio') as
      { maxLength: number; admin?: { components?: { afterInput?: unknown[] } } } | undefined;
    const [counter] = bio?.admin?.components?.afterInput ?? [];
    expect(counter).toMatchObject({
      path: '/components/CharacterCount#CharacterCount',
      clientProps: { max: bio?.maxLength, recommended: 380 },
    });
  });

  it('offers nothing for the look of the site — that is not hers to change', () => {
    const names = (global_('settings')?.fields ?? []).flatMap((field) =>
      'name' in field ? [field.name] : [],
    );
    for (const forbidden of ['theme', 'color', 'font', 'layout']) {
      expect(names.some((name) => name.toLowerCase().includes(forbidden))).toBe(false);
    }
  });
});

describe('the project editor', () => {
  const projects = collection('projects');
  const tabs = projects?.fields.find((field) => field.type === 'tabs') as
    { tabs: { label: string; fields: unknown }[] } | undefined;

  it('separates the details from the photos', () => {
    // docs/SPEC.md 8.2: metadata gets filled in while the photos upload, so
    // the two are not one long form.
    expect(tabs?.tabs.map((tab) => tab.label)).toEqual(['Podrobnosti', 'Fotky']);
  });

  it('puts the photos and the cover together, away from the rest', () => {
    const [details, photos] = tabs?.tabs ?? [];
    expect(fieldNames(photos?.fields)).toEqual(['photos', 'cover']);
    expect(fieldNames(details?.fields)).toContain('title');
    expect(fieldNames(details?.fields)).not.toContain('photos');
  });

  it('keeps the tile preview out of the tabs, beside them', () => {
    const outside = projects?.fields.filter((field) => field.type !== 'tabs');
    expect(fieldNames(outside)).toContain('tilePreview');
  });
});
