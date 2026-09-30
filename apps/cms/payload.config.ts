import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { cs } from '@payloadcms/translations/languages/cs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';

import { Photos } from './collections/Photos.ts';
import { publishEndpoint } from './endpoints/publish.ts';
import { Projects } from './collections/Projects.ts';
import { Users } from './collections/Users.ts';
import { Homepage } from './globals/Homepage.ts';
import { Publish } from './globals/Publish.ts';
import { Settings } from './globals/Settings.ts';

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
    // Where component paths like '/components/TilePreview' resolve from.
    importMap: { baseDir: dirname },
    /*
     * docs/SPEC.md 8.7: the site is static, so saving is not publishing. The
     * button belongs in the navigation because it is the last step of every
     * session, whichever screen she finishes on.
     */
    components: { afterNavLinks: ['/components/PublishButton#PublishButton'] },
  },

  collections: [Projects, Photos, Users],
  globals: [Homepage, Settings, Publish],

  // POST /api/publish — asks Cloudflare to rebuild the site.
  endpoints: [publishEndpoint],

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
