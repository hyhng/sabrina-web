import { describe, expect, it } from 'vitest';

import { addable, categoryOfField, orderColumns, toOrderProject } from './order-grid.ts';

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

describe('addable', () => {
  const all = [project('1', 'art'), project('2', 'fashion'), project('3', 'art', false)];

  it('offers published projects that are not on the list', () => {
    expect(addable(all, ['1'], undefined).map((entry) => entry.id)).toEqual(['2']);
  });

  it('offers only projects of its own category for a category list', () => {
    expect(addable(all, [], 'art').map((entry) => entry.id)).toEqual(['1']);
    expect(addable(all, [], 'fashion').map((entry) => entry.id)).toEqual(['2']);
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
