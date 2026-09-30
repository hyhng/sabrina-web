import type { CollectionConfig } from 'payload';

/**
 * A photo's metadata (docs/SPEC.md 10). Not a Payload upload collection —
 * those resize on the server with sharp, and the browser does that instead
 * (CLAUDE.md rule 10, docs/TECH.md 5). The bytes live in R2 under
 * photos/<id>/<width>.webp; this row only records what was made.
 *
 * Everything here is written by the upload component, never typed by hand,
 * so the fields are read-only in the admin. The one exception is the alt
 * text, which is hers to write.
 */
export const Photos: CollectionConfig = {
  slug: 'photos',
  labels: { singular: 'Fotka', plural: 'Fotky' },
  admin: {
    useAsTitle: 'originalFilename',
    // Photos are managed inside a project, not as a list of their own.
    hidden: true,
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Popis fotky',
      admin: {
        description: 'Nepovinné. Když zůstane prázdné, doplní se „Název projektu — photo 2".',
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'width', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'height', type: 'number', required: true, admin: { readOnly: true } },
      ],
    },
    {
      name: 'aspectRatio',
      type: 'number',
      required: true,
      admin: {
        readOnly: true,
        description: 'Šířka ÷ výška. Z tohohle se počítá mřížka, aby při načítání neposkakovala.',
      },
    },
    {
      name: 'widths',
      type: 'json',
      required: true,
      admin: { readOnly: true, description: 'Vygenerované šířky, např. [400, 800, 1200].' },
    },
    {
      name: 'dominantColor',
      type: 'text',
      required: true,
      admin: { readOnly: true, description: 'Průměrná barva, drží místo než se fotka načte.' },
    },
    { name: 'originalFilename', type: 'text', required: true, admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'bytesOriginal', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'bytesWebp', type: 'number', required: true, admin: { readOnly: true } },
      ],
    },
  ],
};
