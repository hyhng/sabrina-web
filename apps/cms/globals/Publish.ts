import type { GlobalConfig } from 'payload';

/**
 * When the site was last published (docs/SPEC.md 8.7).
 *
 * Hidden from the navigation and written only by the publish endpoint — there is
 * nothing here for her to edit. It is a global of its own rather than a field on
 * Nastavení webu so that machine-written bookkeeping does not sit among the
 * things she types.
 */
export const Publish: GlobalConfig = {
  slug: 'publish',
  label: 'Publikování',
  admin: { hidden: true },
  access: {
    // The button needs to read it; only a logged-in session can change it.
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'lastPublishedAt',
      type: 'date',
      label: 'Poslední publikování',
      admin: { readOnly: true },
    },
  ],
};
