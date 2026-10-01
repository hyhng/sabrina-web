'use client';

import { Button, Drawer, useDocumentInfo, useField, useModal } from '@payloadcms/ui';
import { ACCEPTED_TYPES, formatBytes, resolutionWarning } from '@sabrina/shared/upload';
import { useEffect, useRef, useState } from 'react';

import {
  detailWidth,
  fieldId,
  idOf,
  idsOf,
  metaFromRecord,
  moveBy,
  moveTo,
  type PhotoMeta,
  position,
  thumbWidth,
  variantSrc,
  without,
} from '../lib/photo-tiles.ts';
import { progressLabel, toRow } from '../lib/upload-queue.ts';
import { uploadStore } from '../lib/upload-store-default.ts';
import { useUploadSnapshot } from './use-upload-snapshot.ts';

import './photo-grid.css';

/**
 * The photos of a project, as pictures (docs/SPEC.md 8.3, 8.4).
 *
 * One grid does what three things used to: the upload table, the list of
 * "Bez názvu — ID: 36" chips, and the dropdown of file names for the cover. A
 * photo is a tile from the moment it is dropped — with its own preview and its
 * status on it — and stays the same tile when it has arrived, so nothing jumps
 * from one place to another.
 *
 * The queue is not kept here. It lives in lib/upload-store.ts, because Payload
 * unmounts a tab's content when another tab is chosen and a queue that lived in
 * this component went with it. What is here is a view of that store plus the
 * project's `photos` and `cover` fields, which are hidden in the admin and
 * driven from this grid instead.
 *
 * Nothing is saved to the project until she saves it. Deleting a photo is the one
 * exception, since the row is gone for good — see `remove`.
 */

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? '';
const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(',');
const DRAWER = 'photo-detail';

