import type { GlobalConfig } from 'payload';

/**
 * The order of the grid (docs/SPEC.md 8.5).
 *
 * She sets the order; the algorithm works out the positions
 * (docs/SPEC.md 3.2). It is its own screen rather than a field on a project,
 * because ordering is a decision about the whole page.
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
      name: 'projects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      label: 'Pořadí projektů',
      admin: {
        description:
          'Tažením změň pořadí. Pozice v mřížce se dopočítá sama — každý další projekt jde do nejkratšího sloupce.',
      },
    },
  ],
};
