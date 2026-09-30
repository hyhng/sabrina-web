import { describe, expect, it } from 'vitest';

import { isLocked, locksOnPublish, nextSlug } from './slug-rules.ts';

describe('nextSlug — while a draft', () => {
  it('follows the title, so renaming before anyone has seen it just works', () => {
    expect(nextSlug({ title: 'Wool — SS26 Campaign' }, undefined)).toBe('wool-ss26-campaign');
    expect(nextSlug({ title: 'Fog at Dawn' }, { slug: 'fog', title: 'Fog' })).toBe('fog-at-dawn');
  });

  it('falls back to the stored title when the save does not carry one', () => {
    expect(nextSlug({}, { title: 'Mirrors' })).toBe('mirrors');
  });

  it('leaves the address alone when there is no title at all', () => {
    expect(nextSlug({ slug: 'kept' }, undefined)).toBe('kept');
    expect(nextSlug({}, undefined)).toBeUndefined();
  });
});

describe('nextSlug — once published', () => {
  it('freezes, whatever the title becomes', () => {
    // A published URL that stops resolving is worse than a stale address.
    expect(nextSlug({ title: 'Renamed Entirely', slugLocked: true }, { slug: 'fog' })).toBe('fog');
    expect(nextSlug({ title: 'Renamed Entirely' }, { slug: 'fog', slugLocked: true })).toBe('fog');
  });

  it('ignores an attempt to set the address by hand', () => {
    expect(nextSlug({ slug: 'something-else' }, { slug: 'fog', slugLocked: true })).toBe('fog');
  });
});

describe('isLocked', () => {
  it('is true if either the save or the stored document says so', () => {
    expect(isLocked({ slugLocked: true }, undefined)).toBe(true);
    expect(isLocked(undefined, { slugLocked: true })).toBe(true);
  });

  it('is false for a fresh draft', () => {
    expect(isLocked({}, {})).toBe(false);
    expect(isLocked(undefined, undefined)).toBe(false);
  });
});

describe('locksOnPublish', () => {
  it('locks on publishing and on nothing else', () => {
    expect(locksOnPublish('published')).toBe(true);
    expect(locksOnPublish('draft')).toBe(false);
    expect(locksOnPublish(undefined)).toBe(false);
  });
});
