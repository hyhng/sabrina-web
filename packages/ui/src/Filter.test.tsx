import type { FilterValue } from '@sabrina/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { Filter } from './Filter.tsx';

const render = (value: FilterValue) =>
  renderToStaticMarkup(<Filter value={value} onChange={vi.fn()} />);

describe('Filter', () => {
  it('offers All, Commercial, Documentary and Fashion in that order', () => {
    const html = render('all');
    expect(html.indexOf('All')).toBeLessThan(html.indexOf('Commercial'));
    expect(html.indexOf('Commercial')).toBeLessThan(html.indexOf('Documentary'));
    expect(html.indexOf('Documentary')).toBeLessThan(html.indexOf('Fashion'));
  });

  it('marks exactly one item pressed, and All by default', () => {
    const html = render('all');
    expect([...html.matchAll(/aria-pressed="true"/g)]).toHaveLength(1);
    expect([...html.matchAll(/aria-pressed="false"/g)]).toHaveLength(3);
    expect(/aria-pressed="true"[^>]*>.*?All/s.test(html)).toBe(true);
  });

  it('moves the pressed state with the selection', () => {
    expect(/aria-pressed="true"[^>]*>.*?Commercial/s.test(render('commercial'))).toBe(true);
    expect(/aria-pressed="true"[^>]*>.*?Documentary/s.test(render('art'))).toBe(true);
  });

  it('dims the inactive items through the token, not a raw opacity', () => {
    // docs/DESIGN.md wants the contrast fix (open question 6) to be one line.
    const html = render('all');
    expect([...html.matchAll(/text-filter-inactive/g)]).toHaveLength(3);
    expect(html).toContain('text-ink');
  });

  it('keeps every underline in the layout so nothing shifts when you click', () => {
    const html = render('all');
    expect([...html.matchAll(/h-px bg-ink/g)]).toHaveLength(4);
    expect([...html.matchAll(/opacity-0/g)]).toHaveLength(3);
  });

  it('uses buttons, because nothing is being navigated to', () => {
    expect([...render('all').matchAll(/<button type="button"/g)]).toHaveLength(4);
    expect(render('all')).toContain('aria-label="Filter projects by category"');
  });

  it('shows the names the client gave the categories for the categories', () => {
    const html = renderToStaticMarkup(
      <Filter value="all" onChange={() => undefined} labels={{ art: 'Reportage' }} />,
    );
    expect(html).toContain('Reportage');
    expect(html).not.toContain('Documentary');
    // The others keep their default.
    expect(html).toContain('Commercial');
  });
});
