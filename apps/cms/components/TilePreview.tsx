'use client';

import { useFormFields } from '@payloadcms/ui';
import { isCategory } from '@sabrina/shared/categories';
import type { Photo, Project } from '@sabrina/shared/schema';
import { Tile } from '@sabrina/ui';
import { useEffect, useState } from 'react';

import './tile-preview.css';

/**
 * The tile as the site will draw it, beside the fields that decide it
 * (docs/SPEC.md 8.3).
 *
 * It renders the same Tile from packages/ui the grid uses, so this is not an
 * impression of the result — it is the result, at the size it will appear.
 *
 * The cover arrives as an id, so its dimensions are fetched; without them the
 * tile cannot know its own shape.
 */

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? '';

export function TilePreview() {
  const raw = useFormFields(([fields]) => ({
    title: fields['title']?.value,
    category: fields['category']?.value,
    cover: fields['cover']?.value,
  }));

  // Narrowed rather than cast: the form holds whatever is typed into it.
  const title = typeof raw.title === 'string' && raw.title !== '' ? raw.title : undefined;
  const category = isCategory(raw.category) ? raw.category : undefined;
  const coverId =
    typeof raw.cover === 'string' || typeof raw.cover === 'number' ? raw.cover : undefined;

  /*
   * Keyed by the id it belongs to, so the cover is derived rather than reset
   * — clearing the field synchronously in the effect would cascade renders,
   * which react-hooks/set-state-in-effect rightly objects to.
   */
  const [loaded, setLoaded] = useState<{ id: string | number; photo: Photo } | undefined>(
    undefined,
  );

  useEffect(() => {
    if (coverId === undefined || coverId === '') return;
    let cancelled = false;
    void fetch(`/api/photos/${String(coverId)}?depth=0`)
      .then((response) => (response.ok ? (response.json() as Promise<Photo>) : undefined))
      .then((photo) => {
        if (!cancelled && photo !== undefined) setLoaded({ id: coverId, photo });
      })
      .catch(() => {
        // A preview that cannot load its photo simply shows the empty state.
      });
    return () => {
      cancelled = true;
    };
  }, [coverId]);

  const cover = loaded !== undefined && loaded.id === coverId ? loaded.photo : undefined;

  return (
    <div className="tile-preview">
      <p className="tile-preview__label">Náhled dlaždice</p>

      {cover === undefined || title === undefined || category === undefined ? (
        // docs/SPEC.md 8.8: an empty state says what to do, not just that it is empty.
        <p className="tile-preview__empty">
          Až vyplníš název, kategorii a vybereš titulní fotku, uvidíš tady přesně to, co bude na
          webu.
        </p>
      ) : (
        <div className="tile-preview__frame">
          <Tile
            project={
              {
                title,
                slug: 'preview',
                category,
                credits: [],
                photos: [cover],
                cover,
                status: 'draft',
              } satisfies Project
            }
            imgBase={IMG_BASE}
            // Nothing to open from here; the href would leave the admin.
            onOpen={() => undefined}
          />
        </div>
      )}
    </div>
  );
}

export default TilePreview;
