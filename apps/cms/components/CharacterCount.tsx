'use client';

import { useFormFields } from '@payloadcms/ui';

import { characterCount } from './character-count.ts';

import './character-count.css';

/**
 * A live character count under a textarea (docs/SPEC.md 8.4).
 *
 * Payload's textarea takes `maxLength` but draws no counter — it only refuses
 * the save. That is too late for the biography: docs/SPEC.md 5 says Information
 * must not scroll on the desktop, so she needs to see the length while she
 * writes, against the length the page was drawn for.
 *
 * Reads form state rather than the DOM, the same way the tile preview does, so
 * it also follows a value pasted in or loaded from the server.
 *
 * Wiring: admin.components.afterInput on the field, with `recommended` and
 * `max` in clientProps. `path` arrives from Payload.
 */
export function CharacterCount({
  max,
  path,
  recommended,
}: {
  max: number;
  path: string;
  recommended: number;
}) {
  const value = useFormFields(([fields]) => fields[path]?.value);
  const count = characterCount(value, { max, recommended });

  return (
    /*
     * No aria-live: a region that speaks on every keystroke is worse than
     * silence, and the limit is already in the field's description.
     */
    <p className={`character-count character-count--${count.tone}`}>{count.message}</p>
  );
}

export default CharacterCount;
