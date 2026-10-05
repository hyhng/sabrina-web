import type { CollectionConfig } from 'payload';

import { canDeleteUser } from './user-rules.ts';

/**
 * The people who can sign in to the admin (docs/TECH.md 6). No roles: everyone
 * signed in can do everything.
 *
 * There is no registration. The very first account is made by Payload's
 * create-first-user screen (it runs with overrideAccess); after that, only
 * someone already signed in can add another, from Uživatelé
 * [rozhodnuto 5. 10. 2026, dřív jen jeden účet]. Nobody can delete their own
 * account, so the admin can never end up with nobody able to get in.
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
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req, id }) => canDeleteUser(req.user?.id, id),
  },
  fields: [],
};
