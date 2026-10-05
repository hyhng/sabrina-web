import { describe, expect, it } from 'vitest';

import { becomesPublished, orderIds, withNewFirst } from './homepage-order.ts';

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
});
