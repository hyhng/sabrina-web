import { withPayload } from '@payloadcms/next/withPayload';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

/**
 * The admin runs on a server (docs/TECH.md 1) — unlike apps/web, which is a
 * static export. None of CLAUDE.md rule 1 applies here.
 */
const nextConfig: NextConfig = {
  /*
   * `standalone` puts the server and only the files it actually needs into
   * .next/standalone, so the image does not carry the whole workspace and its
   * node_modules. It is what the Dockerfile in infra/ copies.
   */
  output: 'standalone',

  /*
   * Without this, tracing starts at apps/cms and the workspace packages
   * (@sabrina/shared, @sabrina/ui) are left out of the output — they live two
   * directories up. The server then starts and fails on the first import.
   */
  outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'),

  /*
   * Payload mounts the admin at /admin and nothing else lives on this host, so
   * the bare address would be a 404. Temporary, so a browser does not remember
   * it for good.
   */
  redirects() {
    return [{ source: '/', destination: '/admin', permanent: false }];
  },
};

export default withPayload(nextConfig);
