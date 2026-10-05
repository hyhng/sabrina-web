/**
 * Who may delete an account: anyone signed in, except the account they are
 * signed in with. Kept apart so it can be tested without a database.
 */
export function canDeleteUser(signedIn: unknown, target: unknown): boolean {
  if (signedIn === undefined || signedIn === null) return false;
  if (target === undefined || target === null) return false;
  return String(signedIn) !== String(target);
}
