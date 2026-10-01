import type { Converted } from './browser-image.ts';
import type { PhotoMeta } from './photo-tiles.ts';
import type { ConvertResponse } from './upload-protocol.ts';
import { accept, type Item, isFinished, patch, readyToStart } from './upload-queue.ts';

/**
 * The upload queue, kept outside React (docs/SPEC.md 8.4).
 *
 * It used to live in the photo component's own state, and Payload unmounts a tab's
 * content when another tab is chosen. Switching to Podrobnosti mid-upload threw
 * the table away while the files kept going up, so she saw nothing for a
 * series that was still in flight. State that has to outlive a component cannot
 * live in it.
 *
 * What a component does instead is subscribe, and register as the place a
 * finished photo gets attached. If nobody is registered — the tab is not on
 * screen — the id waits, and is handed over the moment a grid for that project
 * mounts again.
 *
 * Everything the outside world provides comes in through `Deps`, which is what
 * lets the interesting parts — the three-at-a-time rule, a photo finishing while
 * nobody is looking — be tested without a worker or a network.
 */

export type StoreItem = Item & {
  /** The project this photo is being uploaded for. */
  readonly docKey: string;
  /** What the server now knows about it, once it is `done`. */
  readonly meta?: PhotoMeta;
};

export type Snapshot = {
  readonly items: readonly StoreItem[];
  /** photo id → object URL of the file as dropped, for a thumbnail that needs no network. */
  readonly previews: Readonly<Record<string, string>>;
};

export type Deps = {
  convert: (id: string, file: File) => Promise<ConvertResponse>;
  upload: (file: File, converted: Converted) => Promise<string>;
  previewUrl: (file: File) => string;
  /** Called when the queue goes from idle to busy and back — for "are you sure you want to leave". */
  onBusyChange?: (busy: boolean) => void;
};

export const EMPTY: Snapshot = { items: [], previews: {} };

export function createUploadStore(deps: Deps) {
  let snapshot: Snapshot = EMPTY;
  let counter = 0;
  let wasBusy = false;

  const listeners = new Set<() => void>();
  const files = new Map<string, File>();
  const attachers = new Map<string, (photoId: string) => void>();
  const waiting = new Map<string, string[]>();

  const busy = () =>
    snapshot.items.some((item) => item.stage === 'converting' || item.stage === 'uploading') ||
    snapshot.items.some((item) => item.stage === 'queued');

  function emit(next: Snapshot) {
    snapshot = next;
    const now = busy();
    if (now !== wasBusy) {
      wasBusy = now;
      deps.onBusyChange?.(now);
    }
    for (const listener of listeners) listener();
  }

  function update(id: string, change: Partial<Item>) {
    emit({ ...snapshot, items: patch(snapshot.items, id, change) });
  }

  function deliver(docKey: string, photoId: string) {
    const attach = attachers.get(docKey);
    if (attach !== undefined) {
      attach(photoId);
      return;
    }
    waiting.set(docKey, [...(waiting.get(docKey) ?? []), photoId]);
  }

  function pump() {
    for (const next of readyToStart(snapshot.items)) {
      const file = files.get(next.id);
      if (file === undefined) {
        update(next.id, { stage: 'failed', message: 'Soubor se mezitím ztratil.' });
        continue;
      }
      update(next.id, { stage: 'converting' });

      void (async () => {
        try {
          const answer = await deps.convert(next.id, file);
          if (!answer.ok) {
            update(next.id, { stage: 'failed', message: answer.message });
            return;
          }
          const { converted } = answer;
          update(next.id, {
            stage: 'uploading',
            width: converted.width,
            height: converted.height,
            bytesWebp: converted.bytesWebp,
          });

          const photoId = await deps.upload(file, converted);
          const meta: PhotoMeta = {
            id: photoId,
            filename: file.name,
            width: converted.width,
            height: converted.height,
            widths: converted.widths,
            dominantColor: converted.dominantColor,
            bytesOriginal: file.size,
            bytesWebp: converted.bytesWebp,
          };
          const preview = snapshot.items.find((item) => item.id === next.id)?.previewUrl;
          emit({
            items: patch(snapshot.items, next.id, { stage: 'done', photoId }).map((item) =>
              item.id === next.id ? { ...item, meta } : item,
            ),
            previews:
              preview === undefined
                ? snapshot.previews
                : { ...snapshot.previews, [photoId]: preview },
          });
          files.delete(next.id);
          deliver(next.docKey, photoId);
        } catch (error) {
          update(next.id, {
            stage: 'failed',
            message: error instanceof Error ? error.message : 'Nepovedlo se.',
          });
        } finally {
          // A finished slot is a free slot.
          pump();
        }
      })();
    }
  }

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot: (): Snapshot => snapshot,

    isBusy: busy,

    add(docKey: string, dropped: readonly File[]): void {
      if (dropped.length === 0) return;
      const fresh = accept(dropped, counter);
      counter += dropped.length;

      const rows: StoreItem[] = fresh.map((item, index) => {
        const file = dropped[index];
        if (file === undefined || item.stage === 'rejected') return { ...item, docKey };
        files.set(item.id, file);
        // The thumbnail, straight from the file she dropped.
        return { ...item, docKey, previewUrl: deps.previewUrl(file) };
      });
      emit({ ...snapshot, items: [...snapshot.items, ...rows] });
      pump();
    },

    /** Takes a failed or rejected row off the table. A finished one is a photo now, not a row. */
    dismiss(id: string): void {
      const item = snapshot.items.find((entry) => entry.id === id);
      if (item === undefined || (item.stage !== 'failed' && item.stage !== 'rejected')) return;
      files.delete(id);
      emit({ ...snapshot, items: snapshot.items.filter((entry) => entry.id !== id) });
    },

    /**
     * A photo that has been deleted is no longer part of the queue's story. Left in,
     * it would still count towards "3 z 3 hotovo" for a project that now has two.
     */
    forget(photoId: string): void {
      const { [photoId]: _gone, ...previews } = snapshot.previews;
      void _gone;
      emit({
        items: snapshot.items.filter((item) => item.photoId !== photoId),
        previews,
      });
    },

    /**
     * Makes `attach` the place photos for `docKey` go when they finish — and
     * hands over any that finished while there was nowhere to put them.
     */
    registerAttacher(docKey: string, attach: (photoId: string) => void): () => void {
      attachers.set(docKey, attach);
      const early = waiting.get(docKey);
      if (early !== undefined) {
        waiting.delete(docKey);
        for (const photoId of early) attach(photoId);
      }
      return () => {
        // Only if it is still ours: a newer grid may have taken over already.
        if (attachers.get(docKey) === attach) attachers.delete(docKey);
      };
    },

    /** Everything for a project has either arrived or failed. */
    settled: (docKey: string): boolean =>
      isFinished(snapshot.items.filter((item) => item.docKey === docKey)),
  };
}

export type UploadStore = ReturnType<typeof createUploadStore>;
