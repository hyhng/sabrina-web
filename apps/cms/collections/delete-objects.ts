import { targets } from '../lib/presign.ts';
import type { PhotoRow } from '../lib/presign.ts';

/**
 * Taking a photo's files out of R2 when its row goes (docs/TECH.md 5).
 *
 * The keys come from the same `targets` the upload signed, so the two cannot
 * drift: whatever was put there is what gets removed. Nothing here talks to R2
 * — the caller passes in a delete, which is what lets this be tested without a
 * bucket and lets the hook stay a handful of lines.
 */

export type DeleteObjects = (keys: string[]) => Promise<void>;

export type Removal =
  | { readonly removed: string[] }
  /** The row is already gone; this only decides what to say about the files. */
  | { readonly left: string[]; readonly reason: string };

/**
 * English, unlike the rest of the admin's wording: this goes to the server log,
 * which is the developer's, not hers.
 */
export function orphanWarning(keys: string[], reason: string): string {
  return `Photo row deleted but ${String(keys.length)} object(s) left in R2 (${reason}): ${keys.join(', ')}`;
}

/**
 * Payload has already deleted the row by the time an afterDelete hook runs, so
 * a failure here cannot be turned into a refusal. It is logged loudly instead:
 * leftover objects cost pennies and are findable, and failing the delete after
 * the fact would only confuse her.
 */
export async function removeObjects(
  row: PhotoRow,
  remove: DeleteObjects | undefined,
  reason: string,
): Promise<Removal> {
  const keys = targets(row).map((target) => target.key);
  if (remove === undefined) return { left: keys, reason };
  try {
    await remove(keys);
    return { removed: keys };
  } catch (error) {
    return { left: keys, reason: error instanceof Error ? error.message : reason };
  }
}
