'use client';

import { Button, toast } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

import { HOOK_REFUSED, lastPublishedLabel } from '../lib/publish.ts';

import './publish-button.css';

/**
 * „Publikovat web" in the admin navigation (docs/SPEC.md 8.7).
 *
 * The site is static, so nothing she saves is visible to anyone until a build
 * runs. Without this button that fact is invisible and she would reasonably
 * assume saving is publishing.
 *
 * It sits in the navigation rather than on one screen because it is the last
 * step of every session, whichever screen she finishes on.
 *
 * Underneath, „Zobrazit web" opens the site in a new tab, so she can check the
 * result without leaving the admin [rozhodnuto 5. 10. 2026].
 */
export function PublishButton({ siteUrl }: { siteUrl: string }) {
  const [busy, setBusy] = useState(false);
  const [lastPublishedAt, setLastPublishedAt] = useState<unknown>(undefined);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/globals/publish?depth=0', { credentials: 'include' })
      .then((response) => (response.ok ? (response.json() as Promise<unknown>) : undefined))
      .then((body) => {
        if (cancelled || body === undefined) return;
        setLastPublishedAt((body as { lastPublishedAt?: unknown }).lastPublishedAt);
      })
      .catch(() => {
        // The button still works; only the line underneath it goes missing.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const publish = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/publish', { method: 'post', credentials: 'include' });
      const body = (await response.json()) as { message?: string; lastPublishedAt?: string };
      if (response.ok) {
        toast.success(body.message ?? '');
        setLastPublishedAt(body.lastPublishedAt);
      } else {
        // The server's own words: it knows whether this is a setup problem.
        toast.error(body.message ?? HOOK_REFUSED);
      }
    } catch {
      toast.error(HOOK_REFUSED);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="publish">
      <Button
        buttonStyle="primary"
        disabled={busy}
        onClick={() => {
          void publish();
        }}
      >
        {busy ? 'Publikuju…' : 'Publikovat web'}
      </Button>
      <p className="publish__when">{lastPublishedLabel(lastPublishedAt)}</p>
      <a className="publish__site" href={siteUrl} target="_blank" rel="noreferrer">
        Zobrazit web ↗
      </a>
    </div>
  );
}

export default PublishButton;
