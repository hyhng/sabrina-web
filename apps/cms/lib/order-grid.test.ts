import { describe, expect, it } from 'vitest';

import { categoryOfField, orderColumns, shownInOrder, toOrderProject } from './order-grid.ts';

const project = (id: string, category: string, published = true, aspectRatio = 0.75) => ({
  id,
  title: id,
  category,
  published,
  cover: { id: `c${id}`, aspectRatio, widths: [400], dominantColor: '#000000' },
});

describe('categoryOfField', () => {
  it('knows which category a list orders, and that the main list orders none', () => {
    expect(categoryOfField('artOrder')).toBe('art');
    expect(categoryOfField('fashionOrder')).toBe('fashion');
    expect(categoryOfField('projects')).toBeUndefined();
  });
});

describe('orderColumns', () => {
  it('deals the projects into three columns and keeps the place each has in her order', () => {
    const columns = orderColumns(['1', '2', '3', '4'].map((id) => project(id, 'art')));
    expect(columns).toHaveLength(3);
    const flat = columns.flat().sort((a, b) => a.position - b.position);
    expect(flat.map((entry) => entry.project.id)).toEqual(['1', '2', '3', '4']);
    // The first goes to the first column, as on the site.
    expect(columns[0]?.[0]?.project.id).toBe('1');
  });

  it('copes with a project that has no cover yet', () => {
    const bare = { id: '9', title: 'x', published: true };
    expect(orderColumns([bare]).flat()).toHaveLength(1);
  });
});

describe('shownInOrder', () => {
  const dated = (id: string, category: string, createdAt: string, published = true) => ({
    ...project(id, category, published),
    createdAt,
  });
  const all = [
    dated('1', 'art', '2026-09-01'),
    dated('2', 'fashion', '2026-10-10'),
    dated('3', 'art', '2026-10-12'),
    dated('4', 'art', '2026-10-13', false),
  ];
  const view = (ids: string[], category?: string) =>
    shownInOrder(all, ids, category).map(({ project: p, placed }) => `${p.id}${placed ? '' : '*'}`);

  it('shows every published project, unplaced ones first and newest first, marked', () => {
    expect(view(['1'])).toEqual(['3*', '2*', '1']);
  });

  it('keeps to the category of the list', () => {
    expect(view(['1'], 'art')).toEqual(['3*', '1']);
    expect(view([], 'fashion')).toEqual(['2*']);
  });

  it('leaves out drafts, even when they are on the list', () => {
    expect(view(['4', '1'])).toEqual(['3*', '2*', '1']);
  });
});

describe('toOrderProject', () => {
  it('reads a Payload record', () => {
    expect(
      toOrderProject({
        id: 4,
        title: 'Fog',
        category: 'art',
        _status: 'published',
        cover: { id: 20, aspectRatio: 0.75, widths: [400, 800], dominantColor: '#222222' },
      }),
    ).toEqual({
      id: '4',
      title: 'Fog',
      category: 'art',
      published: true,
      cover: { id: '20', aspectRatio: 0.75, widths: [400, 800], dominantColor: '#222222' },
    });
  });

  it('has no cover when the record has none or only its id', () => {
    expect(toOrderProject({ id: 4, title: 'x', cover: 20 })?.cover).toBeUndefined();
    expect(toOrderProject({ id: 4, title: 'x', cover: null })?.cover).toBeUndefined();
  });

  it('is nothing for something that is not a record', () => {
    expect(toOrderProject(7)).toBeUndefined();
  });
});
