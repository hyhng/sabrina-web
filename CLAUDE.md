# Sabrina Kulhankova — portfolio

Portfolio web fotografky **Sabrina Kulhankova** (Praha). Jednostránkový web: grid projektů, každý klik otevře overlay (detail projektu, Information). Fotky a texty spravuje klientka sama v jednoduchém CMS.

- **Veřejný web:** anglicky, staticky generovaný, Cloudflare
- **Admin (CMS):** česky, Payload 3 na vlastním serveru, jen pro klientku
- **Komunikace s vývojářem:** česky. Kód, komentáře, názvy commitů a branchí: anglicky.

---

## Dokumenty — čti před prací

| Soubor | Co v něm je | Kdy číst |
|---|---|---|
| `docs/PHASES.md` | fáze, úkoly, stav, co blokuje klientka | **vždy na začátku session** |
| `docs/SPEC.md` | funkční specifikace — co web a admin dělají | před každou feature |
| `docs/DESIGN.md` | tokeny, typografie, mřížka, mapa Figma nodů | před každou UI prací |
| `docs/TECH.md` | stack, architektura, repo, env, infrastruktura | při setupu a architektonických rozhodnutích |

**Priorita při rozporu:** `SPEC.md` (rozhodnutí) → Figma „UI — Finál v2" (pixely) → ostatní. Figma přebíjí čísla v `DESIGN.md`, ale **ne** rozhodnutí v `SPEC.md`. Když si najdeš rozpor, neřeš ho potichu — napiš ho.

---

## Stack v kostce

Next.js 16 (App Router, `output: 'export'`) · Payload 3.x + Postgres · Cloudflare Pages + R2 · Hetzner CAX11 · Tailwind · `motion` · zod · pnpm workspaces · TypeScript strict.

```
apps/web        Next.js — statický export, Cloudflare Pages
apps/cms        Next.js + Payload 3 — server (admin.<doména>)
packages/shared zod schémata, algoritmus gridu, URL fotek
packages/ui     sdílené React komponenty (Tile, Grid, Photo…)
```

Příkazy (vzniknou ve fázi 1):

```bash
pnpm install
pnpm dev:web        # web s lokálními seed daty, bez CMS
pnpm dev:cms        # Payload admin, potřebuje Postgres (docker compose up db)
pnpm build:web      # statický export do apps/web/out
pnpm lint && pnpm typecheck && pnpm test
```

---

## Tvrdá pravidla

Tohle neporušuj ani „dočasně". Když se ti zdá, že je to potřeba, zastav se a zeptej se.

1. **`apps/web` zůstává statický export.** Nepoužívat: Server Actions, Intercepting Routes, middleware/proxy, `cookies()`, `headers()`, rewrites/redirects v `next.config`, ISR, `next/image` s výchozím loaderem. Build to stejně shodí — nevymýšlet obezličky.
2. **Overlaye nejsou intercepting routes.** URL se mění přes `history.pushState`, každá URL má zároveň vlastní předgenerované HTML. Detail v `TECH.md → Overlaye a URL`.
3. **Poměr stran fotky se bere z dat, nikdy se neměří v prohlížeči.** Grid se musí vyrenderovat bez poskakování ještě před načtením fotek.
4. **Kategorie je výčet `commercial | art`**, ne volný text. Jeden zdroj pravdy v `packages/shared`.
5. **Fotky bez rámečků**, pasparty, stínů, zaoblení. Dlaždice = fotka + popiska.
6. **Jméno vždy bez diakritiky:** `Sabrina Kulhankova`. Kontakt: `sabrina.kulhankova@gmail.com`, Instagram `@sabrinakulhankova.photography`.
7. **Font Lora přes `next/font`** (stáhne se při buildu, servíruje se z naší domény). Nikdy `<link>` na fonts.googleapis.com — GDPR.
8. **Žádné cookies, žádný tracking** kromě Cloudflare Web Analytics (bez cookies → žádná cookie lišta).
9. **Payload 3.x.** Admin upravovat přes React komponenty a konfiguraci, **nikdy přepisováním jejich CSS** (Payload 4 odstraní Sass a redesignuje admin).
10. **Fotky se zpracovávají v prohlížeči**, ne na serveru. Žádný `sharp`, fronta ani worker.
11. **Všechny účty patří klientce.** Nezakládej služby, API klíče ani konfiguraci na účet nebo e-mail vývojáře. Secrets jen v `.env`, nikdy v gitu.
12. **Nepřidávej funkce mimo `SPEC.md`.** Když spec mlčí (hover, stavy, animace), navrhni minimální řešení a napiš, že je to návrh.

---

## Figma

- **Soubor:** `llti0o1c802eZCRmdrw1hi` — https://www.figma.com/design/llti0o1c802eZCRmdrw1hi/WEB--Sabrina
- **Platí jen sekce „UI — Finál v2"** (node `154:2`) na stránce UI. Vše nad ní je explorace, **neimplementovat**.
- Mapa artboardů je v `docs/DESIGN.md`. Pro přesné hodnoty volej Figma MCP `get_design_context` na konkrétní node, ne na celou stránku (je obří).
- Figma MCP v Claude Code: `claude mcp add --transport http figma https://mcp.figma.com/mcp`

---

## Jak pracovat

1. Na začátku session otevři `docs/PHASES.md`, najdi aktuální fázi a první nehotový úkol.
2. Jeden úkol = jeden commit (Conventional Commits, anglicky: `feat(web): offset grid layout`).
3. Před commitem: `pnpm lint && pnpm typecheck && pnpm test` musí projít.
4. UI ověřuj vizuálně proti Figma nodu — screenshot v prohlížeči vedle `get_screenshot` z Figmy.
5. Na konci session odškrtni hotové úkoly v `PHASES.md` a připiš řádek do **Deníku** dole v tom souboru (datum, co se udělalo, co zůstalo).
6. Nové rozhodnutí, které mění spec → zapiš do `SPEC.md` a do tabulky Rozhodnutí v `PHASES.md`.
