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

  it('is sticky, over the grid, on a background of its own', () => {
    // Without the background the tiles would show through it as it overlaps them.
    expect(html).toContain('sticky top-0 z-40 bg-paper');
  });

  it('starts out showing, and slides without motion for those who ask for none', () => {
    expect(html).not.toContain('-translate-y-full');
    expect(html).toContain('motion-reduce:transition-none');
  });
});

describe('Footer', () => {
  const html = renderToStaticMarkup(<Footer />);

  it('takes the year from the build', () => {
    expect(html).toContain(`© ${new Date().getFullYear()} Sabrina Kulhankova`);
  });

  it('has no navigation: the header carries the links', () => {
    // Removed on 5 Oct 2026; Figma repeats Information, address and Instagram here.
    expect(html).not.toContain('href="/information/"');
    expect(html).not.toContain('mailto:');
    expect(html).not.toContain('instagram');
  });

  it('puts the year left and the credit right, stacked on mobile', () => {
    expect(html).toContain('flex-col');
    expect(html).toContain('tablet:flex-row');
    expect(html).toContain('tablet:justify-between');
    expect(html.indexOf('©')).toBeLessThan(html.indexOf('Created by'));
  });

  it('sits under a rule', () => {
    expect(html).toContain('border-t border-line');
  });

  it('keeps clear of the content above it', () => {
    expect(html).toMatch(/<footer class="mt-\[96px\]/);
    expect(html).toContain('tablet:mt-[120px]');
    expect(html).toContain('desktop:mt-[140px]');
  });

  it('links the whole credit to KeySpace, in a new tab', () => {
    const credit = /<a([^>]*href="https:\/\/keyspace\.cz"[^>]*)>(.*?)<\/a>/.exec(html);
    expect(credit?.[1]).toContain('rel="noreferrer"');
    expect(credit?.[1]).toContain('target="_blank"');
    expect(credit?.[2]).toContain('Created by');
  });

  it('sets only the name in the heavier weight, not the words before it', () => {
    const credit = /<a[^>]*href="https:\/\/keyspace\.cz"[^>]*>(.*?)<\/a>/.exec(html)?.[1] ?? '';
    expect(credit).toMatch(/^Created by <span class="font-medium">KeySpace<\/span>$/);
    // Nor the link itself.
    expect(/<a[^>]*href="https:\/\/keyspace\.cz"[^>]*>/.exec(html)?.[0]).not.toContain(
      'font-medium',
    );
  });

  it('is set larger than Figma: 13, 14, 15px', () => {
    expect(html).toContain('text-[13px]');
    expect(html).toContain('tablet:text-[14px]');
    expect(html).toContain('desktop:text-[15px]');
    // The Figma sizes it replaces.
    expect(html).not.toContain('desktop:text-[12.5px]');
  });
});
