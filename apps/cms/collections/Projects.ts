import { CATEGORIES, CATEGORY_LABELS } from '@sabrina/shared/categories';
import { APIError, type CollectionConfig } from 'payload';

import { coverOptions } from './cover-options.ts';
import { becomesPublished, orderIds, withNewFirst } from './homepage-order.ts';
import { publishBlocker } from './publish-rules.ts';
import { isLocked, locksOnPublish, nextSlug } from './slug-rules.ts';

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
  hooks: {
    // The address follows the title until the project is published, then
    // freezes (docs/SPEC.md 8.3). The rules live in slug-rules.ts so they can
    // be tested without a database.
    beforeValidate: [
      ({ data, originalDoc }) => {
        const slug = nextSlug(data, originalDoc);
        return slug === undefined ? data : { ...data, slug };
      },
    ],
    beforeChange: [
      ({ data }) => {
        // docs/SPEC.md 8.8: refuse the publish here, while she is looking at
        // it, rather than letting the site quietly drop the project later.
        const blocker = publishBlocker(data);
        if (blocker !== undefined) throw new APIError(blocker, 400);
        return locksOnPublish(data._status) ? { ...data, slugLocked: true } : data;
      },
    ],
    afterChange: [
      // docs/SPEC.md 8.5: a project that goes public joins the homepage order
      // at the top; without this it was published and still not on the site.
      async ({ doc, previousDoc, req }) => {
        if (!becomesPublished(doc._status, previousDoc?._status)) return doc;
        const homepage = await req.payload.findGlobal({ slug: 'homepage', depth: 0, req });
        const next = withNewFirst(orderIds(homepage.projects), doc.id);
        if (next !== undefined) {
          await req.payload.updateGlobal({
            slug: 'homepage',
            data: { projects: next.map(Number) },
            req,
          });
        }
        return doc;
      },
    ],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'updatedAt'],
    // docs/SPEC.md 8.2: a dialog that asks for the title and nothing else.
    components: { beforeListTable: ['/components/NewProject#NewProject'] },
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
      // docs/SPEC.md 8.2: metadata is filled in while the photos upload,
      // so the two live on separate tabs rather than one long form.
      type: 'tabs',
      tabs: [
        {
          label: 'Podrobnosti',
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
              // Read-only in the admin once locked; the hook enforces it on the way in.
              access: {
                update: ({ data }) => !isLocked(data, undefined),
              },
            },
            {
              name: 'slugLocked',
              type: 'checkbox',
              defaultValue: false,
              admin: { hidden: true },
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
          ],
        },
        {
          label: 'Fotky',
          description: 'Nahraj fotky, přetažením je seřaď a v detailu vyber titulní.',
          fields: [
            {
              // docs/SPEC.md 8.3, 8.4: the photos as a grid of pictures — upload,
              // status, order, cover and delete in one place. It drives the two
              // hidden fields below.
              name: 'upload',
              type: 'ui',
              admin: { components: { Field: '/components/PhotoGrid#PhotoGrid' } },
            },
            {
              name: 'photos',
              type: 'relationship',
              relationTo: 'photos',
              hasMany: true,
              label: 'Fotky',
              // Driven from the photo grid. Hidden, not removed: Payload still keeps
              // the value in the form and saves it, which is all this field is for.
              admin: { hidden: true },
            },
            {
              name: 'cover',
              type: 'relationship',
              relationTo: 'photos',
              label: 'Titulní fotka',
              // Chosen in the photo grid ("Nastavit jako titulní"), not from a list of
              // file names. Still validated and filtered as before.
              admin: { hidden: true },
              // Only this project's photos; see cover-options.ts.
              filterOptions: ({ siblingData }) =>
                coverOptions((siblingData as { photos?: unknown }).photos),
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
                return ids.includes(value)
                  ? true
                  : 'Titulní fotka musí být jedna z fotek projektu.';
              },
            },
          ],
        },
      ],
    },
    {
      // docs/SPEC.md 8.4: the queue keeps running when she is on another tab, so
      // something that is always on screen has to say so.
      name: 'uploadStatus',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/UploadStatus#UploadStatus' },
      },
    },
    {
      // docs/SPEC.md 8.3: the tile as the site will draw it, beside the fields
      // that decide it. The same component the grid uses, not an impression.
      name: 'tilePreview',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/TilePreview#TilePreview' },
      },
    },
  ],
};
