import type { CollectionConfig } from 'payload';

/**
 * One user: the client (docs/TECH.md 6). No roles, because there is nobody to
 * distinguish her from.
 *
 * Registration is off. Payload's create-first-user runs with
 * overrideAccess, so the client still gets her account; after that, the
 * refusal here is what closes the door.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  labels: { singular: 'Uživatel', plural: 'Uživatelé' },
  admin: {
    useAsTitle: 'email',
    // Nothing here for her to manage day to day.
    hidden: false,
  },
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: () => false,
  },
  fields: [],
};
