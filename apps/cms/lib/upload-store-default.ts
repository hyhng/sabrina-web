import { payloadApi } from './payload-api.ts';
import type { ConvertRequest, ConvertResponse } from './upload-protocol.ts';
import { createUploadStore, type UploadStore } from './upload-store.ts';
import { uploadPhoto } from './upload-photo.ts';

/**
 * The one upload queue of this admin session, wired to the real worker and the
 * real server.
 *
 * A module-level singleton is the point: it has to be the same object whichever
 * tab or screen is showing, and survive all of them coming and going. It is built
 * lazily, so merely importing this on the server — Next renders client components
 * there too — creates nothing and touches no browser API.
 */

let worker: Worker | undefined;

function convertInWorker(id: string, file: File): Promise<ConvertResponse> {
  worker ??= new Worker(new URL('./upload.worker.ts', import.meta.url), { type: 'module' });
  const instance = worker;
  return new Promise((resolve) => {
    const listen = (event: MessageEvent<ConvertResponse>) => {
      if (event.data.id !== id) return;
      instance.removeEventListener('message', listen);
      resolve(event.data);
    };
    instance.addEventListener('message', listen);
    const request: ConvertRequest = { id, file };
    instance.postMessage(request);
  });
}

/**
 * Closing the window mid-upload loses whatever has not finished, and the files
 * that did finish are photos nobody has attached. The browser's own "leave this
 * page?" is the only way to ask, and it asks only while something is moving.
 */
function leaveWarning(event: BeforeUnloadEvent) {
  event.preventDefault();
  event.returnValue = '';
}

function warnBeforeLeaving(busy: boolean) {
  if (typeof window === 'undefined') return;
  if (busy) window.addEventListener('beforeunload', leaveWarning);
  else window.removeEventListener('beforeunload', leaveWarning);
}

let instance: UploadStore | undefined;

export function uploadStore(): UploadStore {
  instance ??= createUploadStore({
    convert: convertInWorker,
    upload: (file, converted) => uploadPhoto(file, converted, payloadApi()),
    previewUrl: (file) => URL.createObjectURL(file),
    onBusyChange: warnBeforeLeaving,
  });
  return instance;
}
