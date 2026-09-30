import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

/**
 * The admin runs on a server (docs/TECH.md 1) — unlike apps/web, which is a
 * static export. None of CLAUDE.md rule 1 applies here.
 */
const nextConfig: NextConfig = {};

export default withPayload(nextConfig);
