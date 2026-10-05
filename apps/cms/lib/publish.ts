/**
 * The „Publikovat web" button (docs/SPEC.md 8.7, docs/TECH.md 4.4).
 *
 * The site is static, so what she edits in the admin is not what anyone sees
 * until a build runs. This is the button that starts one: it pokes a Cloudflare
 * deploy hook, which is a URL that means "build the site now" and nothing else —
 * no key, no account, no API. All the logic lives here so the endpoint and the
 * button are both thin, and so the wording can be tested.
 *
 * Publishing is manual on purpose (docs/PHASES.md, question 8). She edits a
 * project across several saves, and a build per save would publish half-finished
 * work and burn the build minutes doing it.
 */

/** Czech: this one is read by her, in the admin. */
export const HOOK_MISSING = 'Publikování ještě není nastavené: v .env chybí CF_DEPLOY_HOOK_URL.';
export const HOOK_REFUSED = 'Cloudflare nepřijal požadavek na publikování.';
export const STARTED = 'Publikuju. Změny budou na webu za pár minut.';

/**
 * Where „Zobrazit web" leads (docs/SPEC.md 8.7). The Pages address until the
 * domain is switched over from the old site; then SITE_URL in the server's
 * .env, and nothing has to be rebuilt.
 */
export const DEFAULT_SITE_URL = 'https://sabrina-web.pages.dev';

export function siteUrl(env: Record<string, string | undefined>): string {
  const url = (env.SITE_URL ?? '').trim();
  return /^https:\/\/[^\s]+$/.test(url) ? url.replace(/\/+$/, '') : DEFAULT_SITE_URL;
}

export function deployHook(env: Record<string, string | undefined>): string | undefined {
  const url = env.CF_DEPLOY_HOOK_URL ?? '';
  return url === '' ? undefined : url;
}

/**
 * What the button says underneath itself. A build takes minutes and she cannot
 * watch it, so the one useful fact is when the last one was asked for.
 */
export function lastPublishedLabel(value: unknown, now: Date = new Date()): string {
  if (typeof value !== 'string' || value === '') {
    return 'Web ještě nebyl publikovaný.';
  }
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return 'Web ještě nebyl publikovaný.';

  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (minutes < 1) return 'Publikováno právě teď.';
  if (minutes < 60) return `Publikováno před ${String(minutes)} min.`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Publikováno před ${String(hours)} h.`;

  // Past a day the exact time stops mattering and the date starts to.
  return `Publikováno ${then.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })}.`;
}
