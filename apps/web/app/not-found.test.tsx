import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import NotFound from './not-found.tsx';

const html = renderToStaticMarkup(await NotFound());

describe('404', () => {
  it('says what happened and offers the way back', () => {
    expect(html).toContain('404');
    expect(html).toContain('This page doesn’t exist.');
    expect(html).toContain('Back to all work');
    expect(html).toContain('href="/"');
  });

  it('keeps the header and footer, as on the homepage', () => {
    expect(html).toContain('<header');
    expect(html).toContain('<footer');
    expect(html).toContain('Sabrina Kulhankova');
  });

  it('leaves the filter out — there is no grid here to filter', () => {
    expect(html).not.toContain('aria-pressed');
    expect(html).not.toContain('Filter projects by category');
  });

  it('fills the window, so the footer sits at the bottom of a short page', () => {
    expect(html).toContain('min-h-dvh');
    expect(html).toContain('flex-1');
  });

  it('hides the small rule from screen readers — it carries no meaning', () => {
    expect(html).toContain('aria-hidden="true"');
  });
});
