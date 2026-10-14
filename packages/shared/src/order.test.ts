import { describe, expect, it } from 'vitest';

import { unplacedFirst } from './order.ts';

const item = (id: string, createdAt?: string) => ({ id, createdAt });
const ids = (list: { id: string }[]) => list.map((entry) => entry.id);

describe('unplacedFirst', () => {
  it('puts what she has not placed on top, newest first, then her order', () => {
    const all = [
      item('a', '2026-09-01'),
      item('b', '2026-10-10'),
      item('c', '2026-09-20'),
      item('d', '2026-10-12'),
    ];
    expect(ids(unplacedFirst(all, ['c', 'a']))).toEqual(['d', 'b', 'c', 'a']);
  });

  it('is her order alone when everything is placed', () => {
    const all = [item('a', '2026-09-01'), item('b', '2026-10-10')];
    expect(ids(unplacedFirst(all, ['b', 'a']))).toEqual(['b', 'a']);
  });

  it('skips ids on the list that are not among the projects (a draft, a deleted one)', () => {
    expect(ids(unplacedFirst([item('a')], ['x', 'a', 'y']))).toEqual(['a']);
  });

  it('never shows a project twice when the list repeats it', () => {
    expect(ids(unplacedFirst([item('a'), item('b')], ['a', 'a', 'b']))).toEqual(['a', 'b']);
  });

  it('puts a project with no date after the dated ones among the unplaced', () => {
    expect(ids(unplacedFirst([item('a'), item('b', '2026-10-01')], []))).toEqual(['b', 'a']);
  });
});
