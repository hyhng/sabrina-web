import { describe, expect, it } from 'vitest';

import {
  originalKey,
  originalUrl,
  photoKey,
  photoSrc,
  photoSrcSet,
  photoUrl,
  WEBP_WIDTHS,
} from './photo-url.ts';

const IMG = 'https://img.example.com';
const photo = { id: 'abc123', widths: [400, 1200, 800], originalFilename: 'Wool_SS26.JPG' };

describe('keys', () => {
  it('builds the variant key from TECH 4.2', () => {
    expect(photoKey('abc123', 800)).toBe('photos/abc123/800.webp');
  });

  it('keeps the original extension, lowercased', () => {
    expect(originalKey('abc123', 'Wool_SS26.JPG')).toBe('originals/abc123.jpg');
    expect(originalKey('abc123', 'fog.png')).toBe('originals/abc123.png');
  });

  it('falls back to jpg when the filename has no extension', () => {
    expect(originalKey('abc123', 'scan')).toBe('originals/abc123.jpg');
  });
});

describe('urls', () => {
  it('joins base and key', () => {
    expect(photoUrl('abc123', 400, IMG)).toBe('https://img.example.com/photos/abc123/400.webp');
  });

  it('tolerates a trailing slash on the base', () => {
    expect(photoUrl('abc123', 400, 'https://img.example.com/')).toBe(
      'https://img.example.com/photos/abc123/400.webp',
    );
  });

  it('points src at the widest variant', () => {
    expect(photoSrc(photo, IMG)).toBe('https://img.example.com/photos/abc123/1200.webp');
  });

  it('links the original', () => {
    expect(originalUrl({ id: 'abc123', originalFilename: 'Wool_SS26.JPG' }, IMG)).toBe(
      'https://img.example.com/originals/abc123.jpg',
    );
  });
});

describe('photoSrcSet', () => {
  it('lists every variant narrowest first', () => {
    expect(photoSrcSet(photo, IMG)).toBe(
      'https://img.example.com/photos/abc123/400.webp 400w, ' +
        'https://img.example.com/photos/abc123/800.webp 800w, ' +
        'https://img.example.com/photos/abc123/1200.webp 1200w',
    );
  });

  it('only lists variants that exist, never the full ladder', () => {
    const small = { id: 'x', widths: [400] };
    expect(photoSrcSet(small, IMG)).toBe('https://img.example.com/photos/x/400.webp 400w');
    expect(WEBP_WIDTHS).toEqual([400, 800, 1200, 1600, 2400]);
  });
});
