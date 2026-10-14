'use client';

import { useField } from '@payloadcms/ui';
import { photoUrl } from '@sabrina/shared/photo-url';
import { useEffect, useState } from 'react';

import {
  categoryOfField,
  orderColumns,
  shownInOrder,
  toOrderProject,
  type OrderProject,
} from '../lib/order-grid.ts';
import { fieldId, idsOf, moveTo } from '../lib/photo-tiles.ts';

import './order-grid.css';

/**
 * The order of the homepage as the homepage (docs/SPEC.md 8.5)
 * [rozhodnuto 13. 10. 2026].
 *
 * It was a row of chips with the titles, with a small picture of the result in
 * the sidebar: the order was set in one place and seen in another, and a chip
 * says nothing about a photograph. This is the grid itself — the covers in the
 * site's three columns, dealt by the same algorithm — and she drags a project
 * onto the place she wants it. The number on each tile is its place in the
 * order, which is what the phone and tablet layouts follow too.
 *
 * One component for every list: the order under All and each category's own.
 * Nothing is saved until she saves, as everywhere else in the admin.
 *
 * Every published project is on the grid [rozhodnuto 14. 10. 2026]. One she has
 * not placed yet sits at the top, newest first, marked Nový — exactly where the
 * site shows it — and dragging anything places them all as they stand. There
 * is no list of projects waiting to be added and no way to take one off here:
 * a project leaves the site by being unpublished.
 */

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_BASE ?? '';

export interface OrderGridProps {
  path: string;
  field?: { label?: unknown; admin?: { description?: unknown } };
}

export function OrderGrid({ path, field: config }: OrderGridProps) {
  const field = useField<unknown>({ path });
  const ids = idsOf(field.value);
  const category = categoryOfField(path);

  const [all, setAll] = useState<OrderProject[] | undefined>(undefined);
  const [dragId, setDragId] = useState<string | undefined>(undefined);
  const [overId, setOverId] = useState<string | undefined>(undefined);

  // Every project once; the lists are short and this keeps drags instant.
  useEffect(() => {
    let cancelled = false;
    void fetch('/api/projects?depth=1&limit=500&pagination=false', { credentials: 'include' })
      .then((response) =>
        response.ok ? (response.json() as Promise<{ docs?: unknown[] }>) : undefined,
      )
      .then((body) => {
        if (cancelled) return;
        setAll(
          (body?.docs ?? [])
            .map(toOrderProject)
            .filter((entry): entry is OrderProject => entry !== undefined),
        );
      })
      .catch(() => {
        if (!cancelled) setAll([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = (next: readonly string[]) => {
    field.setValue(next.map(fieldId));
  };

  const label = typeof config?.label === 'string' ? config.label : 'Pořadí';
  if (all === undefined) {
    return (
      <div className="field-type order-grid">
        <span className="field-label">{label}</span>
        <p className="order-grid__note">Načítám projekty…</p>
      </div>
    );
  }

  const shown = shownInOrder(all, ids, category);
  const placed = new Set(shown.filter((entry) => entry.placed).map((entry) => entry.project.id));
  const order = shown.map((entry) => entry.project.id);
  const columns = orderColumns(shown.map((entry) => entry.project));

  return (
    <div className="field-type order-grid">
      <span className="field-label">{label}</span>
      <p className="order-grid__note">
        Přetáhni projekt na místo jiného. Takhle se mřížka poskládá na počítači; číslo je pořadí,
        kterým se řídí i telefon. Nově publikované projekty jsou nahoře se štítkem Nový. Z webu
        projekt zmizí jen tím, že ho odpublikuješ.
      </p>

      {shown.length === 0 ? (
        <p className="order-grid__empty">Zatím tu není žádný publikovaný projekt.</p>
      ) : (
        <div className="order-grid__columns">
          {columns.map((column, index) => (
            // Three fixed columns, as on the site.
            <div key={index} className={`order-grid__column order-grid__column--${String(index)}`}>
              {column.map(({ project, position }) => (
                <div
                  key={project.id}
                  className={[
                    'order-grid__tile',
                    dragId === project.id ? 'order-grid__tile--dragging' : '',
                    overId === project.id && dragId !== undefined && dragId !== project.id
                      ? 'order-grid__tile--target'
                      : '',
                  ].join(' ')}
                  draggable
                  onDragStart={(event) => {
                    setDragId(project.id);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(event) => {
                    if (dragId === undefined) return;
                    event.preventDefault();
                    setOverId(project.id);
                  }}
                  onDrop={(event) => {
                    if (dragId === undefined) return;
                    event.preventDefault();
                    commit(moveTo(order, dragId, project.id));
                    setDragId(undefined);
                    setOverId(undefined);
                  }}
                  onDragEnd={() => {
                    setDragId(undefined);
                    setOverId(undefined);
                  }}
                >
                  <div
                    className="order-grid__photo"
                    style={{
                      aspectRatio: String(project.cover?.aspectRatio ?? 1),
                      backgroundColor: project.cover?.dominantColor,
                    }}
                  >
                    {project.cover === undefined ? null : (
                      <img
                        src={photoUrl(project.cover.id, project.cover.widths[0] ?? 400, IMG_BASE)}
                        alt=""
                        draggable={false}
                      />
                    )}
                    <span className="order-grid__number">{position + 1}</span>
                    {placed.has(project.id) ? null : (
                      <span
                        className="order-grid__new"
                        title="Ještě nezařazený — stojí nahoře, dokud ho nepřetáhneš"
                      >
                        Nový
                      </span>
                    )}
                  </div>
                  <span className="order-grid__title">
                    {project.title}
                    {project.published ? null : (
                      <em className="order-grid__draft"> · koncept, na webu není</em>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
