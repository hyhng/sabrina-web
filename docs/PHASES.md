# Projekt — fáze, úkoly, stav

**Klientka:** Sabrina Kulhankova · **Start stavby:** 23. 9. 2026
**Přístup:** stavíme hned, obsah (texty, finální fotky) klientka doplní přes CMS. Do té doby web běží na seed datech z Figmy.

Legenda: `[ ]` čeká · `[~]` rozpracováno · `[x]` hotovo · 🔒 blokuje klientka

**Aktuální fáze: F2**

---

## Přehled

| Fáze | Cíl | Závisí na | Stav |
|---|---|---|---|
| **F0** | Účty a infrastruktura | klientka zakládá účty | 🔒 čeká |
| **F1** | Základ repa | — | ✅ hotovo |
| **F2** | Web na seed datech + náhled pro klientku | F1 | ⏳ další |
| **F3** | CMS | F1, server z F0 | |
| **F4** | Napojení webu na CMS, publikace | F2, F3 | |
| **F5** | Reálný obsah a doladění | F4, obsah od klientky 🔒 | |
| **F6** | Spuštění a předání | F5, doména z F0 🔒 | |

**F0 běží paralelně** s F1 a F2 — propagace DNS a zakládání účtů trvá, ať to nečeká na konec. F2 nepotřebuje nic od klientky.

---

## F0 — Účty a infrastruktura 🔒

**Cíl:** všechno, co web potřebuje, existuje a patří klientce.

- [ ] 🔒 Klientka vybere a koupí doménu (Wedos / Forpsi) — **na sebe**
- [ ] 🔒 Klientka založí účet Cloudflare, pozve vývojáře jako člena
- [ ] Přidat doménu do Cloudflare, přepnout NS u registrátora
- [ ] 🔒 Klientka založí Hetzner Cloud projekt, pozve vývojáře
- [ ] Server CAX11: Ubuntu LTS, Docker, ufw, SSH klíč, unattended-upgrades
- [ ] R2 bucket + custom doména `img.`, CORS pro `admin.`, API token
- [ ] 🔒 Resend účet na klientku, ověřit doménu pro odesílání
- [ ] Cloudflare Web Analytics

**Hotovo když:** `ssh` na server funguje, `img.<doména>` servíruje testovací soubor, účty jsou na klientku a vývojář je v nich jen pozvaný.

---

## F1 — Základ repa

**Cíl:** prázdná, ale kompletní kostra, na které jde stavět.

- [x] pnpm workspace: `apps/web`, `apps/cms`, `packages/shared`, `packages/ui`
- [x] TypeScript strict, ESLint, Prettier, Vitest; skripty `dev:web`, `dev:cms`, `build:web`, `lint`, `typecheck`, `test`
- [x] `apps/web`: Next 16, `output: 'export'`, `trailingSlash: true`, Tailwind
- [x] Tailwind theme z `DESIGN.md` (barvy, breakpointy 600 / 768 / 1024)
- [x] Lora přes `next/font/google` (400, 500, latin + latin-ext)
- [x] `packages/shared/schema.ts` — zod: Project, Photo, Homepage, Settings, kategorie
- [x] `packages/shared/grid.ts` + unit testy (musí sedět na UI 04, viz TECH 4.5)
- [x] `packages/shared/photo-url.ts` — srcset helper
- [x] Seed: vyexportovat fotky z Figmy (sekce `91:58`, `99:72`) přes Figma MCP, dev skript vygeneruje WebP varianty do `apps/web/public/seed/`, `content/seed.json` s 9 projekty z UI 04 (sharp smí být jen devDependency tohoto skriptu)
- [x] `lib/content.ts` s přepínačem `CONTENT_SOURCE`
- [x] GitHub repo, CI (lint, typecheck, test, build webu)
- [x] `.env.example`

**Hotovo když:** `pnpm build:web` vyrobí `out/` s prázdnou stránkou v Loře na správném pozadí, CI je zelené, testy gridu projdou.

---

## F2 — Web na seed datech

**Cíl:** celý veřejný web podle Figmy, nasazený na preview URL (`*.pages.dev`), aby ho klientka viděla s placeholder obsahem.

**Grid**
- [ ] `Photo` (srcset, aspect-ratio, dominantColor, fade-in)
- [ ] `Tile` (fotka + popiska, hover)
- [ ] `OffsetGrid` — 3 / 2 / 2 sloupce podle breakpointu, bez posunu po načtení
- [ ] Header a patička — desktop / tablet / mobil (UI 04, 12, 06)
- [ ] Filtr — stav v URL, animované přeskládání

