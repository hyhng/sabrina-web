import { contentSchema } from '@sabrina/shared';
import { describe, expect, it, vi } from 'vitest';

import { toContent } from './payload-content.ts';

/**
 * The fixtures are Payload's own output, read off a running admin on
 * 30 September — integer ids, `null` for empty fields, `_status` rather than
 * `status`. That is the whole reason this mapping exists.
 */
const photo = {
  id: 20,
  alt: null,
  width: 1604,
  height: 2140,
  aspectRatio: 0.7495327102803738,
  widths: [400, 800, 1200, 1600],
  dominantColor: '#2c2d29',
  originalFilename: 'wool-ss26-campaign.png',
  bytesOriginal: 3_202_253,
  bytesWebp: 156_726,
  createdAt: '2026-09-30T19:04:49.443Z',
  updatedAt: '2026-09-30T19:04:49.447Z',
};

const project = {
  id: 17,
  title: 'Wool — SS26 Campaign',
  slug: 'wool-ss26-campaign',
  slugLocked: true,
  category: 'commercial',
  year: null,
  client: null,
  clientLine2: null,
  credits: [{ id: '6abd5d5126aeb6a98dc585ed', role: 'Photography', name: 'Sabrina Kulhankova' }],
  photos: [photo],
  cover: photo,
  _status: 'published',
  createdAt: '2026-09-30T19:04:49.465Z',
  updatedAt: '2026-09-30T19:04:49.465Z',
};

const settings = {
  id: 1,
  portrait: { ...photo, id: 34 },
  bio: 'Sabrina Kulhankova is a photographer based in Prague.',
  location: 'Based in Prague.',
  email: 'sabrina.kulhankova@gmail.com',
  instagramHandle: '@sabrinakulhankova.photography',
  instagramUrl: 'https://www.instagram.com/sabrinakulhankova.photography/',
  seoDescription: 'Sabrina Kulhankova — photographer based in Prague.',
  ogImage: null,
  globalType: 'settings',
};

const homepage = { id: 1, projects: [project], globalType: 'homepage' };

describe('toContent', () => {
  it('produces something the canonical schema accepts', () => {
    // The point of the whole file: Payload's output, validated as the site's own.
    expect(() => contentSchema.parse(toContent(homepage, settings))).not.toThrow();
  });

  it('turns integer ids into the strings the R2 keys are built from', () => {
    const content = contentSchema.parse(toContent(homepage, settings));
    expect(content.homepage.projects[0]?.photos[0]?.id).toBe('20');
    expect(content.settings.portrait?.id).toBe('34');
  });

  it('reads the project state from _status', () => {
    const content = contentSchema.parse(toContent(homepage, settings));
    expect(content.homepage.projects[0]?.status).toBe('published');
  });

  it('treats an empty field as absent rather than null', () => {
    // zod's .optional() rejects null, and Payload sends null for every blank.
    const content = contentSchema.parse(toContent(homepage, settings));
    const first = content.homepage.projects[0];
    expect(first?.year).toBeUndefined();
    expect(first?.client).toBeUndefined();
    expect(first?.photos[0]?.alt).toBeUndefined();
    expect(content.settings.ogImage).toBeUndefined();
  });

  it('keeps a field that does have a value', () => {
    const filled = { ...homepage, projects: [{ ...project, year: 2026, client: 'Wool' }] };
    const content = contentSchema.parse(toContent(filled, settings));
    expect(content.homepage.projects[0]?.year).toBe(2026);
    expect(content.homepage.projects[0]?.client).toBe('Wool');
  });

  it('drops a project the admin would not hand over, and says which', () => {
    /*
     * A draft read anonymously comes back as a bare id — measured. For a public
     * build that is the drafts filtering themselves out, but silence would turn
     * a broken request into an empty homepage.
     */
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mixed = { ...homepage, projects: [26, project] };
    const content = contentSchema.parse(toContent(mixed, settings));
    expect(content.homepage.projects).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('26'));
    warn.mockRestore();
  });

  it('keeps her order', () => {
    const second = { ...project, id: 18, title: 'Fog', slug: 'fog' };
    const content = contentSchema.parse(
      toContent({ ...homepage, projects: [second, project] }, settings),
    );
    expect(content.homepage.projects.map((entry) => entry.slug)).toEqual([
      'fog',
      'wool-ss26-campaign',
    ]);
  });

  it('survives a homepage with no projects at all', () => {
    expect(toContent({ projects: undefined }, settings)).toMatchObject({
      homepage: { projects: [] },
    });
  });

  it('strips what the schema does not ask for', () => {
    const content = contentSchema.parse(toContent(homepage, settings));
    expect(content.homepage.projects[0]).not.toHaveProperty('slugLocked');
    expect(content.homepage.projects[0]).not.toHaveProperty('_status');
    expect(content.homepage.projects[0]?.photos[0]).not.toHaveProperty('createdAt');
  });

  it('refuses a cover that is not one of the project photos', () => {
    // The schema's own rule; this checks the mapping does not defeat it.
    const broken = {
      ...homepage,
      projects: [{ ...project, cover: { ...photo, id: 99 } }],
    };
    expect(() => contentSchema.parse(toContent(broken, settings))).toThrow();
  });
});
