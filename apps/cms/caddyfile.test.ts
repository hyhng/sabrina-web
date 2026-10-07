import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const CADDYFILE = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'infra', 'Caddyfile'),
  'utf8',
);

describe('infra/Caddyfile', () => {
  // docs/SPEC.md 9.2: the admin is not searchable. Payload has no robots route, so
  // without these the admin's /robots.txt was a 404 page and crawlers saw no rule.
  it('tells crawlers not to index the admin, in a header and in robots.txt', () => {
    expect(CADDYFILE).toContain('X-Robots-Tag "noindex, nofollow"');
    // A heredoc: a quoted "\n" in a Caddyfile is two characters, not a line break,
    // which is how the first version of this served a one-line robots.txt.
    expect(CADDYFILE).toMatch(
      /handle \/robots\.txt \{\s+respond <<ROBOTS\s+User-agent: \*\s+Disallow: \/\s+ROBOTS 200/,
    );
    expect(CADDYFILE).not.toContain('\\n');
  });

  it('still proxies everything else to the admin', () => {
    expect(CADDYFILE).toMatch(/handle \{\s+reverse_proxy cms:3001\s+\}/);
  });
});