**Detail**
- [ ] Routing overlayů: `/work/[slug]/`, `pushState`, zavření, Zpět (TECH 4.1)
- [ ] `DetailOverlay` desktop — bílá plocha, vybledlé pozadí, meta (UI 05)
- [ ] Fotka na šířku — `contain` (UI 05B)
- [ ] Škálování plochy fotky podle výšky okna
- [ ] `Carousel` + `ArrowButton` — hover, klávesy, bez protáčení, přednačítání
- [ ] Mobilní detail — swipe (UI 09)
- [ ] Přechod dlaždice → detail (sdílený layout, sousedé uhnou) a zpět
- [ ] Focus trap, scroll lock, návrat fokusu, `prefers-reduced-motion`

**Ostatní**
- [ ] Information desktop + mobil (UI 07, 08)
- [ ] 404 (UI 10, 11)
- [ ] Meta tagy, OG, sitemap, robots, JSON-LD
- [ ] Cloudflare Pages napojené na repo → preview URL
- [ ] Vizuální kontrola všech artboardů Finál v2 proti Figmě
- [ ] Playwright: otevřít detail z gridu, listovat, zavřít Zpět; přímý příchod na `/work/…`; filtr

**Hotovo když:** každý artboard z `DESIGN.md → Mapa` má odpovídající stav na preview URL, Lighthouse mobil ≥ 95 výkon / 100 přístupnost (kromě otevřeného kontrastu), klientka dostala odkaz.

---

## F3 — CMS

**Cíl:** klientka umí sama založit projekt, nahrát fotky, seřadit grid a upravit Information.

- [ ] `apps/cms`: Payload 3 + Postgres, `docker compose` pro lokální DB
- [ ] Čeština jako jazyk adminu
- [ ] Kolekce `Users` (jeden uživatel), `Projects` (drafts), `Photos`
- [ ] Globály `Homepage`, `Settings`
- [ ] Access control: veřejně jen `published`
- [ ] Slug — generování a zamčení po publikaci
- [ ] Nahrávání fotek v prohlížeči: Worker, WebP + `@jsquash/webp` fallback, presign, přímý PUT do R2 (TECH 5)
- [ ] Tabulka nahrávání: před → po, stavy, varování nízkého rozlišení
- [ ] Řazení fotek v projektu, výběr titulní fotky
- [ ] Obrazovka Pořadí na homepage, automatické přidání nového projektu na konec
- [ ] Nastavení webu (portrét, bio s počítadlem, kontakt, SEO)
- [ ] Náhled dlaždice v editoru (`Tile` z `packages/ui`)
- [ ] Flow Nový projekt (dialog jen s názvem → Fotky)
- [ ] Prázdné stavy a chybové hlášky (SPEC 8.8)
- [ ] Mazání fotky maže i R2 objekty
- [ ] Nasazení na server: arm64 image, Caddy, `admin.<doména>`
- [ ] Zálohy: denní `pg_dump` do R2, retence 30 dní
- [ ] Test uploadu v **Safari** (WebP fallback) a Chrome

**Hotovo když:** na `admin.<doména>` jde projít celý flow Nový projekt → fotky → publikovat v Chrome i Safari a v R2 leží WebP varianty.

---

## F4 — Napojení a publikace

- [ ] `CONTENT_SOURCE=payload` v buildu na Cloudflare
- [ ] Endpoint `/api/publish` → deploy hook, tlačítko „Publikovat web" s časem posledního publikování
- [ ] Zod validace při buildu — rozbitá data shodí build, stará verze zůstane
- [ ] Přenést seed obsah do CMS (ať web nezůstane prázdný)
- [ ] e2e: změna v adminu → Publikovat → změna na webu

**Hotovo když:** klientka změní název projektu, klikne Publikovat a za pár minut ho vidí na webu.

---

## F5 — Obsah a doladění 🔒

- [ ] 🔒 Klientka nahraje finální projekty a fotky
- [ ] 🔒 Bio, klienti, kredity, portrét
- [ ] 🔒 Potvrzení kategorií Commercial / Art
- [ ] Favicon, OG obrázek webu
- [ ] Kontrola gridu s reálnými poměry stran (pár fotek na šířku drží rytmus)
- [ ] Cross-browser: Chrome, Safari macOS + iOS, Firefox, Edge
- [ ] Výkon a přístupnost na reálných fotkách
- [ ] Rozhodnout otevřené otázky níže

---

## F6 — Spuštění a předání 🔒

- [ ] DNS produkční domény → Cloudflare Pages
- [ ] **Test obnovení zálohy** (obnovit DB na čistý kontejner)
- [ ] Kontrola: všechny účty na klientku, vývojář jen pozvaný
- [ ] Krátký návod pro klientku česky (1 strana: přidat projekt, seřadit, publikovat, co dělat, když něco nejde)
- [ ] Předání přístupů, domluva údržby (aktualizace a kontrola záloh 2× ročně)

---

## Otevřené otázky

