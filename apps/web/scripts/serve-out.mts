/**
 * Serves apps/web/out the way Cloudflare Pages will, so the end-to-end tests
 * run against the thing that actually ships rather than a dev server.
 *
 * trailingSlash is on, so /work/fog/ is work/fog/index.html. Anything with no
 * file behind it gets 404.html with a 404 status, which is what Pages does.
 *
 * Usage: node scripts/serve-out.mts [port]
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const PORT = Number(process.argv[2] ?? 4173);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

async function resolve(urlPath: string): Promise<string | undefined> {
  const clean = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  // Keep the request inside out/, whatever it asks for.
  const target = path.join(ROOT, path.normalize(clean).replace(/^(\.\.[/\\])+/, ''));
  if (!target.startsWith(ROOT)) return undefined;

  for (const candidate of [target, path.join(target, 'index.html')]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // try the next one
    }
  }
  return undefined;
}

createServer((request, response) => {
  void (async () => {
    const file = await resolve(request.url ?? '/');
    if (file === undefined) {
      response.writeHead(404, { 'content-type': TYPES['.html'] ?? 'text/html' });
      createReadStream(path.join(ROOT, '404.html')).pipe(response);
      return;
    }
    response.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(response);
  })();
}).listen(PORT, () => {
  console.log(`serving ${ROOT} on http://localhost:${String(PORT)}`);
});
