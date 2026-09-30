'use client';

import { useFormFields } from '@payloadcms/ui';
import { GRID_DESKTOP, layoutColumns } from '@sabrina/shared/grid';
import { photoUrl } from '@sabrina/shared/photo-url';
import type { Project } from '@sabrina/shared/schema';
import { useEffect, useState } from 'react';

import './tile-preview.css';

/**
 * The grid as the order she is dragging would produce (docs/SPEC.md 8.5).
 *
 * Ordering is otherwise blind: she sets a sequence and the algorithm decides
 * the positions, so without this she would have to publish to find out. It
 * runs the same layoutColumns the site runs, over the same covers.
 *
 * Deliberately small — this is about rhythm and balance, not about reading
 * the titles.
 */

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? '';
/** Shown at a twelfth of life size — enough to judge the shape of the page. */
const PREVIEW_DIVISOR = 12;

type Loaded = Pick<Project, 'title' | 'slug'> & { cover?: Project['cover'] };

export function OrderPreview() {
  const ids = useFormFields(([fields]) => fields['projects']?.value);
  const key = Array.isArray(ids) ? ids.map((id) => String(id)).join(',') : '';

  const [loaded, setLoaded] = useState<{ key: string; projects: Loaded[] } | undefined>(undefined);

  useEffect(() => {
    if (key === '') return;
    let cancelled = false;
    void fetch(`/api/projects?depth=1&limit=100&where[id][in]=${key}`)
      .then((response) =>
        response.ok ? (response.json() as Promise<{ docs: Loaded[] }>) : undefined,
      )
      .then((result) => {
        if (cancelled || result === undefined) return;
        // Back into the order she dragged them into; the API does not keep it.
        const byId = new Map(result.docs.map((doc) => [String((doc as { id?: unknown }).id), doc]));
        const ordered = key
          .split(',')
          .map((id) => byId.get(id))
          .filter((doc): doc is Loaded => doc !== undefined);
        setLoaded({ key, projects: ordered });
      })
      .catch(() => {
        // Without the covers there is nothing to lay out; the empty state shows.
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const projects = loaded?.key === key ? loaded.projects : [];
  const withCovers = projects.filter((project) => project.cover !== undefined);

  if (withCovers.length === 0) {
    return (
      <div className="tile-preview">
        <p className="tile-preview__label">Náhled mřížky</p>
        <p className="tile-preview__empty">
          Až budou mít projekty titulní fotku, uvidíš tady, jak se mřížka poskládá.
        </p>
      </div>
    );
  }

  const columns = layoutColumns(
    withCovers.map((project) => ({ aspectRatio: project.cover?.aspectRatio ?? 1 })),
    GRID_DESKTOP,
  );

  return (
    <div className="tile-preview">
      <p className="tile-preview__label">Náhled mřížky — takhle se poskládá na počítači</p>
      <div className="order-preview">
        {[0, 1, 2].map((column) => (
          <div
            key={column}
            className="order-preview__column"
            style={{
              marginTop: `${String((GRID_DESKTOP.offsets[column] ?? 0) / PREVIEW_DIVISOR)}px`,
            }}
          >
            {withCovers
              .filter((_, index) => columns[index] === column)
              .map((project) => (
                <div
                  key={project.slug}
                  className="order-preview__tile"
                  style={{
                    aspectRatio: String(project.cover?.aspectRatio ?? 1),
                    // Shows through until the photo loads, and stands in for
                    // it entirely while R2 is not configured yet.
                    backgroundColor: project.cover?.dominantColor ?? '#e2dfd7',
                  }}
                  title={project.title}
                >
                  {project.cover === undefined ? null : (
                    <img
                      src={photoUrl(project.cover.id, 400, IMG_BASE)}
                      alt=""
                      width={project.cover.width}
                      height={project.cover.height}
                    />
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderPreview;
