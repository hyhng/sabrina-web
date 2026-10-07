import { adminBase, RESET_SUBJECT, resetEmailHtml } from '../lib/email-settings.ts';

/**
 * How long a sign-in lasts in the admin [rozhodnuto 7. 10. 2026].
 *
 * Payload's default is two hours, which for someone who adds a project a few
 * times a month means signing in every time she opens it, and again halfway
 * through a long upload session. The admin renews the session while it is in
 * use, so this is thirty days since the last visit, not thirty days in total.
 *
 * Longer is a trade: a laptop left open and unlocked stays signed in for as long.
 * One account that is hers on a computer that is hers is the case this is for;
 * the login is still refused after five wrong passwords (Payload's default
 * lock of ten minutes), and the cookie is HttpOnly and, in production, Secure,
 * so it is never sent over plain HTTP.
 */
export const SESSION_SECONDS = 60 * 60 * 24 * 30;

export function authSettings(env: Record<string, string | undefined>) {
  const base = adminBase(env);
  return {
    forgotPassword: {
      generateEmailSubject: () => RESET_SUBJECT,
      generateEmailHTML: (args?: { token?: string }) => resetEmailHtml(base, args?.token ?? ''),
    },
    tokenExpiration: SESSION_SECONDS,
    cookies: {
      // Not in development: localhost is plain HTTP and a Secure cookie would
      // never be stored, so nobody could sign in there.
      secure: env.NODE_ENV === 'production',
      sameSite: 'Lax' as const,
    },
  };
}
