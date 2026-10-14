import { describe, expect, it } from 'vitest';

import { CATEGORIES } from '@sabrina/shared/categories';

import { categoryOrderField, keepCategory, orderIds } from './homepage-order.ts';

describe('homepage order lists', () => {
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
