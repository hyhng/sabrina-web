import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Static export. The public site is plain HTML on a CDN and does not depend
   * on the server (docs/TECH.md 1). This rules out Server Actions,
   * intercepting routes, middleware, cookies(), headers(), rewrites, ISR and
   * next/image's default loader — see CLAUDE.md rule 1. The build fails on
   * them, which is the point.
   */
  output: 'export',

  /** work/fog/index.html, so Cloudflare Pages serves it without rewrite rules. */
  trailingSlash: true,
};

export default nextConfig;
