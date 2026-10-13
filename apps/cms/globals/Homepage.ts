import { CATEGORIES, CATEGORY_LABELS } from '@sabrina/shared/categories';
import type { GlobalConfig } from 'payload';

import { categoryOrderField } from '../collections/homepage-order.ts';

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
                description:
                  'Tažením změň pořadí. Pozice v mřížce se dopočítá sama — každý další projekt jde do nejkratšího sloupce.',
                // Projects are made under Projekty, with their photos; not from here.
                allowCreate: false,
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
              admin: { description: 'Tažením změň pořadí.', allowCreate: false },
            },
          ],
        })),
      ],
    },
    {
      // docs/SPEC.md 8.5: ordering is otherwise blind — she sets a sequence
      // and the algorithm decides the positions. This shows the result.
      name: 'gridPreview',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/OrderPreview#OrderPreview' },
      },
    },
  ],
};
