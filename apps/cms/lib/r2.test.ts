import { describe, expect, it } from 'vitest';

import { isMissing, missingMessage, r2Endpoint, readR2Config } from './r2.ts';

const filled = {
  R2_ACCOUNT_ID: 'acc',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_BUCKET: 'sabrina',
};

describe('readR2Config', () => {
  it('reads the four variables docs/TECH.md 8 lists', () => {
    const config = readR2Config(filled);
    expect(isMissing(config)).toBe(false);
    expect(config).toMatchObject({ accountId: 'acc', bucket: 'sabrina' });
  });

  it('names what is absent instead of failing later with an AWS error', () => {
    const config = readR2Config({ ...filled, R2_BUCKET: undefined });
    expect(isMissing(config) && config.missing).toEqual(['R2_BUCKET']);
  });

  it('treats an empty variable as absent — a blank .env line is not a value', () => {
    const config = readR2Config({ ...filled, R2_SECRET_ACCESS_KEY: '' });
    expect(isMissing(config) && config.missing).toEqual(['R2_SECRET_ACCESS_KEY']);
  });

  it('lists all of them when nothing is set up yet', () => {
    const config = readR2Config({});
    expect(isMissing(config) && config.missing).toHaveLength(4);
  });
});

describe('missingMessage', () => {
  it('names the variables, because whoever reads it is editing .env', () => {
    const message = missingMessage({ missing: ['R2_BUCKET', 'R2_ACCOUNT_ID'] });
    expect(message).toContain('R2_BUCKET');
    expect(message).toContain('R2_ACCOUNT_ID');
    expect(message).toContain('.env');
  });
});

describe('r2Endpoint', () => {
  it('is the account-scoped S3 endpoint R2 serves', () => {
    expect(r2Endpoint('abc123')).toBe('https://abc123.r2.cloudflarestorage.com');
  });
});
