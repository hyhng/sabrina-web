import { CATEGORIES, CATEGORY_LABELS } from '@sabrina/shared/categories';
import type { GlobalConfig } from 'payload';

/**
 * Where Information would start to scroll on a 1024-tall window, which
 * docs/SPEC.md 5 forbids. Payload's validation refuses a save past it; the
 * counter beside the field warns long before that.
 */
const BIO_MAX = 1200;
/** The length of the copy in Figma UI 07 — the shape the page was drawn for. */
const BIO_RECOMMENDED = 380;

/**
 * Everything on the site that is not a project (docs/SPEC.md 8.6).
 *
 * The biography is plain text — paragraphs separated by a blank line, no rich
 * text.
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
      admin: {
        description: 'Ukáže se v sekci Information.',
        /*
         * Uploaded like a project's photos rather than picked from a list of
         * records; Payload's "+" opened a form asking for widths and byte counts.
         */
        components: { Field: '/components/SinglePhotoField#SinglePhotoField' },
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'O mně',
      maxLength: BIO_MAX,
      admin: {
        description: 'Odstavce odděl prázdným řádkem.',
        // Payload's textarea only refuses the save; the counter is ours.
        components: {
          afterInput: [
            {
              path: '/components/CharacterCount#CharacterCount',
              clientProps: { max: BIO_MAX, recommended: BIO_RECOMMENDED },
            },
          ],
        },
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
        {
          name: 'phone',
          type: 'text',
          label: 'Telefon',
          maxLength: 32,
          admin: {
            description:
              'Nepovinné. Ukáže se v Information tak, jak ho napíšeš, např. +420 777 123 456.',
          },
        },
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
      // docs/SPEC.md 3.4: she can rename the categories; she cannot add or
      // remove one — that list is fixed in packages/shared (CLAUDE.md rule 4).
      name: 'categoryLabels',
      type: 'group',
      label: 'Názvy kategorií na webu',
      admin: {
        description:
          'Jak se kategorie jmenují ve filtru a pod fotkami. Prázdné pole znamená výchozí název. V administraci (výběr kategorie u projektu, záložky pořadí) zůstávají výchozí názvy.',
      },
      fields: [
        {
          type: 'row',
          fields: CATEGORIES.map((category) => ({
            name: category,
            type: 'text' as const,
            label: CATEGORY_LABELS[category],
            maxLength: 24,
            admin: { placeholder: CATEGORY_LABELS[category] },
          })),
        },
      ],
    },
    {
      name: 'ogImage',
      type: 'relationship',
      relationTo: 'photos',
      label: 'Obrázek pro sdílení',
      admin: {
        description: 'Ukáže se, když někdo sdílí odkaz na web. Nepovinné.',
        components: { Field: '/components/SinglePhotoField#SinglePhotoField' },
      },
    },
  ],
};
