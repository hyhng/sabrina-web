import { describe, expect, it } from 'vitest';

import {
  acceptFile,
  DETAIL_MIN_WIDTH,
  formatBytes,
  GRID_MIN_WIDTH,
  resolutionWarning,
  variantWidths,
  WEBP_QUALITY,
} from './upload.ts';

describe('acceptFile', () => {
  it('takes what a camera exports', () => {
    expect(acceptFile('image/jpeg').ok).toBe(true);
    expect(acceptFile('image/png').ok).toBe(true);
  });

  it('turns away what the browser cannot read, and says what to do', () => {
    for (const type of ['image/tiff', 'image/heic', 'application/pdf', '']) {
      const result = acceptFile(type);
      expect(result.ok, type).toBe(false);
      // docs/SPEC.md 8.8: a message says what happened and what to do next.
      if (!result.ok) expect(result.message).toContain('JPEG');
    }
  });
});

describe('variantWidths', () => {
  it('makes every size up to the original', () => {
    expect(variantWidths(3000)).toEqual([400, 800, 1200, 1600, 2400]);
    expect(variantWidths(1604)).toEqual([400, 800, 1200, 1600]);
  });

  it('never enlarges — that is a bigger file of the same detail', () => {
    expect(variantWidths(900)).toEqual([400, 800]);
    expect(variantWidths(400)).toEqual([400]);
    expect(Math.max(...variantWidths(1000))).toBeLessThanOrEqual(1000);
  });

  it('gives nothing back for a photo smaller than the smallest variant', () => {
    expect(variantWidths(320)).toEqual([]);
  });
});

describe('resolutionWarning', () => {
  it('stays quiet for a photo big enough for the detail', () => {
    expect(resolutionWarning(DETAIL_MIN_WIDTH)).toBeNull();
    expect(resolutionWarning(4000)).toBeNull();
  });

  it('warns about the detail while the grid is still fine', () => {
    const warning = resolutionWarning(DETAIL_MIN_WIDTH - 1);
    expect(warning?.level).toBe('detail');
    expect(warning?.message).toContain('mřížce OK');
  });

  it('warns harder below the grid threshold', () => {
    const warning = resolutionWarning(GRID_MIN_WIDTH - 1);
    expect(warning?.level).toBe('grid');
  });

  it('uses the rendered column widths doubled, for retina', () => {
    expect(DETAIL_MIN_WIDTH).toBe(620 * 2);
    expect(GRID_MIN_WIDTH).toBe(400 * 2);
  });
});

describe('formatBytes', () => {
  it('reads the way the upload table shows it', () => {
    expect(formatBytes(8_200_000)).toBe('8,2 MB');
    expect(formatBytes(310_000)).toBe('310 kB');
    expect(formatBytes(512)).toBe('512 B');
  });
});

describe('quality', () => {
  it('is the figure docs/SPEC.md 8.4 gives', () => {
    expect(WEBP_QUALITY).toBe(0.82);
  });
});
