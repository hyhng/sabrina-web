'use client';

import { useDocumentInfo } from '@payloadcms/ui';

import { progressLabel } from '../lib/upload-queue.ts';
import { useUploadSnapshot } from './use-upload-snapshot.ts';

import './photo-grid.css';

/**
 * The state of the uploads, wherever in the editor she is (docs/SPEC.md 8.4).
 *
 * The photo grid is on the Fotky tab, and the queue keeps running when she is on
 * another. Without something that is always on screen she would see nothing for a
 * series that is still going up — which is what first made her think it had
 * stopped. It reads the same store as the grid, so the two cannot disagree.
 */
export function UploadStatus() {
  const { id } = useDocumentInfo();
  const docKey = id === undefined ? 'new' : String(id);
  const { items } = useUploadSnapshot();

  const mine = items.filter((item) => item.docKey === docKey);
  if (mine.length === 0) return null;

  const moving = mine.some((item) => ['queued', 'converting', 'uploading'].includes(item.stage));
  const failed = mine.filter((item) => item.stage === 'failed' || item.stage === 'rejected').length;
  // All arrived and nothing to say: the grid already shows them.
  if (!moving && failed === 0) return null;

  return (
    <div className="upload-status" role="status">
      <p className="upload-status__title">{moving ? 'Nahrávám fotky…' : 'Nahrávání skončilo'}</p>
      <p className="upload-status__line">{progressLabel(mine)}</p>
      {moving && <span className="upload-status__bar" aria-hidden="true" />}
      <p className="upload-status__hint">Najdeš je na záložce Fotky.</p>
    </div>
  );
}

export default UploadStatus;
