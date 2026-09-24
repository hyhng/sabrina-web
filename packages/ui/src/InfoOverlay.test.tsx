import type { Settings } from '@sabrina/shared/schema';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { InfoOverlay } from './InfoOverlay.tsx';

const portrait = {
  id: 'portrait',
  width: 586,
  height: 744,
  aspectRatio: 586 / 744,
  widths: [400],
  dominantColor: '#0f0c07',
  originalFilename: 'portrait.png',
  bytesOriginal: 1,
  bytesWebp: 1,
};

const settings: Settings = {
  portrait,
  bio: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.',
  location: 'Based in Prague.',
  email: 'sabrina.kulhankova@gmail.com',
  instagramHandle: '@sabrinakulhankova.photography',
  instagramUrl: 'https://www.instagram.com/sabrinakulhankova.photography/',
  seoDescription: 'Photographer based in Prague.',
};

const render = (value: Settings) =>
  renderToStaticMarkup(<InfoOverlay settings={value} imgBase="/seed" onClose={vi.fn()} />);

describe('InfoOverlay', () => {
  const html = render(settings);

  it('is a labelled modal dialog', () => {
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="info-title"');
    expect(html).toContain('Sabrina Kulhankova, photographer.');
  });

  it('puts a white veil over the grid from 768 up, and paper below', () => {
    // docs/SPEC.md 5: a real layer at 93%, not the grid turned down.
    expect(html).toContain('detail:bg-white/93');
    expect(html).toContain('bg-paper');
  });

  it('breaks the bio on blank lines, as the CMS stores it', () => {
    expect([...html.matchAll(/<p class="mb-\[1\.55em\] last:mb-0">/g)]).toHaveLength(3);
    expect(html).toContain('Second paragraph.');
  });

  it('ignores stray whitespace between paragraphs', () => {
    const messy = render({ ...settings, bio: 'One.\n\n   \n\nTwo.\n\n\n' });
    expect([...messy.matchAll(/<p class="mb-\[1\.55em\] last:mb-0">/g)]).toHaveLength(2);
  });

  it('gives contact details as links, never a form', () => {
    expect(html).toContain('href="mailto:sabrina.kulhankova@gmail.com"');
    expect(html).toContain('href="https://www.instagram.com/sabrinakulhankova.photography/"');
    expect(html).toContain('@sabrinakulhankova.photography');
    expect(html).toContain('Based in Prague.');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('<input');
  });

  it('shows the portrait and survives not having one', () => {
    expect(html).toContain('/seed/photos/portrait/400.webp');
    const without = render({ ...settings, portrait: undefined });
    expect(without).not.toContain('/seed/photos/portrait/');
    expect(without).toContain('Second paragraph.');
  });

  it('keeps the three columns in the artboard proportions', () => {
    // 343 : 471 : 340 of the 1321px UI 07 gives the content.
    expect(html).toContain('detail:w-[25.96%]');
    expect(html).toContain('detail:w-[35.66%]');
    expect(html).toContain('detail:w-[25.74%]');
  });
});
