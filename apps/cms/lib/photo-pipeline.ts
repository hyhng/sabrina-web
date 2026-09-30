/**
 * Turning a photo she drops in into what the site serves (docs/TECH.md 5).
 *
 * All of it happens in her browser: the server never touches an image
 * (CLAUDE.md rule 10). The variants and the original go straight to R2.
 *
 * The part worth being careful about is Safari. `canvas.toBlob(…, 'image/webp')`
 * does not fail there — it quietly hands back a PNG, which would sail through
 * and put files several times larger than intended on the site. So the result
 * is always checked, and a WASM encoder takes over when it is not WebP.
 *
 * The encoders are injected rather than reached for, which is what lets that
 * fallback be tested without Safari.
 */

export interface Encoders {
  /** canvas.toBlob — may silently return a PNG. */
  canvas: (width: number) => Promise<Blob>;
  /** @jsquash/webp, loaded lazily and only when the canvas lets us down. */
  wasm: (width: number) => Promise<Blob>;
}

export function isWebp(blob: Blob): boolean {
  return blob.type === 'image/webp';
}

/**
 * One variant. Never trusts the canvas without looking at what came back.
 */
export async function encodeVariant(width: number, encoders: Encoders): Promise<Blob> {
  const fromCanvas = await encoders.canvas(width);
  return isWebp(fromCanvas) ? fromCanvas : encoders.wasm(width);
}

/**
 * The average colour, which holds the photo's place while it loads
 * (docs/SPEC.md 8.4). Averaging the pixels, not picking the most common one:
 * on a dark photograph the commonest colour is almost black and makes a
 * useless placeholder.
 */
export function averageColor(pixels: Uint8ClampedArray): string {
  if (pixels.length < 4) return '#000000';
  let red = 0;
  let green = 0;
  let blue = 0;
  const count = Math.floor(pixels.length / 4);
  for (let i = 0; i < count; i += 1) {
    red += pixels[i * 4] ?? 0;
    green += pixels[i * 4 + 1] ?? 0;
    blue += pixels[i * 4 + 2] ?? 0;
  }
  const channel = (total: number) =>
    Math.round(total / count)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

/**
 * How many files to push at once. Three keeps a slow connection moving
 * without the browser queueing everything behind one large original
 * (docs/TECH.md 5). [návrh]
 */
export const MAX_CONCURRENT_UPLOADS = 3;
