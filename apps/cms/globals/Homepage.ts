import { CATEGORIES, CATEGORY_LABELS } from '@sabrina/shared/categories';
import type { GlobalConfig } from 'payload';

import { categoryOrderField, keepCategory, orderIds } from '../collections/homepage-order.ts';

/**
 * The order of the grid (docs/SPEC.md 8.5).
 *
 * She sets the order; the algorithm works out the positions
 * (docs/SPEC.md 3.2). It is its own screen rather than a field on a project,
 * because ordering is a decision about the whole page.
 *
 * There is one order for All and one for each category [rozhodnuto
 * 13. 10. 2026]: what leads under Fashion need not be what leads the page.
 */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Pořadí na homepage',
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  hooks: {
    /*
     * Before anything is validated, each category's list drops the projects
     * that are no longer in that category (homepage-order.ts → keepCategory).
     * Every list is gone through, not only the ones being changed: a save
     * validates the whole document, and one stale entry in a list nobody touched
     * was enough to refuse it.
     */
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        const incoming = (data ?? {}) as Record<string, unknown>;
        const stored = (originalDoc ?? {}) as Record<string, unknown>;
        const lists = CATEGORIES.map((category) => {
          const field = categoryOrderField(category);
          return { category, field, ids: orderIds(incoming[field] ?? stored[field]) };
        });
        const wanted = [...new Set(lists.flatMap((list) => list.ids.map(String)))];
        if (wanted.length === 0) return data;

        const found = await req.payload.find({
          collection: 'projects',
          where: { id: { in: wanted } },
          depth: 0,
          limit: wanted.length,
          pagination: false,
          req,
        });
        const categoryOf = new Map(
          found.docs.map((doc) => [String(doc.id), String(doc.category)] as const),
        );
        const cleaned = Object.fromEntries(
          lists.map((list) => [
            list.field,
            keepCategory(list.ids, categoryOf, list.category).map(Number),
          ]),
        );
        return { ...incoming, ...cleaned };
      },
    ],
  },
  fields: [
    {
      // One tab per order: All first, then her order within each category
      // (docs/SPEC.md 8.5).
      type: 'tabs',
      tabs: [
        {
          label: 'Vše',
          description: 'Pořadí na úvodní stránce, když není zapnutý žádný filtr.',
          fields: [
            {
              name: 'projects',
              type: 'relationship',
              relationTo: 'projects',
              hasMany: true,
              label: 'Pořadí projektů',
              admin: {
                // The grid itself, dragged — not a row of chips with titles.
                components: { Field: '/components/OrderGrid#OrderGrid' },
              },
            },
          ],
        },
        ...CATEGORIES.map((category) => ({
          label: CATEGORY_LABELS[category],
          description: `Pořadí, když je na webu zapnutý filtr ${CATEGORY_LABELS[category]}. Projekt, který tu chybí, se ukáže za ostatními.`,
          fields: [
            {
              name: categoryOrderField(category),
              type: 'relationship' as const,
              relationTo: 'projects' as const,
              hasMany: true as const,
              label: `Pořadí — ${CATEGORY_LABELS[category]}`,
              // Ids are enough: the site matches them to the projects it
              // already has, and populating would send every project twice.
              maxDepth: 0,
              // Only this category's projects can be put on its list.
              filterOptions: { category: { equals: category } },
              admin: { components: { Field: '/components/OrderGrid#OrderGrid' } },
            },
          ],
        })),
      ],
    },
  ],
};
