import type { Settings } from '@sabrina/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Footer } from './Footer.tsx';
import { Header } from './Header.tsx';

const settings: Settings = {
  bio: 'bio',
  location: 'Based in Prague.',
  email: 'sabrina.kulhankova@gmail.com',
  instagramHandle: '@sabrinakulhankova.photography',
  instagramUrl: 'https://www.instagram.com/sabrinakulhankova.photography/',
  seoDescription: 'Photographer based in Prague.',
};

describe('Header', () => {
  const html = renderToStaticMarkup(<Header settings={settings} />);

  it('puts the name, without diacritics, on a link home', () => {
    // CLAUDE.md rule 6.
    expect(html).toContain('>Sabrina Kulhankova<');
    expect(html).toContain('href="/"');
    expect(html).not.toContain('Kulhánková');
  });

  it('links Information, the address and Instagram', () => {
    expect(html).toContain('href="/information/"');
    expect(html).toContain('href="mailto:sabrina.kulhankova@gmail.com"');
    expect(html).toContain('href="https://www.instagram.com/sabrinakulhankova.photography/"');
  });

  it('opens Instagram in a new tab safely', () => {
    expect(html).toContain('rel="noreferrer"');
  });

  it('narrows the links as the screen narrows', () => {
    // Address from desktop, Instagram from tablet, Information always.
    expect(html).toMatch(/hidden desktop:inline[^>]*>\s*sabrina/);
    expect(html).toContain('hidden tablet:inline');
  });

  it('renders the filter once, not once per breakpoint', () => {
    const withFilter = renderToStaticMarkup(
      <Header settings={settings} filter={<span data-testid="filter" />} />,
    );
    expect([...withFilter.matchAll(/data-testid="filter"/g)]).toHaveLength(1);
  });

  it('leaves the filter row out entirely when there is no filter', () => {
    expect(html).not.toContain('desktop:-translate-x-1/2');
  });
});

describe('Footer', () => {
  const html = renderToStaticMarkup(<Footer settings={settings} />);

  it('takes the year from the build', () => {
    expect(html).toContain(`© ${new Date().getFullYear()} Sabrina Kulhankova`);
  });

  it('repeats the three links', () => {
    expect(html).toContain('href="/information/"');
    expect(html).toContain('href="mailto:sabrina.kulhankova@gmail.com"');
    expect(html).toContain(settings.instagramUrl);
  });

  it('stacks on mobile and lines up from tablet', () => {
    expect(html).toContain('flex-col');
    expect(html).toContain('tablet:flex-row');
    // display:contents pulls the two short links into the same row as the address.
    expect(html).toContain('tablet:contents');
  });

  it('sits under a rule', () => {
    expect(html).toContain('border-t border-line');
  });
});
