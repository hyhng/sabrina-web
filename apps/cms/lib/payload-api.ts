import type { Signed } from './presign.ts';
import type { Api, PhotoMeta } from './upload-photo.ts';

/**
 * The `Api` in upload-photo.ts, over Payload's REST endpoints and R2's signed
 * URLs. Thin by design: the order of the calls and the cleanup live in
 * upload-photo.ts, where they are tested.
 *
 * Cookies go along because the admin's session is what authorises all of this;
 * the PUT to R2 must not carry them, and does not — it is a different origin
 * and the signature is the authorisation.
 */

async function message(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    const errors = (body as { errors?: { message?: string }[] }).errors;
    const first = errors?.[0]?.message ?? (body as { message?: string }).message;
    return first ?? `Server odpověděl ${String(response.status)}.`;
  } catch {
    return `Server odpověděl ${String(response.status)}.`;
  }
}

export function payloadApi(): Api {
  return {
    createPhoto: async (meta: PhotoMeta) => {
      const response = await fetch('/api/photos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meta),
      });
      if (!response.ok) throw new Error(await message(response));
      const body = (await response.json()) as { doc?: { id?: string | number } };
      const id = body.doc?.id;
      if (id === undefined) throw new Error('Server nevrátil id fotky.');
      return String(id);
    },

    presign: async (photoId: string) => {
      const response = await fetch('/api/photos/presign', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      if (!response.ok) throw new Error(await message(response));
      return ((await response.json()) as { targets: Signed[] }).targets;
    },

    put: async (url: string, body: Blob, contentType: string) => {
      const response = await fetch(url, {
        method: 'PUT',
        body,
        /*
         * Signed into the URL, so it has to match exactly — which is why it
         * comes from the target and not from the blob. R2 also stores it, and
         * that is what makes img.<doména> serve the file as an image.
         */
        headers: { 'Content-Type': contentType },
      });
      if (!response.ok) {
        throw new Error(`R2 odmítlo soubor (${String(response.status)}).`);
      }
    },

    deletePhoto: async (photoId: string) => {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await message(response));
    },
  };
}
