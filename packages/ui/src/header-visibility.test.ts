import { describe, expect, it } from 'vitest';

import { JITTER, nextHeaderScroll, type HeaderScroll } from './header-visibility.ts';

const HEIGHT = 80;
const at = (lastY: number, hidden = false): HeaderScroll => ({ hidden, lastY });

describe('nextHeaderScroll', () => {
  it('hides when the visitor scrolls down past the header', () => {
    expect(nextHeaderScroll(at(300), 400, HEIGHT)).toEqual({ hidden: true, lastY: 400 });
  });

  it('brings it back as soon as they scroll up', () => {
    expect(nextHeaderScroll(at(400, true), 380, HEIGHT)).toEqual({ hidden: false, lastY: 380 });
  });

  it('is always there at the top, and does not hide on the way down from it', () => {
    expect(nextHeaderScroll(at(500, true), 0, HEIGHT)).toEqual({ hidden: false, lastY: 0 });
    // Still inside the header's own height: nothing to make room for yet.
    expect(nextHeaderScroll(at(0), HEIGHT, HEIGHT)).toEqual({ hidden: false, lastY: HEIGHT });
  });

  it('treats the negative position of an iOS bounce as the top', () => {
    expect(nextHeaderScroll(at(40, true), -30, HEIGHT)).toEqual({ hidden: false, lastY: -30 });
  });

  it('ignores a wobble smaller than the jitter', () => {
    const shown = at(400);
    expect(nextHeaderScroll(shown, 400 + JITTER - 1, HEIGHT)).toBe(shown);
    const hidden = at(400, true);
    expect(nextHeaderScroll(hidden, 400 - JITTER + 1, HEIGHT)).toBe(hidden);
  });

  it('lets a slow drift add up, because lastY stays where it was', () => {
    let state = at(400);
    for (const y of [402, 404, 406]) state = nextHeaderScroll(state, y, HEIGHT);
    expect(state).toEqual({ hidden: true, lastY: 406 });
  });

  it('acts at exactly the jitter distance', () => {
    expect(nextHeaderScroll(at(400), 400 + JITTER, HEIGHT).hidden).toBe(true);
    expect(nextHeaderScroll(at(400, true), 400 - JITTER, HEIGHT).hidden).toBe(false);
  });
});
