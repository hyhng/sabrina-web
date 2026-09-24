import { Footer, Header } from '@sabrina/ui';

import { getContent } from '../lib/content.ts';

/**
 * 404 (Figma UI 10 node 161:292, UI 11 node 161:365).
 *
 * Header and footer as on the homepage, but no filter — there is no grid here
 * to filter. Next writes this out as 404.html, which is what Cloudflare Pages
 * serves for anything that is not a generated file (docs/SPEC.md 6).
 *
 * The short rule between the heading and the link is on the desktop artboard
 * only; the mobile one goes straight from one to the other.
 */
export default async function NotFound() {
  const { settings } = await getContent();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header settings={settings} />
      <main className="flex flex-1 flex-col items-center justify-center gap-[16px] text-ink tablet:gap-[20px]">
        <p className="text-[12px] opacity-50 tablet:text-[13px]">404</p>
        <p className="text-[22px] tablet:text-[28px]">{'This page doesn’t exist.'}</p>
        {/* [návrh] Shown from tablet up; there is no tablet artboard to check. */}
        <span aria-hidden="true" className="hidden h-[8px] w-px bg-line tablet:block" />
        <a href="/" className="text-[14px] underline tablet:text-[15px]">
          Back to all work
        </a>
      </main>
      <Footer settings={settings} />
    </div>
  );
}
