import { CATEGORIES, CATEGORY_LABELS } from '@sabrina/shared/categories';
import type { CollectionConfig } from 'payload';

/**
 * A project (docs/SPEC.md 8.3, 10). Draft or published at the project level,
 * never per photo — a half-finished series simply stays a draft.
 *
 * The category options come from packages/shared rather than being written out
 * here, so the site, the schema and the admin cannot drift apart
 * (CLAUDE.md rule 4).
 *
 * There is no "tile type" field. It was cut on 14 September: the photographs
 * decide how a tile looks, and the grid works the rest out from the aspect
 * ratio.
 */
export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Projekt', plural: 'Projekty' },
  versions: { drafts: true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'updatedAt'],
  },
  access: {
    // The public build sees published projects only; the rest needs a login.
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Název',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Adresa',
      admin: {
        description:
          'Vygeneruje se z názvu. Po prvním publikování se zamkne, aby odkazy nezmizely.',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: 'Kategorie',
      options: CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
    },
    {
      type: 'row',
      fields: [
        { name: 'year', type: 'number', label: 'Rok' },
        { name: 'client', type: 'text', label: 'Klient' },
        { name: 'clientLine2', type: 'text', label: 'Klient — druhý řádek' },
      ],
    },
    {
      name: 'credits',
      type: 'array',
      label: 'Kredity',
      labels: { singular: 'Kredit', plural: 'Kredity' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'role', type: 'text', required: true, label: 'Role' },
            { name: 'name', type: 'text', required: true, label: 'Jméno' },
          ],
        },
      ],
      admin: { description: 'Zobrazí se jako „Photography · Sabrina Kulhankova".' },
    },
    {
      name: 'photos',
      type: 'relationship',
      relationTo: 'photos',
      hasMany: true,
      label: 'Fotky',
      admin: { description: 'Pořadí tažením. V detailu se listují v tomhle pořadí.' },
    },
    {
      name: 'cover',
      type: 'relationship',
      relationTo: 'photos',
      label: 'Titulní fotka',
      admin: { description: 'Ta, která se ukáže v mřížce. Musí být jedna z fotek projektu.' },
      /*
       * docs/SPEC.md 10: the cover must be one of the project's own photos.
       * Not `required`, because a draft is allowed to be half-finished — the
       * publish button is what refuses, with "Chybí titulní fotka"
       * (docs/SPEC.md 8.8).
       */
      validate: (value: unknown, { siblingData }: { siblingData: unknown }) => {
        if (value === null || value === undefined || value === '') return true;
        const photos = (siblingData as { photos?: unknown }).photos;
        if (!Array.isArray(photos)) return true;
        const ids = photos.map((photo) =>
          typeof photo === 'object' && photo !== null && 'id' in photo
            ? (photo as { id: unknown }).id
            : photo,
        );
        return ids.includes(value) ? true : 'Titulní fotka musí být jedna z fotek projektu.';
      },
    },
  ],
};
