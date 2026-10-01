/**
 * Fetches the content from Payload before the build (docs/PHASES.md F4).
 *
 * Why a step of its own rather than a fetch inside the build: `output: 'export'`
 * only prerenders a route whose data is cacheable, and Next's fetch cache
 * survives between builds — measured, not assumed. A project renamed in the
 * admin did not appear in the next build's HTML. Since the whole point of the
 * Publikovat button is that a change shows up, a cached fetch is the one thing
 * this must not rely on.
 *
 * So the content is fetched once, here, by an ordinary Node process that Next
 * knows nothing about, and written to content/payload.json. The build then
 * reads a file — exactly as it does with the seed. One request per build,
 * always fresh, and the file left behind is a record of what was built.
 *
 * Runs on every build and does nothing unless CONTENT_SOURCE=payload.
 *
 * Usage: pnpm --filter web build  (or node scripts/fetch-content.mts)
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { contentSchema } from '@sabrina/shared';

import { toContent } from '../lib/payload-content.ts';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = path.join(WEB_ROOT, 'content', 'payload.json');

/** homepage → projects → photos needs 2; settings only its own photos. */
const DEPTH = { homepage: 2, settings: 1 } as const;

/*
 * `next build` reads .env.production on its own; this script runs under plain
 * node before it, so it has to do the same, or the two would disagree about where
 * the content comes from. A variable already set in the shell is left alone.
 */
const ENV_FILE = path.join(WEB_ROOT, '.env.production');
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

if ((process.env.CONTENT_SOURCE ?? 'seed') !== 'payload') {
  console.log('[content] CONTENT_SOURCE is not payload — nothing to fetch.');
  process.exit(0);
}

const base = (process.env.PAYLOAD_PUBLIC_URL ?? '').replace(/\/+$/, '');
if (base === '') {
  console.error('[content] CONTENT_SOURCE=payload needs PAYLOAD_PUBLIC_URL — see .env.example');
  process.exit(1);
}

/**
 * Read as an anonymous visitor, deliberately: access control in the collections
 * is what keeps drafts out of the build, so the build has no business holding a
 * token that would let it see them.
 */
async function readGlobal(name: keyof typeof DEPTH): Promise<unknown> {
  const url = `${base}/api/globals/${name}?depth=${String(DEPTH[name])}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`${url} answered ${String(response.status)} ${response.statusText}`);
  }
  return response.json();
}

const [homepage, settings] = await Promise.all([readGlobal('homepage'), readGlobal('settings')]);
const content = toContent(homepage, settings);

/*
 * Validated here as well as in the build. Failing at this point costs a clear
 * message about which field is wrong; failing inside the prerender costs a
 * stack trace through eight workers.
 */
const parsed = contentSchema.parse(content);

await mkdir(path.dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, `${JSON.stringify(content, null, 2)}\n`, 'utf8');

console.log(
  `[content] ${String(parsed.homepage.projects.length)} projects from ${base} → content/payload.json`,
);