| # | Otázka | Kdo | Blokuje | Stav |
|---|---|---|---|---|
| 1 | Jaká doména? | Sabrina | F0, F6 | 🔒 |
| 2 | Kategorie Commercial / Art — sedí? Změna je levná. | Sabrina | F5 | 🔒 |
| 3 | Chce v Information „Vybraní klienti" a „Publikace"? Mění datový model. | Sabrina | **F3** (schéma) | 🔒 |
| 4 | Vícejazyčnost — potvrdit, že **ne**. Přidat později je drahé. | Sabrina | **F3** (schéma) | 🔒 |
| 5 | Kolik fotek má typická série? Nad ~12 zvážit vrátit indikátor. | Sabrina | F5 | 🔒 |
| 6 | Kontrast: neaktivní filtr 40 % → 60 %, kategorie `soft` → tmavší? (SPEC 9.3) | my + Sabrina | F2 | |
| 7 | Popis série („O sérii") — byl ve wireframu CMS, v UI 02A se nezobrazuje. Vynechat? | my | F3 | návrh: vynechat |
| 8 | Publikovat ručně tlačítkem, nebo automaticky po uložení? | my | F3 | návrh: ručně |
| 9 | Favicon a OG obrázek webu | my | F5 | |

---

## Rozhodnutí

| Datum | Rozhodnutí | Proč |
|---|---|---|
| 13. 9. | Payload 3, self-host; web statický na Cloudflare | levné (~172 Kč/měs.), web nezávisí na serveru |
| 13. 9. | Fotky se převádějí do WebP v prohlížeči | žádná serverová pipeline |
| 13. 9. | Všechny účty na klientku | vlastnictví, předání |
| 14. 9. | Bez paspart a rámečků; pole „Typ dlaždice" zrušeno | fotky mluví samy |
| 14. 9. | Jméno bez diakritiky | přání klientky |
| 23. 9. | Grid 01C (3 offsetové sloupce), mobil a tablet 2 sloupce | klientka |
| 23. 9. | Detail 02A, carousel, bez číselného indikátoru | klientka; riziko u dlouhých sérií přijato |
| 23. 9. | Font Lora, filtr All · Commercial · Art | klientka |
| 23. 9. | Overlaye přes `pushState` + statické HTML pro každou URL, ne intercepting routes | statický export je nepodporuje |
| 23. 9. | Filtr na klientovi, stav v URL | bez rebuildu, sdílitelné |
| 23. 9. | WebP v Safari přes `@jsquash/webp` | Safari z canvasu WebP neumí |
| 23. 9. | Stavět hned, obsah přes CMS | nečekat na klientku |
| 23. 9. | TypeScript 5.9, ne 7 | typescript-eslint podporuje jen `<6.1`; TS 7 je nativní kompilátor, nástroje na něj zatím nedošly |
| 23. 9. | `dominantColor` = průměr kanálů, ne sharp `dominant` | SPEC 8.4 chce průměrnou barvu; `dominant` u tmavých fotek spadne na černou a je jako placeholder k ničemu |
| 23. 9. | `sharp` jen jako devDependency seed skriptu, hlídá CI | pravidlo 10 chrání produkční server, ne build-time fixture; hlídá to stroj, ne paměť |
| 23. 9. | `captionGap` (12) oddělen od `captionHeight` (42) v `GridConfig` | čísla z DESIGN.md jdou do konfigurace 1:1 |

---

## Rizika

| Riziko | Dopad | Opatření |
|---|---|---|
| Safari tiše vrátí PNG místo WebP | těžké soubory na webu | kontrola `blob.type` + WASM fallback, test v Safari v F3 |
| Velké fotky na iOS narazí na limit canvasu | upload z telefonu selže | admin primárně z počítače; srozumitelná chyba |
| Server nedostupný při „Publikovat" | build selže | stará verze webu zůstává; hláška v adminu |
| Série delší než ~12 fotek bez indikátoru | návštěvník se ztratí | ověřit u F5, indikátor jde přidat |
| Málo fotek na šířku | monotónní grid | říct klientce při výběru fotek |
| Upgrade na Payload 4 | úpravy adminu se rozbijí | admin jen přes React komponenty, žádné CSS override |

---

## Deník

| Datum | Co se udělalo | Co dál |
|---|---|---|
| 23. 9. 2026 | Dokumentace pro stavbu: CLAUDE.md, SPEC, DESIGN, TECH, PHASES | F1 — kostra repa; klientce poslat seznam účtů k založení (F0) a otázky 1, 3, 4 |
| 23. 9. 2026 | **F1 hotová** — 12 commitů. pnpm workspace, TS strict + ESLint + Prettier + Vitest, Next 16.3.6 statický export + Tailwind 4, tokeny a breakpointy z DESIGN.md, Lora přes `next/font` (ověřeno: nula requestů na Google), zod schéma, algoritmus gridu s testem na UI 04, `photo-url.ts`, seed z Figmy (9 projektů, 36 WebP), přepínač `CONTENT_SOURCE`, `.env.example`, CI. 36 testů zelených. | F2 — grid, detail, Information, 404. Pozor: seed nemá portrét pro Information, bude potřeba z UI 07 (`161:2`). Klientce pořád chybí odpovědi na otázky 1, 3, 4 a účty pro F0. |
