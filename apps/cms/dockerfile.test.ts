import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const DOCKERFILE = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'infra', 'Dockerfile'),
  'utf8',
);

describe('infra/Dockerfile', () => {
  // The admin's browser code reads NEXT_PUBLIC_IMG_BASE, and Next writes that
  // into the bundle when it builds. A value that only exists when the container
  // runs never reaches the browser: every thumbnail in the photo grid pointed at
  // the admin host and came up broken, with nothing in the logs.
  it('sets the image base before the admin is built, so it is in the browser bundle', () => {
    const arg = DOCKERFILE.indexOf('ARG NEXT_PUBLIC_IMG_BASE=https://');
    const env = DOCKERFILE.indexOf('ENV NEXT_PUBLIC_IMG_BASE=');
    const build = DOCKERFILE.indexOf('RUN pnpm --filter cms build');

    expect(arg).toBeGreaterThan(-1);
    expect(env).toBeGreaterThan(arg);
    expect(build).toBeGreaterThan(env);
  });

  it('bakes in no secret', () => {
    // A placeholder to get through the build is fine; a real value is not.
    expect(DOCKERFILE).not.toMatch(/R2_SECRET|R2_ACCESS_KEY|RESEND_API_KEY/);
  });
});
