/**
 * The admin's outgoing e-mail (docs/TECH.md: Resend, only for a forgotten
 * password). Pure functions of the environment, so the rules are testable
 * without sending anything.
 */

export interface EmailSettings {
  apiKey: string;
  /** The address mail comes from; must be on a domain verified in Resend. */
  from: string;
  fromName: string;
}

/**
 * Nothing until both the key and the sender are set. Without them Payload falls
 * back to writing e-mails into the log, which is what it has done so far and is
 * the safe thing to do when a half-configured server would otherwise fail every
 * password reset with an error she cannot read.
 */
export function emailSettings(env: Record<string, string | undefined>): EmailSettings | undefined {
  const apiKey = (env.RESEND_API_KEY ?? '').trim();
  const from = (env.EMAIL_FROM ?? '').trim();
  if (apiKey === '' || from === '') return undefined;
  // Resend lets a "Name <address>" through; the adapter wants the two apart.
  const named = /^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/.exec(from);
  if (named !== null) {
    return {
      apiKey,
      from: named[2] ?? from,
      fromName: (named[1] ?? '').trim() || 'Sabrina Kulhankova',
    };
  }
  if (!/^[^<>\s]+@[^<>\s]+$/.test(from)) return undefined;
  return { apiKey, from, fromName: 'Sabrina Kulhankova' };
}

/** Where the link in a reset e-mail points: the admin's own public address. */
export function adminBase(env: Record<string, string | undefined>): string {
  const url = (env.PAYLOAD_PUBLIC_URL ?? '').trim().replace(/\/+$/, '');
  return /^https?:\/\/[^\s]+$/.test(url) ? url : 'http://localhost:3001';
}

export const RESET_SUBJECT = 'Obnovení hesla do administrace webu';

/**
 * The reset e-mail, in Czech, like the rest of the admin. Payload's own is
 * English. The token is a one-time secret in a link; it is not logged or shown
 * anywhere but here.
 */
export function resetEmailHtml(base: string, token: string): string {
  const link = `${base}/admin/reset/${encodeURIComponent(token)}`;
  return `<p>Ahoj,</p>
<p>někdo požádal o obnovení hesla do administrace webu Sabrina Kulhankova. Nové heslo si nastavíš na této stránce:</p>
<p><a href="${link}">${link}</a></p>
<p>Odkaz platí hodinu a jde použít jednou. Pokud o obnovení nežádáš, nic nedělej, heslo zůstane, jak bylo.</p>`;
}
