import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { cs } from '@payloadcms/translations/languages/cs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';

import { Photos } from './collections/Photos.ts';
import { Projects } from './collections/Projects.ts';
import { Users } from './collections/Users.ts';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Payload for the client's admin (docs/TECH.md 6).
 *
 * Czech is the only interface language — the admin is for one person and she
 * is Czech; the public site stays English. One user, no roles, registration
 * off, because there is nobody else to let in.
 *
 * There are no upload collections here on purpose. Payload's uploads generate
 * variants on the server with sharp, and photos are converted in the browser
 * instead (CLAUDE.md rule 10, docs/TECH.md 5). Photos is an ordinary
 * collection holding metadata, and the files go straight to R2.
 *
 * Nothing in here styles the admin with CSS. Payload 4 drops Sass and
 * redesigns it, and overrides would not survive (CLAUDE.md rule 9).
 */
export default buildConfig({
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '— Sabrina Kulhankova',
    },
  },

  collections: [Projects, Photos, Users],
  globals: [],

  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI ?? '' },
  }),

  // Required by Payload even though nothing here is rich text: the biography
  // is plain paragraphs (docs/SPEC.md 8.6).
  editor: lexicalEditor(),

  i18n: {
    supportedLanguages: { cs },
    fallbackLanguage: 'cs',
  },

  secret: process.env.PAYLOAD_SECRET ?? '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
