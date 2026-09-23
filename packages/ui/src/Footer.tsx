import type { Settings } from '@sabrina/shared/schema';

/**
 * Site footer (Figma UI 04 node 154:10, UI 12 node 161:647, UI 06 node 154:381).
 *
 * One row from tablet up — copyright left, links right. On mobile it stacks:
 * the two short links, then the address, then the copyright.
 *
 * The year comes from the build (docs/SPEC.md 7), so a rebuild rolls it over
 * and nobody has to remember.
 */
export interface FooterProps {
  settings: Settings;
}

export function Footer({ settings }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="flex flex-col gap-[12px] border-t border-line px-[16px] pt-[24px] pb-[32px] text-[12px] text-ink tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-0 tablet:px-[24px] tablet:pt-[28px] tablet:pb-[36px] desktop:px-[34px] desktop:pt-[30px] desktop:pb-[44px] desktop:text-[12.5px] desktop:leading-[1.4] desktop:text-muted">
      <p className="order-3 text-[11px] opacity-50 tablet:order-1 tablet:text-[12px] tablet:opacity-60 desktop:text-[12.5px] desktop:opacity-100">
        © {year} Sabrina Kulhankova
      </p>

      <div className="order-1 flex flex-col gap-[12px] tablet:order-2 tablet:flex-row tablet:gap-[20px] desktop:gap-[24px]">
        {/* display:contents from tablet up, so the three links share one row. */}
        <div className="flex gap-[20px] tablet:contents">
          <a href="/information/" className="tablet:order-1">
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
    </footer>
  );
}
