import { describe, expect, it } from 'vitest';
import { CATEGORIES, projectSchema, settingsSchema } from './index.ts';

const photo = {
  id: 'p1',
  width: 2000,
  height: 2667,
  aspectRatio: 2000 / 2667,
  widths: [400, 800, 1200],
  dominantColor: '#A19C91',
  originalFilename: 'wool.jpg',
  bytesOriginal: 8_200_000,
  bytesWebp: 310_000,
};

describe('schema smoke', () => {
  it('accepts a valid project', () => {
    const r = projectSchema.safeParse({
      title: 'Wool — SS26 Campaign',
      slug: 'wool-ss26-campaign',
      category: 'commercial',
      photos: [photo],
      cover: photo,
      status: 'published',
    });
    expect(r.success).toBe(true);
  });
  it('rejects a cover that is not among photos', () => {
    const r = projectSchema.safeParse({
      title: 'Fog',
      slug: 'fog',
      category: 'art',
      photos: [photo],
      cover: { ...photo, id: 'other' },
      status: 'published',
    });
    expect(r.success).toBe(false);
  });
  it('rejects an aspectRatio that disagrees with the pixels', () => {
    expect(
      projectSchema.safeParse({
        title: 'Fog',
        slug: 'fog',
        category: 'art',
        photos: [{ ...photo, aspectRatio: 1.5 }],
        cover: { ...photo, aspectRatio: 1.5 },
        status: 'published',
      }).success,
    ).toBe(false);
  });
  it('rejects an unknown category', () => {
    expect(
      projectSchema.safeParse({
        title: 'X',
        slug: 'x',
        category: 'editorial',
        photos: [photo],
        cover: photo,
        status: 'published',
      }).success,
    ).toBe(false);
    expect(CATEGORIES).toEqual(['commercial', 'art']);
  });
  it('validates settings', () => {
    expect(
      settingsSchema.safeParse({
        bio: 'hi',
        location: 'Based in Prague.',
        email: 'sabrina.kulhankova@gmail.com',
        instagramHandle: '@sabrinakulhankova.photography',
        instagramUrl: 'https://instagram.com/sabrinakulhankova.photography',
        seoDescription: 'Photographer based in Prague.',
      }).success,
    ).toBe(true);
  });
});