export function PhotoGrid() {
  const { id: documentId } = useDocumentInfo();
  const docKey = documentId === undefined ? 'new' : String(documentId);

  const photosField = useField<unknown>({ path: 'photos' });
  const coverField = useField<unknown>({ path: 'cover' });
  const { closeModal, openModal } = useModal();
  const snapshot = useUploadSnapshot();
  const store = uploadStore();

  const ids = idsOf(photosField.value);
  const idsKey = ids.join(',');
  const coverId = idOf(coverField.value);

  const mine = snapshot.items.filter((item) => item.docKey === docKey);
  const moving = mine.some((item) => ['queued', 'converting', 'uploading'].includes(item.stage));

  const [fetched, setFetched] = useState<Record<string, PhotoMeta>>({});
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  const [dragId, setDragId] = useState<string | undefined>(undefined);
  const [overId, setOverId] = useState<string | undefined>(undefined);
  const [fileOver, setFileOver] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  /*
   * The list as this component last wrote it. `setValue` has no updater form, so
   * two photos finishing close together both have to append to the same list, and
   * the value a render holds can already be one behind. While anything is still in
   * flight this is the only trustworthy copy; once things settle, whatever the
   * form holds — including her own edits — is what counts.
   */
  const latest = useRef<string[]>(ids);
  const writePhotos = useRef(photosField.setValue);
  useEffect(() => {
    writePhotos.current = photosField.setValue;
  });
  useEffect(() => {
    if (!moving) latest.current = idsKey === '' ? [] : idsKey.split(',');
  }, [idsKey, moving]);

  const commit = (next: string[]) => {
    latest.current = next;
    writePhotos.current(next.map(fieldId));
  };

  // Where a finished photo goes — including the ones that finished while she was
  // on another tab and nothing was here to receive them.
  useEffect(
    () =>
      store.registerAttacher(docKey, (photoId) => {
        if (latest.current.includes(photoId)) return;
        commit([...latest.current, photoId]);
      }),
    [docKey, store],
  );

  // What we know about each photo: from the upload itself, or fetched for the rest.
  const known = new Map<string, PhotoMeta>();
  for (const item of snapshot.items)
    if (item.meta !== undefined) known.set(item.meta.id, item.meta);
  for (const meta of Object.values(fetched)) known.set(meta.id, meta);

  const missingKey = ids.filter((id) => !known.has(id)).join(',');
  useEffect(() => {
    if (missingKey === '') return;
    const wanted = missingKey.split(',');
    let cancelled = false;
    void fetch(`/api/photos?where[id][in]=${missingKey}&limit=${String(wanted.length)}&depth=0`, {
      credentials: 'include',
    })
      .then((response) =>
        response.ok ? (response.json() as Promise<{ docs?: unknown[] }>) : undefined,
      )
      .then((body) => {
        if (cancelled || body?.docs === undefined) return;
        const got: Record<string, PhotoMeta> = {};
        for (const doc of body.docs) {
          const meta = metaFromRecord(doc);
          if (meta !== undefined) got[meta.id] = meta;
        }
        setFetched((before) => ({ ...before, ...got }));
      })
      .catch(() => {
        // A tile without its details still shows its picture and can still be opened.
      });
    return () => {
      cancelled = true;
    };
  }, [missingKey]);

  const thumbSrc = (id: string): string | undefined => {
    const local = snapshot.previews[id];
    if (local !== undefined) return local;
    const meta = known.get(id);
    return meta === undefined ? undefined : variantSrc(meta, thumbWidth, IMG_BASE);
  };

  const add = (dropped: readonly File[]) => {
    setError(undefined);
    store.add(docKey, dropped);
  };

  const open = (id: string) => {
    setOpenId(id);
    openModal(DRAWER);
  };

  const setCover = (id: string) => {
    coverField.setValue(fieldId(id));
  };

  /**
   * Deletes the photo for good: its row, and through the row's own hook its files
   * in R2. Unlike everything else here that happens at once, not on Save — so the
   * project's draft is saved in the same breath. Otherwise a project she then
   * leaves unsaved would still list a photo that no longer exists, and a build
   * reading it would find a hole.
   */
  const remove = async (id: string) => {
    setError(undefined);
    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Fotku se nepovedlo smazat.');

      store.forget(id);
      const next = without(latest.current, id);
      commit(next);
      const nextCover = coverId === id ? undefined : coverId;
      if (coverId === id) coverField.setValue(null);
      closeModal(DRAWER);

      if (documentId !== undefined) {
        const saved = await fetch(`/api/projects/${String(documentId)}?draft=true`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photos: next.map(fieldId),
            cover: nextCover === undefined ? null : fieldId(nextCover),
          }),
        });
        if (!saved.ok)
          throw new Error('Fotka je smazaná, ale koncept projektu se neuložil. Ulož ho.');
      }
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : 'Fotku se nepovedlo smazat.');
    }
  };

  const saveAlt = async (id: string, alt: string) => {
    const meta = known.get(id);
    if (meta === undefined || (meta.alt ?? '') === alt) return;
    const response = await fetch(`/api/photos/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt }),
    });
    if (!response.ok) {
      setError('Popis fotky se nepovedlo uložit.');
      return;
    }
    // `alt` is only ever present when there is some, so clearing it means omitting it.
    const updated: PhotoMeta = { ...meta, alt };
    if (alt === '') delete (updated as { alt?: string }).alt;
    setFetched((before) => ({ ...before, [id]: updated }));
  };

  /*
   * Photos not in the list yet: still moving, failed, or refused. Never a finished
   * one — a done photo that is in the list is already a tile, and one that is not
   * was taken out of it (deleted), which is not something to show.
   */
  const waiting = mine.filter((item) => item.stage !== 'done');
  const selected = openId === undefined ? undefined : known.get(openId);

  return (
    <div className="photo-grid">
      <div
        className={`photo-grid__zone${fileOver ? ' photo-grid__zone--over' : ''}`}
        onDragOver={(event) => {
          // Only files; a tile being reordered is not a drop for this zone.
          if (!event.dataTransfer.types.includes('Files')) return;
          event.preventDefault();
          setFileOver(true);
        }}
        onDragLeave={() => {
          setFileOver(false);
        }}
        onDrop={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return;
          event.preventDefault();
          setFileOver(false);
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
        <p className="photo-grid__hint">
          JPEG nebo PNG. Zmenšení a převod se dělá tady v prohlížeči, takže u velkých sérií to
          chvíli trvá. Můžeš přepínat záložky i psát dál, nahrávání běží.
        </p>
      </div>

      {error !== undefined && (
        <p className="photo-grid__error" role="alert">
          {error}
        </p>
      )}

      {ids.length > 0 && coverId === undefined && (
        <p className="photo-grid__nudge">
          Ještě chybí <strong>titulní fotka</strong> — ta, co se ukáže v mřížce na webu. Klikni na
          fotku a zvol „Nastavit jako titulní“.
        </p>
      )}

      {ids.length + waiting.length > 0 && (
        <>
          <p className="photo-grid__legend">
            Klikni na fotku pro detail. Přetažením změníš pořadí — v tomhle pořadí se fotky listují.
          </p>
          <ul className="photo-grid__tiles">
            {ids.map((id, index) => {
              const src = thumbSrc(id);
              const meta = known.get(id);
              const warning = meta === undefined ? null : resolutionWarning(meta.width);
              const isCover = id === coverId;
              return (
                <li
                  key={id}
                  className={[
                    'photo-grid__tile',
                    isCover ? 'photo-grid__tile--cover' : '',
                    dragId === id ? 'photo-grid__tile--dragging' : '',
                    overId === id && dragId !== undefined && dragId !== id
                      ? 'photo-grid__tile--target'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={meta === undefined ? undefined : { backgroundColor: meta.dominantColor }}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/x-photo-id', id);
                    setDragId(id);
                  }}
                  onDragOver={(event) => {
                    if (dragId === undefined) return;
                    event.preventDefault();
                    setOverId(id);
                  }}
                  onDrop={(event) => {
                    if (dragId === undefined) return;
                    event.preventDefault();
                    event.stopPropagation();
                    commit(moveTo(latest.current, dragId, id));
                    setDragId(undefined);
                    setOverId(undefined);
                  }}
                  onDragEnd={() => {
                    setDragId(undefined);
                    setOverId(undefined);
                  }}
                >
                  <button
                    type="button"
                    className="photo-grid__open"
                    aria-label={`Fotka ${position(ids, id)}${isCover ? ', titulní' : ''}. Otevřít detail.`}
                    onClick={() => {
                      open(id);
                    }}
                  >
                    {src !== undefined && <img src={src} alt="" draggable={false} />}
                  </button>
                  <span className="photo-grid__order" aria-hidden="true">
                    {index + 1}
                  </span>
                  {isCover && <span className="photo-grid__badge">Titulní</span>}
                  {warning !== null && (
                    <span className="photo-grid__warn" title={warning.message}>
                      ⚠
                    </span>
                  )}
                  <span className="photo-grid__hover" aria-hidden="true">
                    Otevřít
                  </span>
                </li>
              );
            })}

            {waiting.map((item) => {
              const row = toRow(item);
              const failed = item.stage === 'failed' || item.stage === 'rejected';
              const working = item.stage === 'converting' || item.stage === 'uploading';
              return (
                <li
                  key={item.id}
                  className={`photo-grid__tile photo-grid__tile--${failed ? 'failed' : 'busy'}`}
                >
                  {item.previewUrl !== undefined && (
                    <img src={item.previewUrl} alt="" draggable={false} />
                  )}
                  {item.previewUrl === undefined && (
                    <span className="photo-grid__filename">{item.filename}</span>
                  )}
                  <div className="photo-grid__status" role="status">
                    <span>{row.status}</span>
                    {working && <span className="photo-grid__bar" aria-hidden="true" />}
                    {row.warning !== undefined && (
                      <span className="photo-grid__status-warning">{row.warning}</span>
                    )}
                  </div>
                  {failed && (
                    <button
                      type="button"
                      className="photo-grid__dismiss"
                      aria-label={`Zavřít ${item.filename}`}
                      onClick={() => {
                        store.dismiss(item.id);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {mine.length > 0 && (
            <p className="photo-grid__progress">
              {moving ? 'Nahrávám: ' : ''}
              {progressLabel(mine)}
            </p>
          )}
        </>
      )}

      <Drawer slug={DRAWER} title="Fotka">
        {selected !== undefined && openId !== undefined && (
          <PhotoDetail
            key={openId}
            meta={selected}
            src={snapshot.previews[openId] ?? variantSrc(selected, detailWidth, IMG_BASE)}
            index={ids.indexOf(openId)}
            total={ids.length}
            isCover={openId === coverId}
            onCover={() => {
              setCover(openId);
            }}
            onMove={(delta) => {
              commit(moveBy(latest.current, openId, delta));
            }}
            onAlt={(alt) => {
              void saveAlt(openId, alt);
            }}
            onDelete={() => {
              void remove(openId);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

function PhotoDetail({
  meta,
  src,
  index,
  total,
  isCover,
  onCover,
  onMove,
  onAlt,
  onDelete,
}: {
  meta: PhotoMeta;
  src: string | undefined;
  index: number;
  total: number;
  isCover: boolean;
  onCover: () => void;
  onMove: (delta: -1 | 1) => void;
  onAlt: (alt: string) => void;
  onDelete: () => void;
}) {
  const [alt, setAlt] = useState(meta.alt ?? '');
  const [confirming, setConfirming] = useState(false);
  const warning = resolutionWarning(meta.width);

  return (
    <div className="photo-detail">
      {/*
        The box has the photo's own proportions and its average colour from the first
        frame, so the drawer does not open onto a blank space that then jumps when the
        picture arrives.
      */}
      {src !== undefined && (
        <div
          className="photo-detail__frame"
          style={{
            aspectRatio: `${String(meta.width)} / ${String(meta.height)}`,
            backgroundColor: meta.dominantColor,
          }}
        >
          <img className="photo-detail__image" src={src} alt={meta.alt ?? ''} />
        </div>
      )}

      <dl className="photo-detail__facts">
        <dt>Soubor</dt>
        <dd>{meta.filename}</dd>
        <dt>Rozlišení</dt>
        <dd>
          {String(meta.width)} × {String(meta.height)} px
        </dd>
        <dt>Velikost</dt>
        <dd>
          {formatBytes(meta.bytesOriginal)} → {formatBytes(meta.bytesWebp)}
        </dd>
        <dt>Pořadí</dt>
        <dd>{index === -1 ? '—' : `${String(index + 1)} z ${String(total)}`}</dd>
      </dl>

      {warning !== null && <p className="photo-detail__warning">⚠ {warning.message}</p>}

      <div className="photo-detail__actions">
        {isCover ? (
          <p className="photo-detail__is-cover">✓ Tohle je titulní fotka</p>
        ) : (
          <Button buttonStyle="primary" onClick={onCover}>
            Nastavit jako titulní
          </Button>
        )}
        <span className="photo-detail__move">
          <Button
            buttonStyle="secondary"
            disabled={index <= 0}
            onClick={() => {
              onMove(-1);
            }}
          >
            ← Dřív
          </Button>
          <Button
            buttonStyle="secondary"
            disabled={index === -1 || index >= total - 1}
            onClick={() => {
              onMove(1);
            }}
          >
            Později →
          </Button>
        </span>
      </div>

      <label className="photo-detail__alt">
        <span>Popis fotky</span>
        <input
          type="text"
          value={alt}
          onChange={(event) => {
            setAlt(event.target.value);
          }}
          onBlur={() => {
            onAlt(alt.trim());
          }}
        />
        <small>Nepovinné. Čtou ho čtečky obrazovky a hledá se podle něj.</small>
      </label>

      <div className="photo-detail__danger">
        {confirming ? (
          <>
            <p>Smazat fotku i její soubory? Nejde to vzít zpátky.</p>
            <Button buttonStyle="error" onClick={onDelete}>
              Ano, smazat
            </Button>
            <Button
              buttonStyle="secondary"
              onClick={() => {
                setConfirming(false);
              }}
            >
              Ne
            </Button>
          </>
        ) : (
          <Button
            buttonStyle="secondary"
            onClick={() => {
              setConfirming(true);
            }}
          >
            Smazat fotku
          </Button>
        )}
      </div>
    </div>
  );
}

export default PhotoGrid;
