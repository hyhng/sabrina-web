import { describe, expect, it } from 'vitest';

import nextConfig from './next.config.ts';

describe('next.config', () => {
  // The bare address of the admin host has no page of its own; without this it
  // is a 404 for anyone who types it without /admin.
  it('sends the bare address to the admin, temporarily', async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toContainEqual({ source: '/', destination: '/admin', permanent: false });
  });
});
