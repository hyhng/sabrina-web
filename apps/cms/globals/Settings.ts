import type { GlobalConfig } from 'payload';

/**
 * Everything on the site that is not a project (docs/SPEC.md 8.6).
 *
 * The biography is plain text — paragraphs separated by a blank line, no rich
 * text. 1200 characters is where Information would start to scroll on a
 * 1024-tall window, which docs/SPEC.md 5 says it must not; the copy in Figma
 * UI 07 is 380, which is the shape the page was drawn for.
 *
 * There is nothing here for the look of the site. That is not hers to change.
 *
 * Still missing, waiting on open question 3 in docs/PHASES.md: "Vybraní
 * klienti" and "Publikace". Both are lists of names, and adding them to an
 * empty database costs nothing while adding them to a full one is a migration
 * — which is why the question is worth an answer before this ships.
 */
export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Nastavení webu',
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'portrait',
      type: 'relationship',
      relationTo: 'photos',
      label: 'Portrét',
      admin: { description: 'Ukáže se v sekci Information.' },
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'O mně',
      maxLength: 1200,
      admin: {
        description:
          'Odstavce odděl prázdným řádkem. Návrh počítá zhruba s 380 znaky; nad 1200 by se sekce musela rolovat.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'location',
          type: 'text',
          label: 'Lokalita',
          defaultValue: 'Based in Prague.',
        },
        { name: 'email', type: 'email', label: 'E-mail' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'instagramHandle',
          type: 'text',
          label: 'Instagram — jméno',
          admin: { description: 'Včetně zavináče, např. @sabrinakulhankova.photography' },
        },
        { name: 'instagramUrl', type: 'text', label: 'Instagram — odkaz' },
      ],
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      label: 'Popis webu pro vyhledávače',
      maxLength: 200,
      admin: { description: 'Krátká věta, kterou Google ukáže pod názvem.' },
    },
    {
      name: 'ogImage',
      type: 'relationship',
      relationTo: 'photos',
      label: 'Obrázek pro sdílení',
      admin: { description: 'Ukáže se, když někdo sdílí odkaz na web. Nepovinné.' },
    },
  ],
};
