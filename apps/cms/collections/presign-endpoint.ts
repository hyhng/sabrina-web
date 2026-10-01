import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Endpoint, PayloadRequest } from 'payload';

import { isMissing, missingMessage, r2Client, readR2Config } from '../lib/r2.ts';
import { PRESIGN_TTL_SECONDS, sign } from '../lib/presign.ts';

/**
 * `POST /api/photos/presign` — signed PUT URLs for one photo's files
 * (docs/TECH.md 5).
 *
 * The photo row exists before its bytes do: the browser converts, posts the
 * metadata, and the id that comes back is what the R2 keys are built from.
 * That reverses two steps in the diagram in docs/TECH.md 5 — noted there and in
 * the decisions table in docs/PHASES.md — and it is what lets the keys be
 * derived from the row instead of taken from the request.
 *
 * The bytes never pass through this server (CLAUDE.md rule 10). All it does is
 * sign, which is local arithmetic over the credentials — no call to R2.
 */

function unauthorised(): Response {
  return Response.json({ message: 'Nejsi přihlášená.' }, { status: 403 });
}

async function requestedId(req: PayloadRequest): Promise<string | undefined> {
  try {
    const body: unknown = await req.json?.();
    const id = (body as { photoId?: unknown } | undefined)?.photoId;
    return typeof id === 'string' || typeof id === 'number' ? String(id) : undefined;
  } catch {
    return undefined;
  }
}

export const presignEndpoint: Endpoint = {
  path: '/presign',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return unauthorised();

    const photoId = await requestedId(req);
    if (photoId === undefined) {
      return Response.json({ message: 'Chybí photoId.' }, { status: 400 });
    }

    const config = readR2Config(process.env);
    if (isMissing(config)) {
      // 503, not 500: nothing is broken, it is not set up yet.
      return Response.json({ message: missingMessage(config) }, { status: 503 });
    }

    const row = await req.payload.findByID({
      collection: 'photos',
      id: photoId,
      depth: 0,
      overrideAccess: false,
      user: req.user,
    });

    const client = r2Client(config);
    /*
     * Only the bucket and the key go into the command. ContentType and
     * CacheControl used to be here too, and looked like they were signed; they
     * were not — the signature covers `host` alone — and R2 stored neither. The
     * browser sends both headers itself, and each target says which.
     */
    const signed = await sign(row, (target) =>
      getSignedUrl(client, new PutObjectCommand({ Bucket: config.bucket, Key: target.key }), {
        expiresIn: PRESIGN_TTL_SECONDS,
      }),
    );

    return Response.json({ targets: signed, expiresIn: PRESIGN_TTL_SECONDS });
  },
};
