import { S3Client } from '@aws-sdk/client-s3';

/**
 * The R2 bucket, from the environment (docs/TECH.md 5, 8).
 *
 * All four values come from the client's own Cloudflare account
 * (CLAUDE.md rule 11) and live only in `.env`. Until they are filled in, the
 * upload says so plainly rather than failing with an AWS error.
 *
 * R2 speaks S3 at a single endpoint with `region: 'auto'`, and the bucket name
 * goes in the path rather than the host — hence `forcePathStyle`.
 */

export type R2Config = {
  readonly accountId: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
};

export type R2Missing = { readonly missing: string[] };

const VARIABLES = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];

/**
 * Reads the four variables, or says which are absent. Separate from the client
 * so a test can hand in an environment instead of having one.
 */
export function readR2Config(env: Record<string, string | undefined>): R2Config | R2Missing {
  const missing = VARIABLES.filter((name) => (env[name] ?? '') === '');
  if (missing.length > 0) return { missing };
  return {
    accountId: env.R2_ACCOUNT_ID ?? '',
    accessKeyId: env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? '',
    bucket: env.R2_BUCKET ?? '',
  };
}

export function isMissing(config: R2Config | R2Missing): config is R2Missing {
  return 'missing' in config;
}

/** Czech, and names the variables — the person reading this is setting up. */
export function missingMessage(config: R2Missing): string {
  return `Nahrávání ještě není nastavené: v .env chybí ${config.missing.join(', ')}.`;
}

export function r2Endpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function r2Client(config: R2Config): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: r2Endpoint(config.accountId),
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}
