import { describe, expect, it } from 'vitest';

import { authSettings, SESSION_SECONDS } from './auth-settings.ts';

describe('authSettings', () => {
  it('keeps her signed in for thirty days of not visiting, not two hours', () => {
    expect(SESSION_SECONDS).toBe(2_592_000);
    expect(authSettings({}).tokenExpiration).toBe(SESSION_SECONDS);
  });

  it('marks the session cookie Secure in production, so it never travels over plain HTTP', () => {
    expect(authSettings({ NODE_ENV: 'production' }).cookies.secure).toBe(true);
  });

  it('does not in development, where localhost has no HTTPS and the cookie would be dropped', () => {
    expect(authSettings({ NODE_ENV: 'development' }).cookies.secure).toBe(false);
    expect(authSettings({}).cookies.secure).toBe(false);
  });

  it('is not sent along when she follows a link from another site', () => {
    expect(authSettings({}).cookies.sameSite).toBe('Lax');
  });
});
