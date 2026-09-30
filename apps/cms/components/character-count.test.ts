import { describe, expect, it } from 'vitest';

import { characterCount } from './character-count.ts';

// The limits the biography actually uses (globals/Settings.ts).
const BIO = { recommended: 380, max: 1200 };

describe('characterCount', () => {
  it('counts an empty field as zero rather than failing', () => {
    // Payload hands back undefined before the first keystroke.
    expect(characterCount(undefined, BIO)).toMatchObject({ length: 0, tone: 'ok' });
    expect(characterCount(null, BIO)).toMatchObject({ length: 0, tone: 'ok' });
    expect(characterCount('', BIO)).toMatchObject({ length: 0, tone: 'ok' });
  });

  it('stays quiet up to the recommended length', () => {
    const count = characterCount('a'.repeat(380), BIO);
    expect(count).toMatchObject({ length: 380, tone: 'ok' });
    expect(count.message).toBe('380 / 1200 znaků');
  });

  it('warns past the recommended length and says what it costs', () => {
    const count = characterCount('a'.repeat(381), BIO);
    expect(count.tone).toBe('warn');
    expect(count.message).toContain('380');
    // The warning is about the page, not about the number.
    expect(count.message).toContain('Information');
  });

  it('says outright that a text over the maximum will not save', () => {
    const count = characterCount('a'.repeat(1250), BIO);
    expect(count.tone).toBe('over');
    // docs/SPEC.md 8.8: say how far over, so the fix is a known amount of cutting.
    expect(count.message).toContain('50');
    expect(count.message).toContain('neuloží');
  });

  it('always shows the length against the maximum', () => {
    for (const length of [0, 380, 381, 1200, 1201]) {
      expect(characterCount('a'.repeat(length), BIO).message).toContain(`${String(length)} / 1200`);
    }
  });
});
