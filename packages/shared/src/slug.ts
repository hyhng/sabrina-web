/**
 * Turns a project title into the address it lives at (docs/SPEC.md 8.3).
 *
 * Diacritics are stripped rather than dropped, so "Šeřík" becomes "serik" and
 * not "erk". Everything that is not a letter or a digit becomes a separator,
 * which takes care of the em dashes and the × the titles are full of.
 *
 * The result always satisfies the slug pattern in schema.ts, or is empty —
 * a title of nothing but punctuation has no address to offer.
 */
export function slugify(title: string): string {
  return (
    title
      .normalize('NFD')
      // Combining marks left behind by the decomposition.
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}
