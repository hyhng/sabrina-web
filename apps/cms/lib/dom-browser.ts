import { WEBP_QUALITY } from '@sabrina/shared/upload';

import { type Browser, variantHeight, WASM_QUALITY } from './browser-image.ts';

/**
 * The `Browser` in browser-image.ts, actually built out of browser APIs.
 *
 * Deliberately thin and free of decisions — everything worth testing lives in
 * browser-image.ts, and this is the part a test could only lie about. It runs
 * inside the worker (upload.worker.ts), where `OffscreenCanvas` is the only
 * canvas there is.
 *
 * `createImageBitmap` applies EXIF orientation, so a portrait shot taken
 * sideways arrives the right way up and its width really is its width. Drawing
 * it onto a fresh canvas is what drops the rest of the EXIF, GPS included, and
 * converts to sRGB (docs/SPEC.md 8.4 point 3).
 */

function draw(image: ImageBitmap, width: number): OffscreenCanvas {
  const canvas = new OffscreenCanvas(width, variantHeight(width, image));
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('Prohlížeč nedal k dispozici canvas.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function domBrowser(): Browser<ImageBitmap> {
  return {
    decode: (file) => createImageBitmap(file),

    pixels: (image, width) => {
      const canvas = draw(image, width);
      const context = canvas.getContext('2d');
      if (context === null) throw new Error('Prohlížeč nedal k dispozici canvas.');
      return Promise.resolve(context.getImageData(0, 0, canvas.width, canvas.height).data);
    },

    // Safari answers this with a PNG and no error; browser-image.ts checks.
    encode: (image, width) =>
      draw(image, width).convertToBlob({ type: 'image/webp', quality: WEBP_QUALITY }),

    encodeWasm: async (pixels, width, height) => {
      // Lazy: several hundred kB of WASM that Chrome and Firefox never need.
      const { encode } = await import('@jsquash/webp');
      const buffer = await encode(new ImageData(pixels, width, height), {
        quality: WASM_QUALITY,
      });
      return new Blob([buffer], { type: 'image/webp' });
    },

    release: (image) => {
      image.close();
    },
  };
}
