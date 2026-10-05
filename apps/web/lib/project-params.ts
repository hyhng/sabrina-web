/**
 * The addresses /work/[slug]/ is prerendered for.
 *
 * With `output: 'export'` Next refuses a dynamic route that generates nothing —
 * "at least one route must be generated" — and fails the whole build. Zero
 * published projects is a real state: a new site, or the last project taken
 * down. Without this, unpublishing that project would take the site down with it
 * on the next Publikovat.
 *
 * So an empty list yields one placeholder, which the page answers with
 * notFound(): the build writes a 404 for it and the rest of the site is built
 * as usual. It is never linked and never in the sitemap.
 */
export const NO_PROJECTS_SLUG = '__no-projects';

export function projectParams(projects: readonly { slug: string }[]): { slug: string }[] {
  return projects.length === 0
    ? [{ slug: NO_PROJECTS_SLUG }]
    : projects.map((project) => ({ slug: project.slug }));
}
