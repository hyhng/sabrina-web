/**
 * Site footer (Figma UI 04 node 154:10, UI 12 node 161:647, UI 06 node 154:381).
 *
 * The copyright on the left and the studio credit on the right, in one row from
 * tablet up and stacked below it [rozhodnuto 5. 10. 2026]. Figma has the links
 * here as well (Information, address, Instagram); they are gone. The header
 * carries them, and on a phone, where it shows Information alone, the address
 * and Instagram are on that page.
 *
 * Type is a step up from Figma (12 / 12.5px there) — 13, 14 and 15px, the last
 * being what the header's links use. [rozhodnuto 5. 10. 2026]
 *
 * It sits well clear of the content above it. Figma has the grid end and the
 * rule follow almost at once, which on a real page meant the last caption was
 * touching it. [návrh] 96 / 120 / 140px.
 *
 * The year comes from the build (docs/SPEC.md 7), so a rebuild rolls it over
 * and nobody has to remember.
 */

/**
 * Who built the site. The whole phrase is the link; only the name is set in
 * Medium, the weight the wordmark uses, to stand out.
 */
export const CREDIT = {
  prefix: 'Created by',
  name: 'KeySpace',
  href: 'https://keyspace.cz',
} as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-[96px] flex flex-col gap-[12px] border-t border-line px-[16px] pt-[24px] pb-[32px] text-[13px] text-ink tablet:mt-[120px] tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-0 tablet:px-[24px] tablet:pt-[28px] tablet:pb-[36px] tablet:text-[14px] desktop:mt-[140px] desktop:px-[34px] desktop:pt-[30px] desktop:pb-[44px] desktop:text-[15px] desktop:leading-[1.4] desktop:text-muted">
      <p className="text-[12px] opacity-50 tablet:text-[14px] tablet:opacity-60 desktop:text-[15px] desktop:opacity-100">
        © {year} Sabrina Kulhankova
      </p>

      <a href={CREDIT.href} className="text-ink" target="_blank" rel="noreferrer">
        {CREDIT.prefix} <span className="font-medium">{CREDIT.name}</span>
      </a>
    </footer>
  );
}
