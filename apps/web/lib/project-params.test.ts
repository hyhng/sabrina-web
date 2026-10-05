import { describe, expect, it } from 'vitest';

import { NO_PROJECTS_SLUG, projectParams } from './project-params.ts';

describe('projectParams', () => {
  it('is one address per project', () => {
    expect(projectParams([{ slug: 'fog' }, { slug: 'soda' }])).toEqual([
      { slug: 'fog' },
      { slug: 'soda' },
    ]);
  });

  it('is never empty, which would fail the static export and the whole build', () => {
    expect(projectParams([])).toEqual([{ slug: NO_PROJECTS_SLUG }]);
  });

  it('uses a placeholder no slug from the admin can be', () => {
    // Slugs are generated from titles: lower-case words joined by single hyphens.
    expect(NO_PROJECTS_SLUG).toMatch(/^__/);
  });
});
