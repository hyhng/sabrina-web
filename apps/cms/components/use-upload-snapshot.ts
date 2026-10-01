import { useSyncExternalStore } from 'react';

import { uploadStore } from '../lib/upload-store-default.ts';
import { EMPTY, type Snapshot } from '../lib/upload-store.ts';

/**
 * The upload queue as React state. Anything that shows it — the photo grid, the
 * status in the sidebar — reads the same store, so they cannot disagree.
 */
export function useUploadSnapshot(): Snapshot {
  const store = uploadStore();
  // The server has no queue; EMPTY keeps the first render identical on both sides.
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => EMPTY);
}
