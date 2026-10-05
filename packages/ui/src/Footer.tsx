import type { Settings } from '@sabrina/shared/schema';
import type { MouseEvent } from 'react';

/**
 * Site footer (Figma UI 04 node 154:10, UI 12 node 161:647, UI 06 node 154:381).
 *
 * Desktop is one row of three: the studio credit left, the links in the middle,
 * the copyright right [rozhodnuto 5. 10. 2026; Figma has the copyright left and
 * the links right]. Tablet puts the links on a row of their own with the credit
 * and copyright underneath, because three items do not fit across 810px at this
 * size. On mobile everything stacks: the two short links, then the address, then
 * the copyright, then the credit.
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
export interface FooterProps {
  settings: Settings;
  /** Open Information without navigating (docs/TECH.md 4.1). */
  onOpenInformation?: () => void;
}

/** Who built the site. Medium, the weight the wordmark uses, to stand out. */
export const CREDIT = { label: 'Created by KeySpace', href: 'https://keyspace.cz' } as const;

export function Footer({ settings, onOpenInformation }: FooterProps) {
  const openInformation =
    onOpenInformation === undefined
      ? undefined
      : (event: MouseEvent) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          onOpenInformation();
        };

  const year = new Date().getFullYear();

  return (
    <footer className="mt-[96px] flex flex-col gap-[12px] border-t border-line px-[16px] pt-[24px] pb-[32px] text-[13px] text-ink tablet:mt-[120px] tablet:grid tablet:grid-cols-2 tablet:gap-x-0 tablet:gap-y-[20px] tablet:px-[24px] tablet:pt-[28px] tablet:pb-[36px] tablet:text-[14px] desktop:mt-[140px] desktop:grid-cols-[1fr_auto_1fr] desktop:items-start desktop:px-[34px] desktop:pt-[30px] desktop:pb-[44px] desktop:text-[15px] desktop:leading-[1.4] desktop:text-muted">
      <div className="order-1 flex flex-col gap-[12px] tablet:col-span-2 tablet:flex-row tablet:justify-center tablet:gap-[20px] desktop:order-2 desktop:col-span-1 desktop:gap-[24px]">
        {/* display:contents from tablet up, so the three links share one row. */}
        <div className="flex gap-[20px] tablet:contents">
          <a href="/information/" className="tablet:order-1" onClick={openInformation}>
            Information
          </a>
          <a
            href={settings.instagramUrl}
            className="tablet:order-3"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
        </div>
        <a href={`mailto:${settings.email}`} className="tablet:order-2">
          {settings.email}
        </a>
      </div>

      <p className="order-2 text-[12px] opacity-50 tablet:order-3 tablet:justify-self-end tablet:text-[14px] tablet:opacity-60 desktop:order-3 desktop:text-[15px] desktop:opacity-100">
        © {year} Sabrina Kulhankova
      </p>

      <a
        href={CREDIT.href}
        className="order-3 font-medium text-ink tablet:order-2 tablet:justify-self-start desktop:order-1"
        target="_blank"
        rel="noreferrer"
      >
        {CREDIT.label}
      </a>
    </footer>
  );
}
