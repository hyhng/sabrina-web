import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { describe, expect, it } from 'vitest';

import { PRESIGN_TTL_SECONDS, sign } from './presign.ts';
import { r2Client, readR2Config } from './r2.ts';

/**
 * Signing is local arithmetic over the credentials — nothing is sent to R2 — so
 * the URLs the admin will hand the browser can be checked here, with made-up
 * keys, before the client's real bucket exists. What cannot be checked without
 * it is whether R2 accepts them; that is on the F3 list as a live test.
 */

const config = readR2Config({
  R2_ACCOUNT_ID: 'a1b2c3',
  R2_ACCESS_KEY_ID: 'AKIAEXAMPLE',
  R2_SECRET_ACCESS_KEY: 'not-a-real-secret',
  R2_BUCKET: 'sabrina-photos',
});
if ('missing' in config) throw new Error('the fixture is meant to be complete');

const client = r2Client(config);
const signer = (key: string) =>
  getSignedUrl(client, new PutObjectCommand({ Bucket: config.bucket, Key: key }), {
    expiresIn: PRESIGN_TTL_SECONDS,
  });

describe('signing a PUT for R2', () => {
  it('points at the account endpoint with the bucket in the path', async () => {
    const url = new URL(await signer('photos/17/400.webp'));
    // forcePathStyle: R2 does not do bucket-as-subdomain.
    expect(url.host).toBe('a1b2c3.r2.cloudflarestorage.com');
    expect(url.pathname).toBe('/sabrina-photos/photos/17/400.webp');
  });

  it('expires in ten minutes, signed with SigV4', async () => {
    const url = new URL(await signer('photos/17/400.webp'));
    expect(url.searchParams.get('X-Amz-Expires')).toBe(String(PRESIGN_TTL_SECONDS));
    expect(url.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('keeps the secret out of the URL', async () => {
    const url = await signer('photos/17/400.webp');
    expect(url).not.toContain('not-a-real-secret');
    // The key id is public and has to be there; the secret never is.
    expect(url).toContain('AKIAEXAMPLE');
  });

  it('signs each key separately — one URL cannot be reused for another file', async () => {
    const [a, b] = await Promise.all([signer('photos/17/400.webp'), signer('photos/17/800.webp')]);
    expect(new URL(a).searchParams.get('X-Amz-Signature')).not.toBe(
      new URL(b).searchParams.get('X-Amz-Signature'),
    );
  });

  it('signs a whole photo — every variant and the original', async () => {
    const signed = await sign(
      { id: 17, widths: [400, 800], originalFilename: 'DSC_0041.JPG' },
      signer,
    );
    expect(signed.map((target) => target.of)).toEqual([400, 800, 'original']);
    for (const target of signed) {
      expect(new URL(target.url).pathname).toBe(`/sabrina-photos/${target.key}`);
    }
  });
});
