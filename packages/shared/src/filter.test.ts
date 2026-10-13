import { describe, expect, it } from 'vitest';

import {
  filterProjects,
  filterUrl,
  FILTER_LABELS,
  FILTER_VALUES,
  orderedFor,
  readFilter,
} from './filter.ts';

const projects = [
  { slug: 'wool', category: 'commercial' as const },
  { slug: 'fog', category: 'art' as const },
  { slug: 'soda', category: 'commercial' as const },
];

describe('readFilter', () => {
  it('accepts every category', () => {
    expect(readFilter('commercial')).toBe('commercial');
    expect(readFilter('art')).toBe('art');
    expect(readFilter('fashion')).toBe('fashion');
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

describe('the filter items', () => {
  it('are All, then Commercial, Art and Fashion in that order', () => {
    expect(FILTER_VALUES).toEqual(['all', 'commercial', 'art', 'fashion']);
    expect(FILTER_VALUES.map((v) => FILTER_LABELS[v])).toEqual([
      'All',
      'Commercial',
      'Art',
      'Fashion',
    ]);
  });
});

describe('orderedFor', () => {
  const all = [
    { slug: 'a', category: 'art' as const },
    { slug: 'w', category: 'commercial' as const },
    { slug: 'b', category: 'art' as const },
    { slug: 'c', category: 'art' as const },
  ];
  const slugs = (list: { slug: string }[]) => list.map((project) => project.slug);

  it('leaves All in the homepage order, whatever the category lists say', () => {
    expect(slugs(orderedFor(all, 'all', { art: ['c', 'b', 'a'] }))).toEqual(['a', 'w', 'b', 'c']);
  });

  it('shows a category in her order for that category', () => {
    expect(slugs(orderedFor(all, 'art', { art: ['c', 'a', 'b'] }))).toEqual(['c', 'a', 'b']);
  });

  it('falls back to the homepage order when she has set none', () => {
    expect(slugs(orderedFor(all, 'art'))).toEqual(['a', 'b', 'c']);
    expect(slugs(orderedFor(all, 'art', {}))).toEqual(['a', 'b', 'c']);
  });

  it('never loses a project she has not placed: it follows the placed ones', () => {
    expect(slugs(orderedFor(all, 'art', { art: ['c'] }))).toEqual(['c', 'a', 'b']);
  });

  it('ignores a slug on the list that is no longer in the category', () => {
    expect(slugs(orderedFor(all, 'art', { art: ['w', 'b', 'gone'] }))).toEqual(['b', 'a', 'c']);
  });

  it('does not reorder the list it was given', () => {
    orderedFor(all, 'art', { art: ['c', 'b', 'a'] });
    expect(slugs(all)).toEqual(['a', 'w', 'b', 'c']);
  });
});
