'use client';

import { Button, useField } from '@payloadcms/ui';
import { ACCEPTED_TYPES } from '@sabrina/shared/upload';
import { useEffect, useRef, useState } from 'react';

import {
  detailWidth,
  fieldId,
  idOf,
  metaFromRecord,
  type PhotoMeta,
  variantSrc,
} from '../lib/photo-tiles.ts';
import { progressLabel } from '../lib/upload-queue.ts';
import { uploadStore } from '../lib/upload-store-default.ts';
import { useUploadSnapshot } from './use-upload-snapshot.ts';

import './photo-grid.css';

/**
 * A field that holds one photo — the portrait and the sharing image in
 * Nastavení webu — uploaded the way a project's photos are
 * [rozhodnuto 5. 10. 2026]: dropped or picked, converted in the browser, sent
 * to R2 through the same queue (lib/upload-store.ts), and shown as a picture
 * rather than a dropdown of photo records.
 *
 * Payload's own relationship field offered a list of every photo by file name
 * and a "+" that opened a form asking for widths and byte counts. This replaces
 * both. A new upload replaces the photo; nothing is saved until she saves the
 * settings, as everywhere else in the admin. The old photo stays in Fotky,
 * where it can be deleted.
 *
 * Label and description come from the field's own config, so the same
 * component serves every such field.
 */

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? '';
const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(',');
export interface SinglePhotoFieldProps {
  path: string;
  field?: { label?: unknown; admin?: { description?: unknown } };
}

const text = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

export function SinglePhotoField({ path, field: config }: SinglePhotoFieldProps) {
  // One queue for everything; this key keeps this field's uploads apart.
  const DOC_KEY = `single-photo:${path}`;
  const label = text(config?.label) ?? path;
  const description = text(config?.admin?.description);
  const field = useField<unknown>({ path });
  const snapshot = useUploadSnapshot();
  const store = uploadStore();
  const [fetched, setFetched] = useState<PhotoMeta | undefined>(undefined);
  const [over, setOver] = useState(false);

  const id = idOf(field.value);
  const write = useRef(field.setValue);
  useEffect(() => {
    write.current = field.setValue;
  });

  // A finished upload becomes the portrait — even if it finished while she was elsewhere.
  useEffect(
    () =>
      store.registerAttacher(DOC_KEY, (photoId) => {
        write.current(fieldId(photoId));
      }),
    [store, DOC_KEY],
  );

  const mine = snapshot.items.filter((item) => item.docKey === DOC_KEY);
  const latest = mine.at(-1);
  const busy = latest !== undefined && ['queued', 'converting', 'uploading'].includes(latest.stage);
  const problem =
    latest !== undefined && (latest.stage === 'rejected' || latest.stage === 'failed')
      ? latest.message
      : undefined;

  const fromUpload = mine.find((item) => item.meta?.id === id)?.meta;
  const meta = fromUpload ?? (fetched?.id === id ? fetched : undefined);

  useEffect(() => {
    if (id === undefined || fromUpload !== undefined || fetched?.id === id) return;
    let cancelled = false;
    void fetch(`/api/photos/${id}?depth=0`, { credentials: 'include' })
      .then((response) => (response.ok ? (response.json() as Promise<unknown>) : undefined))
      .then((body) => {
        if (!cancelled) setFetched(metaFromRecord(body));
      })
      .catch(() => {
        // Without its details the portrait still shows from the local preview, or not at all.
      });
    return () => {
      cancelled = true;
    };
  }, [id, fromUpload, fetched?.id]);

  const src =
    (busy ? latest.previewUrl : undefined) ??
    (id === undefined ? undefined : snapshot.previews[id]) ??
    (meta === undefined ? undefined : variantSrc(meta, detailWidth, IMG_BASE));

  const add = (files: readonly File[]) => {
    const first = files[0];
    if (first !== undefined) store.add(DOC_KEY, [first]);
  };

  const picker = (label: string) => (
    <label className="single-photo__pick">
      {label}
      <input
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        hidden
        onChange={(event) => {
          add([...(event.target.files ?? [])]);
          event.target.value = '';
        }}
      />
    </label>
  );

  return (
    <div className="field-type single-photo">
      <span className="field-label">{label}</span>

      {src !== undefined || busy ? (
        <div className="single-photo__current">
          <div
            className="single-photo__frame"
            style={{
              aspectRatio:
                meta === undefined ? undefined : `${String(meta.width)} / ${String(meta.height)}`,
              backgroundColor: meta?.dominantColor,
            }}
          >
            {src === undefined ? null : <img src={src} alt="" />}
            {busy ? <span className="single-photo__status">{progressLabel([latest])}</span> : null}
          </div>
          {busy ? null : (
            <div className="single-photo__actions">
              {picker('Nahrát jiný')}
              <Button
                buttonStyle="secondary"
                size="small"
                margin={false}
                onClick={() => {
                  field.setValue(null);
                }}
              >
                Odebrat
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`photo-grid__zone${over ? ' photo-grid__zone--over' : ''}`}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes('Files')) return;
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => {
            setOver(false);
          }}
          onDrop={(event) => {
            if (!event.dataTransfer.types.includes('Files')) return;
            event.preventDefault();
            setOver(false);
            add([...event.dataTransfer.files]);
          }}
        >
          <label>
            Přetáhni sem fotku, nebo <u>vyber ze složky</u>.
            <input
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              hidden
              onChange={(event) => {
                add([...(event.target.files ?? [])]);
                event.target.value = '';
              }}
            />
          </label>
          <p className="photo-grid__hint">JPEG nebo PNG, jedna fotka.</p>
        </div>
      )}

      {problem === undefined ? null : (
        <p className="photo-grid__error" role="alert">
          {problem}
        </p>
      )}
      <p className="photo-grid__hint">
        {description === undefined ? '' : `${description} `}Po nahrání nezapomeň uložit.
      </p>
    </div>
  );
}
