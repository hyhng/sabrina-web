import { describe, expect, it } from 'vitest';

import { coverOptions } from './cover-options.ts';

describe('coverOptions', () => {
  it('offers the project’s own photos', () => {
    expect(coverOptions([1, 2, 3])).toEqual({ id: { in: [1, 2, 3] } });
  });

  it('reads ids out of populated photos too', () => {
    // Depending on depth, Payload hands back ids or whole documents.
    expect(coverOptions([{ id: 7 }, { id: 9 }])).toEqual({ id: { in: [7, 9] } });
  });

  it('offers nothing before anything has been uploaded', () => {
    // Rather than every photo in the database, including other series'.
    expect(coverOptions([])).toBe(false);
    expect(coverOptions(undefined)).toBe(false);
    expect(coverOptions(null)).toBe(false);
  });

  it('survives a shape it did not expect', () => {
    expect(coverOptions('nonsense')).toBe(false);
    expect(coverOptions({ id: 1 })).toBe(false);
  });
});
