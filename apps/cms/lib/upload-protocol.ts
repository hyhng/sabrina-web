import { type Browser, convert, type Converted, type Decoded } from './browser-image.ts';

/**
 * What crosses between the admin and the conversion worker (docs/TECH.md 5).
 *
 * Encoding a 40 Mpx photo into five widths takes seconds of solid CPU, and on
 * the main thread the admin would sit there frozen while she is still typing
 * metadata. So it happens in a worker, and this is the whole of the contract —
 * kept apart from upload.worker.ts, which only wires it to `self`, so the
 * handling can be tested without one.
 *
 * Both directions are structured-cloneable: `File` in, `Map<number, Blob>` back.
 */

export type ConvertRequest = {
  /** The queue row this answers, from upload-queue.ts. */
  readonly id: string;
  readonly file: Blob;
};

export type ConvertResponse =
  | { readonly id: string; readonly ok: true; readonly converted: Converted }
  | { readonly id: string; readonly ok: false; readonly message: string };

/** Czech, and about what she can do next — there is no server log to read. */
export const CONVERT_FAILED =
  'Fotku se nepovedlo převést. Zkus ji znovu; pokud to nepomůže, přeexportuj ji z Lightroomu jako JPEG.';

export async function handleConvert<TImage extends Decoded>(
  request: ConvertRequest,
  browser: Browser<TImage>,
): Promise<ConvertResponse> {
  try {
    return { id: request.id, ok: true, converted: await convert(request.file, browser) };
  } catch {
    /*
     * The reason is never shown: "canvas exceeds maximum size" is true and
     * useless to her. It is worth keeping out of the message rather than
     * pasting a browser error into the admin.
     */
    return { id: request.id, ok: false, message: CONVERT_FAILED };
  }
}
