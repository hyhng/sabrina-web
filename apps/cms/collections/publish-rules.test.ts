import { describe, expect, it } from 'vitest';

import { isPublishing, publishBlocker } from './publish-rules.ts';

describe('isPublishing', () => {
  it('is true only for a save that publishes', () => {
    expect(isPublishing({ _status: 'published' })).toBe(true);
    expect(isPublishing({ _status: 'draft' })).toBe(false);
    expect(isPublishing({})).toBe(false);
    expect(isPublishing(undefined)).toBe(false);
  });
});

describe('publishBlocker', () => {
  const ready = { _status: 'published', photos: [1, 2], cover: 1 };

  it('lets a finished project through', () => {
    expect(publishBlocker(ready)).toBeUndefined();
  });

  it('never stands in the way of a draft', () => {
    // A draft is allowed to be half-finished; that is what drafts are for.
    expect(publishBlocker({ _status: 'draft' })).toBeUndefined();
    expect(publishBlocker({ _status: 'draft', photos: [], cover: undefined })).toBeUndefined();
  });

  it('refuses a publish with no photos', () => {
    const message = publishBlocker({ ...ready, photos: [] });
    expect(message).toContain('Nahraj');
    // docs/SPEC.md 8.8: also say what did not happen.
    expect(message).toContain('koncept');
  });

  it('refuses a publish with no cover, and says why it matters', () => {
    const message = publishBlocker({ ...ready, cover: undefined });
    expect(message).toContain('Chybí titulní fotka');
    expect(message).toContain('mřížky');
    expect(message).toContain('koncept');
  });

  it('treats an empty string cover as no cover', () => {
    expect(publishBlocker({ ...ready, cover: '' })).toBeDefined();
    expect(publishBlocker({ ...ready, cover: null })).toBeDefined();
  });

  it('complains about the photos before the cover', () => {
    // Choosing a cover is impossible until something has been uploaded.
    expect(publishBlocker({ _status: 'published', photos: [], cover: undefined })).toContain(
      'žádné fotky',
    );
  });
});
