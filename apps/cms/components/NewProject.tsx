'use client';

import { Button, Drawer, useModal } from '@payloadcms/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  createProject,
  NEW_PROJECT_ERROR,
  openOnPhotosTab,
  projectPath,
} from '../lib/new-project.ts';

import './new-project.css';

/**
 * „Nový projekt" — a dialog that asks for the title and nothing else
 * (docs/SPEC.md 8.2).
 *
 * Payload's own "Create new" opens the whole form, which is the wrong shape for
 * this: uploading a series takes minutes and the metadata takes seconds, so the
 * point is to get her to the Fotky tab immediately and let her type the rest
 * while the photos go up. Hence one field and a button that says where it leads.
 *
 * Payload's own button stays where it is. This sits above the list and is the
 * one she will reach for; removing theirs would mean fighting the admin's own
 * layout for no gain (CLAUDE.md rule 9).
 */

const DRAWER_SLUG = 'new-project';

export function NewProject() {
  const { closeModal, openModal } = useModal();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const submit = async () => {
    if (title.trim() === '' || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const { id } = await createProject(title);
      await openOnPhotosTab(id);
      closeModal(DRAWER_SLUG);
      setTitle('');
      router.push(projectPath(id));
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : NEW_PROJECT_ERROR);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="new-project">
      <Button
        buttonStyle="primary"
        onClick={() => {
          openModal(DRAWER_SLUG);
        }}
      >
        Nový projekt
      </Button>

      <Drawer slug={DRAWER_SLUG} title="Nový projekt">
        <div className="new-project__body">
          <label className="new-project__label" htmlFor="new-project-title">
            Název projektu
          </label>
          <input
            id="new-project-title"
            className="new-project__input"
            type="text"
            value={title}
            autoFocus
            onChange={(event) => {
              setTitle(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submit();
              }
            }}
          />
          <p className="new-project__hint">
            Zbytek — kategorie, rok, klient, kredity — vyplníš, zatímco fotky pojedou nahoru. Adresa
            se z názvu vygeneruje sama a zamkne se až při publikaci.
          </p>

          {error !== undefined && <p className="new-project__error">{error}</p>}

          <Button
            buttonStyle="primary"
            disabled={busy || title.trim() === ''}
            onClick={() => {
              void submit();
            }}
          >
            {busy ? 'Vytvářím…' : 'Vytvořit a nahrát fotky'}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}

export default NewProject;
