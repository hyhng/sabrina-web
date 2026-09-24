import { contentSchema } from '@sabrina/shared/schema';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Site } from './Site.tsx';

const seedFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../content/seed.json');
const { homepage, settings } = contentSchema.parse(JSON.parse(readFileSync(seedFile, 'utf8')));

const render = (initialPath: string) =>
  renderToStaticMarkup(
    <Site
      projects={homepage.projects}
      settings={settings}
      imgBase="/seed"
      initialPath={initialPath}
    />,
  );

const transitionNames = (html: string) =>
  [...html.matchAll(/view-transition-name:([a-z0-9-]+)/g)].map(([, name]) => name);

describe('Site — shared transition names', () => {
  it('gives every tile its own name on the grid', () => {
    const names = transitionNames(render('/'));
    expect(names).toHaveLength(homepage.projects.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('never lets two elements claim the same name', () => {
    // A duplicate makes the browser skip the transition entirely, silently.
    for (const project of homepage.projects) {
      const names = transitionNames(render(`/work/${project.slug}/`));
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('moves the open project’s name from its tile to the detail photo', () => {
    const html = render('/work/fog/');
    expect(transitionNames(html).filter((name) => name === 'photo-fog')).toHaveLength(1);
    // It is the detail that holds it: the dialog markup contains it.
    const dialog = html.slice(html.indexOf('role="dialog"'));
    expect(dialog).toContain('view-transition-name:photo-fog');
  });

  it('leaves the other tiles named, so they are still available to morph', () => {
    const names = transitionNames(render('/work/fog/'));
    expect(names).toContain('photo-wool-ss26-campaign');
    expect(names).toHaveLength(homepage.projects.length);
  });

  it('claims no names on Information — nothing morphs there', () => {
    const html = render('/information/');
    const dialog = html.slice(html.indexOf('aria-labelledby="info-title"'));
    expect(dialog).not.toContain('view-transition-name');
  });
});
