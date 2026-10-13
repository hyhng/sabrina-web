import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  AUTO_ADVANCE_MS,
  Carousel,
  shouldAutoAdvance,
  swipeDirection,
  SWIPE_THRESHOLD,
} from './Carousel.tsx';

const photo = (id: string) => ({
  id,
  width: 1000,
  height: 1500,
  aspectRatio: 1000 / 1500,
  widths: [400, 800],
  dominantColor: '#372f2b',
  originalFilename: `${id}.jpg`,
  bytesOriginal: 1,
  bytesWebp: 1,
});

describe('Carousel arrows', () => {
  const html = renderToStaticMarkup(
    <Carousel
      photos={[photo('a'), photo('b'), photo('c')]}
      imgBase="/seed"
      title="T"
      startIndex={1}
    />,
  );

  it('sit 16px in from the photo, not flush with its edge', () => {
    // Changed on 5 Oct 2026: flush with the edge they read as part of the frame.
    expect(html).toContain('absolute left-[16px] top-1/2');
    expect(html).toContain('absolute right-[16px] top-1/2');
    expect(html).not.toContain('absolute left-0 top-1/2');
    expect(html).not.toContain('absolute right-0 top-1/2');
  });
});

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

describe('shouldAutoAdvance', () => {
  const running = {
    auto: true,
    index: 0,
    last: 3,
    hovered: false,
    full: false,
    hidden: false,
    reducedMotion: false,
  };

  it('moves the series on when nobody is doing anything', () => {
    expect(shouldAutoAdvance(running)).toBe(true);
    expect(AUTO_ADVANCE_MS).toBe(4000);
  });

  it('stops once the visitor has taken over', () => {
    expect(shouldAutoAdvance({ ...running, auto: false })).toBe(false);
  });

  it('stops on the last photo, because the series does not wrap', () => {
    expect(shouldAutoAdvance({ ...running, index: 3 })).toBe(false);
    expect(shouldAutoAdvance({ ...running, index: 0, last: 0 })).toBe(false);
  });

  it('waits while the pointer is on the photo, a photo is full screen, or the tab is hidden', () => {
    expect(shouldAutoAdvance({ ...running, hovered: true })).toBe(false);
    expect(shouldAutoAdvance({ ...running, full: true })).toBe(false);
    expect(shouldAutoAdvance({ ...running, hidden: true })).toBe(false);
  });

  it('never runs for someone who asked for reduced motion', () => {
    expect(shouldAutoAdvance({ ...running, reducedMotion: true })).toBe(false);
  });
});
