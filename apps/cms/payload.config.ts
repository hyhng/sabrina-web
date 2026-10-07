import { postgresAdapter } from '@payloadcms/db-postgres';
import { resendAdapter } from '@payloadcms/email-resend';
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
import { emailSettings } from './lib/email-settings.ts';
import { migrations } from './migrations/index.ts';
import { Publish } from './globals/Publish.ts';
import { Settings } from './globals/Settings.ts';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const mail = emailSettings(process.env);

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
    components: { afterNavLinks: ['/components/PublishNav#PublishNav'] },
  },

  collections: [Projects, Photos, Users],
  globals: [Homepage, Settings, Publish],

  // POST /api/publish — asks Cloudflare to rebuild the site.
  endpoints: [publishEndpoint],

  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI ?? '' },
    /*
     * In development Payload pushes the schema straight at the database. In
     * production it does not, and without this a fresh server comes up against
     * an empty database and every page 500s on `relation "users" does not
     * exist` — measured on 1 October against the real image.
     *
     * Passing the migrations here rather than running `payload migrate` as a
     * deploy step is what suits a container: they are imported by the config,
     * so Next traces them into the standalone output, and the server applies
     * them itself on connect. One less thing to remember on the server.
     */
    prodMigrations: migrations,
  }),

  // Required by Payload even though nothing here is rich text: the biography
  // is plain paragraphs (docs/SPEC.md 8.6).
  editor: lexicalEditor(),

  i18n: {
    supportedLanguages: { cs },
    fallbackLanguage: 'cs',
  },

  /*
   * E-mail is for one thing: a forgotten password. Until RESEND_API_KEY and
   * EMAIL_FROM are both set on the server, Payload writes e-mails to the log.
   */
  email:
    mail === undefined
      ? undefined
      : resendAdapter({
          apiKey: mail.apiKey,
          defaultFromAddress: mail.from,
          defaultFromName: mail.fromName,
        }),

  secret: process.env.PAYLOAD_SECRET ?? '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
