import type { CollectionConfig } from 'payload';

/**
 * One user: the client (docs/TECH.md 6). No roles, because there is nobody to
 * distinguish her from.
 *
 * Registration is off. Payload still lets the very first user be created
 * through its own create-first-user screen while the collection is empty,
 * which is how she gets in; after that, nobody new.
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
