import { describe, expect, it } from 'vitest';

import { swipeDirection, SWIPE_THRESHOLD } from './Carousel.tsx';

describe('swipeDirection', () => {
  it('reads a drag to the left as moving forward', () => {
    expect(swipeDirection(300, 300 - SWIPE_THRESHOLD)).toBe('next');
    expect(swipeDirection(300, 100)).toBe('next');
  });

  it('reads a drag to the right as going back', () => {
    expect(swipeDirection(100, 100 + SWIPE_THRESHOLD)).toBe('previous');
    expect(swipeDirection(100, 300)).toBe('previous');
  });

  it('ignores anything shorter than the threshold', () => {
    // So scrolling the page vertically does not page the series sideways.
    expect(swipeDirection(300, 300)).toBeNull();
    expect(swipeDirection(300, 300 - SWIPE_THRESHOLD + 1)).toBeNull();
    expect(swipeDirection(300, 300 + SWIPE_THRESHOLD - 1)).toBeNull();
  });

  it('takes a threshold, so the number is not buried in an event handler', () => {
    expect(swipeDirection(0, 10, 5)).toBe('previous');
    expect(swipeDirection(0, 10, 20)).toBeNull();
    expect(SWIPE_THRESHOLD).toBe(48);
  });
});
