'use client';

import { useField } from '@payloadcms/ui';
import { ACCEPTED_TYPES } from '@sabrina/shared/upload';
import { useEffect, useRef, useState } from 'react';

import { payloadApi } from '../lib/payload-api.ts';
import {
  accept,
  type Item,
  patch,
  progressLabel,
  readyToStart,
  toRow,
} from '../lib/upload-queue.ts';
import type { ConvertRequest, ConvertResponse } from '../lib/upload-protocol.ts';
import { uploadPhoto } from '../lib/upload-photo.ts';

import './photo-upload.css';

/**
 * Drag and drop photos onto the project (docs/SPEC.md 8.3, 8.4).
 *
 * Almost nothing is decided here. The stages and the wording are in
 * lib/upload-queue.ts, the conversion in lib/browser-image.ts behind a worker,
 * the order of the server calls in lib/upload-photo.ts. What is left is the
 * drop target, the table, and keeping the queue moving.
 *
 * The queue lives in a ref as well as in state: the ref is what the scheduler
 * reads between asynchronous steps, where the state it was rendered with is
 * already stale. Both are only ever touched from event handlers and callbacks,
 * never during a render.
 *
 * A finished photo is appended to the project's `photos` field, so the upload
 * and the ordering below it are the same list. Nothing is saved to the project
 * until she saves it — the photo rows exist either way, which is what lets her
 * leave and come back to a half-uploaded series.
 */

const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(',');

export function PhotoUpload() {
  const { value, setValue } = useField<(string | number)[]>({ path: 'photos' });

  const [items, setItems] = useState<Item[]>([]);
  const [over, setOver] = useState(false);

  const queue = useRef<Item[]>([]);
  const worker = useRef<Worker | null>(null);
  /** The ids so far, so two photos finishing at once do not overwrite each other. */
  const attached = useRef<(string | number)[]>([]);

  /*
   * The ids the project already holds. While photos are in flight this ref is
   * the only trustworthy copy: `setValue` has no updater form, so two photos
   * finishing close together both have to append to the same list, and a
   * re-sync from a render's `value` in between would drop one of them. When
   * nothing is moving, her own edits to the list below are what count.
   */
  const busy = items.some((item) => item.stage === 'converting' || item.stage === 'uploading');
  useEffect(() => {
    if (busy) return;
    attached.current = Array.isArray(value) ? value : [];
  }, [value, busy]);

  useEffect(
    () => () => {
      worker.current?.terminate();
      worker.current = null;
      // The object URLs behind the thumbnails are ours to let go of.
      for (const item of queue.current) {
        if (item.previewUrl !== undefined) URL.revokeObjectURL(item.previewUrl);
      }
    },
    [],
  );

  /*
   * Plain functions rather than useCallback: `pump` calls itself when a slot
   * frees up, and a recursive callback is not something the compiler can
   * memoize. Nothing below is memoized on their identity, so there is nothing
   * to preserve.
   */
  const publish = (next: Item[]) => {
    queue.current = next;
    setItems(next);
  };

  const update = (id: string, change: Partial<Item>) => {
    publish(patch(queue.current, id, change));
  };

  /** Converts in the worker, matching the answer to the row that asked. */
  const convert = (request: ConvertRequest): Promise<ConvertResponse> => {
    worker.current ??= new Worker(new URL('../lib/upload.worker.ts', import.meta.url), {
      type: 'module',
    });
    const instance = worker.current;
    return new Promise((resolve) => {
      const listen = (event: MessageEvent<ConvertResponse>) => {
        if (event.data.id !== request.id) return;
        instance.removeEventListener('message', listen);
        resolve(event.data);
      };
      instance.addEventListener('message', listen);
      instance.postMessage(request);
    });
  };

  const pump = (files: Map<string, File>) => {
    for (const next of readyToStart(queue.current)) {
      const file = files.get(next.id);
      if (file === undefined) {
        update(next.id, { stage: 'failed', message: 'Soubor se mezitím ztratil.' });
        continue;
      }
      update(next.id, { stage: 'converting' });

      void (async () => {
        try {
          const answer = await convert({ id: next.id, file });
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

          const photoId = await uploadPhoto(file, converted, payloadApi());
          update(next.id, { stage: 'done', photoId });

          attached.current = [...attached.current, photoId];
          setValue(attached.current);
        } catch (error) {
          update(next.id, {
            stage: 'failed',
            message: error instanceof Error ? error.message : 'Nepovedlo se.',
          });
        } finally {
          // A finished slot is a free slot.
          pump(files);
        }
      })();
    }
  };

  const add = (dropped: readonly File[]) => {
    if (dropped.length === 0) return;
    // The offset keeps a second drop from reusing the first drop's ids.
    const fresh = accept(dropped, queue.current.length);

    const files = new Map<string, File>();
    const rows = fresh.map((item, index) => {
      const file = dropped[index];
      if (file === undefined) return item;
      files.set(item.id, file);
      // The thumbnail in the table, straight from the file she dropped.
      return { ...item, previewUrl: URL.createObjectURL(file) };
    });

    publish([...queue.current, ...rows]);
    pump(files);
  };

  return (
    <div className="photo-upload">
      <div
        className={`photo-upload__zone${over ? ' photo-upload__zone--over' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => {
          setOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          add([...event.dataTransfer.files]);
        }}
      >
        <label>
          Přetáhni sem fotky, nebo <u>vyber ze složky</u>.
          <input
            type="file"
            multiple
            accept={ACCEPT_ATTRIBUTE}
            hidden
            onChange={(event) => {
              add([...(event.target.files ?? [])]);
              // So the same file can be chosen twice in a row.
              event.target.value = '';
            }}
          />
        </label>
        <p className="photo-upload__hint">
          JPEG nebo PNG. Zmenšení a převod se dělá tady v prohlížeči, takže u velkých sérií to
          chvíli trvá — okno můžeš nechat otevřené a psát dál.
        </p>
      </div>

      {items.length > 0 && (
        <>
          <table className="photo-upload__table">
            <thead>
              <tr>
                <th>
                  <span className="photo-upload__hidden-label">Náhled</span>
                </th>
                <th>Soubor</th>
                <th>Rozlišení</th>
                <th>Velikost</th>
                <th>Stav</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const row = toRow(item);
                return (
                  <tr key={item.id}>
                    <td>
                      {item.previewUrl !== undefined && (
                        <img className="photo-upload__thumb" src={item.previewUrl} alt="" />
                      )}
                    </td>
                    <td className="photo-upload__name" title={item.filename}>
                      {item.filename}
                    </td>
                    <td>
                      {row.resolution}
                      {row.warning !== undefined && (
                        <div className="photo-upload__warning">{row.warning}</div>
                      )}
                    </td>
                    <td>{row.size}</td>
                    <td
                      className={
                        item.stage === 'done'
                          ? 'photo-upload__status--done'
                          : item.stage === 'failed' || item.stage === 'rejected'
                            ? 'photo-upload__status--failed'
                            : undefined
                      }
                    >
                      {row.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="photo-upload__progress">{progressLabel(items)}</p>
        </>
      )}
    </div>
  );
}

export default PhotoUpload;
