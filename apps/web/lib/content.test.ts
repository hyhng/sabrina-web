import { afterEach, describe, expect, it, vi } from 'vitest';

import { contentSource, dropIncompleteProjects, getContent } from './content.ts';

const original = process.env.CONTENT_SOURCE;

afterEach(() => {
  if (original === undefined) delete process.env.CONTENT_SOURCE;
  else process.env.CONTENT_SOURCE = original;
  vi.restoreAllMocks();
});

describe('contentSource', () => {
  it('defaults to seed', () => {
    delete process.env.CONTENT_SOURCE;
    expect(contentSource()).toBe('seed');
  });

  it('accepts payload', () => {
    process.env.CONTENT_SOURCE = 'payload';
    expect(contentSource()).toBe('payload');
  });

  it('rejects anything else instead of quietly falling back', () => {
    process.env.CONTENT_SOURCE = 'cms';
    expect(() => contentSource()).toThrow(/must be one of/);
  });
});

describe('getContent', () => {
  it('reads and validates the seed fixture', async () => {
    delete process.env.CONTENT_SOURCE;
    const content = await getContent();
    expect(content.homepage.projects).toHaveLength(9);
    expect(content.homepage.projects[0]?.title).toBe('Wool — SS26 Campaign');
    expect(content.settings.email).toBe('sabrina.kulhankova@gmail.com');
  });

  it('says which phase wires up payload', async () => {
    process.env.CONTENT_SOURCE = 'payload';
    await expect(getContent()).rejects.toThrow(/F4/);
  });
});

describe('dropIncompleteProjects', () => {
  const good = { title: 'Fog', cover: { id: 'fog' }, photos: [{ id: 'fog' }] };
  const wrap = (projects: unknown[]) => ({ homepage: { projects }, settings: {} });
  const projectsOf = (raw: unknown) =>
    (raw as { homepage: { projects: unknown[] } }).homepage.projects;

  it('keeps a project that has a cover and photos', () => {
    expect(projectsOf(dropIncompleteProjects(wrap([good])))).toEqual([good]);
  });

  it('drops a draft with no photos and says which one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const kept = projectsOf(
      dropIncompleteProjects(wrap([good, { title: 'Untitled draft', cover: null, photos: [] }])),
    );
    expect(kept).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Untitled draft'));
  });

  it('drops a null entry without throwing', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(projectsOf(dropIncompleteProjects(wrap([null, good])))).toHaveLength(1);
  });

  it('passes through anything that is not shaped like content', () => {
    expect(dropIncompleteProjects(null)).toBeNull();
    expect(dropIncompleteProjects({ homepage: {} })).toEqual({ homepage: {} });
  });
});
