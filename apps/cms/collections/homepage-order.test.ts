import { describe, expect, it } from 'vitest';

import { CATEGORIES } from '@sabrina/shared/categories';

import {
  becomesPublished,
  categoryOrderField,
  keepCategory,
  orderChanges,
  orderIds,
  withNewFirst,
} from './homepage-order.ts';

describe('homepage order on publish', () => {
  it('puts a newly published project first', () => {
    expect(withNewFirst([3, 1, 2], 7)).toEqual([7, 3, 1, 2]);
    expect(withNewFirst([], 7)).toEqual([7]);
  });

  it('leaves a project that is already in the order where she put it', () => {
    expect(withNewFirst([3, 7, 2], 7)).toBeUndefined();
    // The global may hold ids as numbers and the hook get them as strings.
    expect(withNewFirst([3, 7], '7')).toBeUndefined();
  });

  it('acts on the save that publishes, not on every save of a published project', () => {
    expect(becomesPublished('published', 'draft')).toBe(true);
    expect(becomesPublished('published', undefined)).toBe(true);
    expect(becomesPublished('published', 'published')).toBe(false);
    expect(becomesPublished('draft', 'draft')).toBe(false);
    expect(becomesPublished('draft', 'published')).toBe(false);
  });

  it('reads the order whether the global holds ids or documents', () => {
    expect(orderIds([1, '2', { id: 3 }, { nope: 1 }, null])).toEqual([1, '2', 3]);
    expect(orderIds(undefined)).toEqual([]);
  });

  it('names one homepage field per category, the name the site reads', () => {
    // apps/web/lib/payload-content.ts looks for `<category>Order`.
    expect(CATEGORIES.map(categoryOrderField)).toEqual([
      'commercialOrder',
      'artOrder',
      'fashionOrder',
    ]);
  });
});

describe('keepCategory', () => {
  const categoryOf = new Map([
    ['4', 'art'],
    ['5', 'fashion'],
    ['6', 'art'],
  ]);

  it('drops a project that was moved to another category, keeping the order of the rest', () => {
    // What blocked every publish on 13 October: 5 had become Fashion.
    expect(keepCategory([4, 5, 6], categoryOf, 'art')).toEqual([4, 6]);
  });

  it('drops a project that no longer exists', () => {
    expect(keepCategory([4, 99], categoryOf, 'art')).toEqual([4]);
  });

  it('leaves a list that is already right exactly as it is', () => {
    expect(keepCategory([6, 4], categoryOf, 'art')).toEqual([6, 4]);
  });
});

describe('orderChanges', () => {
  const homepage = { projects: [4, 5], artOrder: [4, 5], fashionOrder: [] };
  const base = { homepage, status: 'published', previousStatus: 'published' };

  it('puts a newly published project first under All and in its category', () => {
    expect(
      orderChanges({
        ...base,
        id: 9,
        previousStatus: 'draft',
        category: 'fashion',
        previousCategory: 'fashion',
      }),
    ).toEqual({ projects: [9, 4, 5], fashionOrder: [9] });
  });

  it('puts a project moved to another category first in the new list', () => {
    expect(orderChanges({ ...base, id: 5, category: 'fashion', previousCategory: 'art' })).toEqual({
      fashionOrder: [5],
    });
  });

  it('changes nothing for an ordinary save of a published project', () => {
    expect(orderChanges({ ...base, id: 4, category: 'art', previousCategory: 'art' })).toEqual({});
  });

  it('changes nothing for a draft that is not on the homepage, whatever its category does', () => {
    expect(
      orderChanges({
        homepage,
        id: 77,
        status: 'draft',
        previousStatus: 'draft',
        category: 'fashion',
        previousCategory: 'art',
      }),
    ).toEqual({});
  });
});
