import { describe, expect, it } from 'vitest';

import { canDeleteUser } from './user-rules.ts';

describe('canDeleteUser', () => {
  it('lets someone signed in delete another account', () => {
    expect(canDeleteUser(1, 2)).toBe(true);
    expect(canDeleteUser('1', 2)).toBe(true);
  });

  it('never lets anyone delete the account they are using, so somebody can always sign in', () => {
    expect(canDeleteUser(1, 1)).toBe(false);
    expect(canDeleteUser(1, '1')).toBe(false);
  });

  it('refuses without a signed-in user, and a bulk delete with no single target', () => {
    expect(canDeleteUser(undefined, 2)).toBe(false);
    expect(canDeleteUser(1, undefined)).toBe(false);
  });
});
