import { variantWidths, WEBP_QUALITY } from '@sabrina/shared/upload';

import { averageColor, isWebp } from './photo-pipeline.ts';

/**
 * The conversion itself, in her browser (docs/TECH.md 5, CLAUDE.md rule 10).
 *
 * Everything the DOM provides is behind `Browser` and passed in. That is not
 * ceremony: the interesting behaviour here is the Safari fallback, and Safari's
 * `toBlob('image/webp')` quietly returning a PNG is exactly the thing that
 * cannot be reproduced in a test any other way.
 *
 * Redrawing onto a canvas is also what strips EXIF, GPS included, and converts
 * to sRGB — a side effect of the resize rather than a step of its own
 * (docs/SPEC.md 8.4 point 3).
 */

/** The smallest square worth averaging — 1024 pixels is plenty for a mean. */
export const COLOR_SAMPLE_WIDTH = 32;

/** `quality` on canvas is 0–1; @jsquash takes 0–100. */
export const WASM_QUALITY = Math.round(WEBP_QUALITY * 100);

export interface Decoded {
  readonly width: number;
  readonly height: number;
}

export interface Browser<TImage extends Decoded> {
  /** createImageBitmap — applies EXIF orientation, so width/height are final. */
  decode: (file: Blob) => Promise<TImage>;
  /** Draws the image at this width and returns the canvas' RGBA pixels. */
  pixels: (image: TImage, width: number) => Promise<Uint8ClampedArray<ArrayBuffer>>;
  /** canvas.toBlob / convertToBlob. May hand back a PNG without saying so. */
  encode: (image: TImage, width: number) => Promise<Blob>;
  /** @jsquash/webp over the same pixels — the way out of Safari. */
  encodeWasm: (
    pixels: Uint8ClampedArray<ArrayBuffer>,
    width: number,
    height: number,
  ) => Promise<Blob>;
  /** Frees the bitmap. Large originals are worth not holding on to. */
  release?: (image: TImage) => void;
}

export interface Converted {
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: number;
  readonly dominantColor: string;
  /** Narrowest first, never wider than the original. */
  readonly widths: number[];
  readonly variants: Map<number, Blob>;
  /** Every variant together — what the site will serve for this photo. */
  readonly bytesWebp: number;
}

/** Height of a variant, rounded the way the canvas will round it. */
export function variantHeight(width: number, image: Decoded): number {
  return Math.max(1, Math.round((width * image.height) / image.width));
}

/**
 * One variant, checked rather than trusted. `encodeVariant` in
 * photo-pipeline.ts says the same thing about injected encoders; this is the
 * version that has the pixels to hand the WASM encoder.
 */
async function variant<TImage extends Decoded>(
  image: TImage,
  width: number,
  browser: Browser<TImage>,
): Promise<Blob> {
  const fromCanvas = await browser.encode(image, width);
  if (isWebp(fromCanvas)) return fromCanvas;
  const pixels = await browser.pixels(image, width);
  return browser.encodeWasm(pixels, width, variantHeight(width, image));
}

export async function convert<TImage extends Decoded>(
  file: Blob,
  browser: Browser<TImage>,
): Promise<Converted> {
  const image = await browser.decode(file);
  try {
    const dominantColor = averageColor(await browser.pixels(image, COLOR_SAMPLE_WIDTH));
    const widths = variantWidths(image.width);

    const variants = new Map<number, Blob>();
    // One at a time: three files are already in flight, and a 2400px canvas
    // on top of that is how iOS Safari runs out of room (docs/TECH.md 5).
    for (const width of widths) {
      variants.set(width, await variant(image, width, browser));
    }

    let bytesWebp = 0;
    for (const blob of variants.values()) bytesWebp += blob.size;

    return {
      width: image.width,
      height: image.height,
      // Kept as the ratio, not measured later in the browser (CLAUDE.md rule 3).
      aspectRatio: image.width / image.height,
      dominantColor,
      widths,
      variants,
      bytesWebp,
    };
  } finally {
    browser.release?.(image);
  }
}
