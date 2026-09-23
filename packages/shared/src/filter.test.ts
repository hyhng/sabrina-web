import { describe, expect, it } from 'vitest';

import { filterProjects, filterUrl, FILTER_LABELS, FILTER_VALUES, readFilter } from './filter.ts';

const projects = [
  { slug: 'wool', category: 'commercial' as const },
  { slug: 'fog', category: 'art' as const },
  { slug: 'soda', category: 'commercial' as const },
];

describe('readFilter', () => {
  it('accepts the two categories', () => {
    expect(readFilter('commercial')).toBe('commercial');
    expect(readFilter('art')).toBe('art');
  });

  it('falls back to all rather than showing nothing', () => {
    // docs/SPEC.md 2: an invalid value means All.
    for (const raw of [null, undefined, '', 'All', 'editorial', 'ART', '../etc/passwd']) {
      expect(readFilter(raw)).toBe('all');
    }
  });
});

describe('filterProjects', () => {
  it('returns everything for all', () => {
    expect(filterProjects(projects, 'all')).toHaveLength(3);
  });

  it('narrows to one category', () => {
    expect(filterProjects(projects, 'art').map((p) => p.slug)).toEqual(['fog']);
    expect(filterProjects(projects, 'commercial').map((p) => p.slug)).toEqual(['wool', 'soda']);
  });

  it('does not mutate the input', () => {
    const copy = [...projects];
    filterProjects(projects, 'art');
    expect(projects).toEqual(copy);
  });
});

describe('filterUrl', () => {
  it('drops the query for all, so the default URL stays clean', () => {
    expect(filterUrl('/', 'all')).toBe('/');
    expect(filterUrl('/work/fog/', 'all')).toBe('/work/fog/');
  });

  it('keeps the filter when a detail is open (docs/SPEC.md 2)', () => {
    expect(filterUrl('/work/fog/', 'art')).toBe('/work/fog/?filter=art');
  });
});

describe('the three filter items', () => {
  it('are All, Commercial and Art in that order', () => {
    expect(FILTER_VALUES).toEqual(['all', 'commercial', 'art']);
    expect(FILTER_VALUES.map((v) => FILTER_LABELS[v])).toEqual(['All', 'Commercial', 'Art']);
  });
});
