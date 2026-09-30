import { acceptFile, formatBytes, resolutionWarning } from '@sabrina/shared/upload';

import { MAX_CONCURRENT_UPLOADS } from './photo-pipeline.ts';

/**
 * The upload table, as state rather than as markup (docs/SPEC.md 8.4 point 6).
 *
 * Every row goes through the same stages, and what the table says about a row
 * is a function of its stage — so both live here, away from the drag-and-drop
 * and the canvas. That is what lets the wording, the size arithmetic and the
 * three-at-a-time rule be tested without a browser.
 *
 * Nothing here touches the network or the DOM. The component in
 * components/PhotoUpload.tsx does the work and feeds the results back in.
 */

export type Stage =
  /** Accepted, waiting for a slot. */
  | 'queued'
  /** Being decoded, measured and re-encoded in the browser. */
  | 'converting'
  /** Variants on their way to R2. */
  | 'uploading'
  /** Bytes in R2 and the row written. */
  | 'done'
  /** Wrong format — never started (docs/SPEC.md 8.4 point 1). */
  | 'rejected'
  /** Started and broke. Retryable. */
  | 'failed';

export type Item = {
  /** Client-side only; the photo id arrives with `done`. */
  readonly id: string;
  readonly filename: string;
  readonly bytesOriginal: number;
  readonly stage: Stage;
  /** From createImageBitmap, so EXIF orientation is already applied. */
  readonly width?: number;
  readonly height?: number;
  /** All variants together — what the site will actually serve. */
  readonly bytesWebp?: number;
  /** The photo row's id, once the server has it. */
  readonly photoId?: string;
  /** Why it was rejected or what broke. */
  readonly message?: string;
};

export type Row = {
  readonly item: Item;
  /** "Převádím…", "✓ Připraveno", "⚠ …" (docs/SPEC.md 8.4 point 6). */
  readonly status: string;
  /** "8,2 MB → 310 kB", or the original alone until there is an after. */
  readonly size: string;
  /** "4000 × 2667 px", empty until measured. */
  readonly resolution: string;
  /** The one warning the upload gives (docs/SPEC.md 8.4 point 7). */
  readonly warning?: string;
};

/** A dropped file, in the order she dropped it. Rejected files still get a row. */
export function accept(files: readonly { name: string; size: number; type: string }[]): Item[] {
  return files.map((file, index) => {
    const verdict = acceptFile(file.type);
    return {
      // Name and position: two files of the same name in one drop stay apart.
      id: `${String(index)}-${file.name}`,
      filename: file.name,
      bytesOriginal: file.size,
      ...(verdict.ok
        ? { stage: 'queued' as const }
        : { stage: 'rejected' as const, message: verdict.message }),
    };
  });
}

export function patch(items: readonly Item[], id: string, change: Partial<Item>): Item[] {
  return items.map((item) => (item.id === id ? { ...item, ...change } : item));
}

/** Stages that hold a slot: three files move at once, no more (docs/TECH.md 5). */
const BUSY: readonly Stage[] = ['converting', 'uploading'];

/**
 * Which queued files may start now. Returned rather than started, so the
 * rule is testable and the component stays a loop over this list.
 */
export function readyToStart(
  items: readonly Item[],
  limit: number = MAX_CONCURRENT_UPLOADS,
): Item[] {
  const busy = items.filter((item) => BUSY.includes(item.stage)).length;
  const free = Math.max(0, limit - busy);
  return items.filter((item) => item.stage === 'queued').slice(0, free);
}

export function isFinished(items: readonly Item[]): boolean {
  return items.every(
    (item) => item.stage === 'done' || item.stage === 'rejected' || item.stage === 'failed',
  );
}

function status(item: Item): string {
  switch (item.stage) {
    case 'queued':
      return 'Ve frontě';
    case 'converting':
      return 'Převádím…';
    case 'uploading':
      return 'Nahrávám…';
    case 'done':
      return '✓ Připraveno';
    case 'rejected':
    case 'failed':
      return `⚠ ${item.message ?? 'Nepovedlo se.'}`;
  }
}

function size(item: Item): string {
  const before = formatBytes(item.bytesOriginal);
  // The arrow appears only once there is something on the other side of it.
  return item.bytesWebp === undefined ? before : `${before} → ${formatBytes(item.bytesWebp)}`;
}

export function toRow(item: Item): Row {
  const warning = item.width === undefined ? null : resolutionWarning(item.width);
  return {
    item,
    status: status(item),
    size: size(item),
    resolution:
      item.width === undefined || item.height === undefined
        ? ''
        : `${String(item.width)} × ${String(item.height)} px`,
    ...(warning === null ? {} : { warning: warning.message }),
  };
}

/** "3 ze 7 hotovo" under the table — she leaves this running and comes back. */
export function progressLabel(items: readonly Item[]): string {
  const done = items.filter((item) => item.stage === 'done').length;
  const failed = items.filter(
    (item) => item.stage === 'failed' || item.stage === 'rejected',
  ).length;
  const head = `${String(done)} z ${String(items.length)} hotovo`;
  return failed === 0 ? head : `${head}, ${String(failed)} neprošlo`;
}
