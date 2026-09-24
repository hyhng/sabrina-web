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
- [~] `Photo` (srcset, aspect-ratio, dominantColor) — **fade-in vynechán**: přes JS by při selhání hydratace zůstaly fotky neviditelné; zatím jen podkladová barva, vrátit se k tomu bezpečně
- [x] `Tile` (fotka + popiska, hover)
- [x] `OffsetGrid` — 3 / 2 / 2 sloupce podle breakpointu, bez posunu po načtení
- [x] Header a patička — desktop / tablet / mobil (UI 04, 12, 06)
- [x] Filtr — stav v URL, animované přeskládání

**Detail**
- [x] Routing overlayů: `/work/[slug]/`, `pushState`, zavření, Zpět (TECH 4.1)
- [x] `DetailOverlay` desktop — bílá plocha, vybledlé pozadí, meta (UI 05)
- [x] Fotka na šířku — vejde se celá, **bez ořezu** (UI 05B, viz Rozhodnutí 23. 9.)
- [x] Škálování plochy fotky podle výšky okna
- [x] `Carousel` + `ArrowButton` — hover, klávesy, bez protáčení, přednačítání
- [x] Mobilní detail — swipe (UI 09)
- [~] Přechod dlaždice → detail a zpět — fotka morfuje přes View Transitions; **odjetí sousedních dlaždic zatím není**
- [x] Focus trap, scroll lock, návrat fokusu, `prefers-reduced-motion`

**Ostatní**
- [x] Information desktop + mobil (UI 07, 08)
- [x] 404 (UI 10, 11)
- [x] Meta tagy, OG, sitemap, robots, JSON-LD
- [ ] Cloudflare Pages napojené na repo → preview URL
- [ ] Vizuální kontrola všech artboardů Finál v2 proti Figmě
- [x] Playwright: otevřít detail z gridu, listovat, zavřít Zpět; přímý příchod na `/work/…`; filtr

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
| 1 | Jaká doména? | Sabrina | F0, F6 | doménu má; konkrétní název potřebný až pro F0/F6 |
| 2 | Kategorie Commercial / Art — sedí? Změna je levná. | Sabrina | F5 | 🔒 |
| 3 | Chce v Information „Vybraní klienti" a „Publikace"? Jde o seznamy jmen, ne o projekty — mění `Settings`. | Sabrina | **F3** (schéma) | 🔒 poslední otevřená blokující F3 |
| 4 | ~~Vícejazyčnost~~ | — | — | ✅ **ne, web je jen anglicky** (23. 9.) |
| 5 | Kolik fotek má typická série? Nad ~12 zvážit vrátit indikátor. | Sabrina | F5 | 🔒 |
| 6 | Kontrast: neaktivní filtr 40 % → 60 %, kategorie `soft` → tmavší? (SPEC 9.3) | my + Sabrina | F2 | |
| 7 | Popis série („O sérii") — byl ve wireframu CMS, v UI 02A se nezobrazuje. Vynechat? | my | F3 | návrh: vynechat |
| 8 | Publikovat ručně tlačítkem, nebo automaticky po uložení? | my | F3 | návrh: ručně |
| 9 | Favicon a OG obrázek webu | my | F5 | |
| 10 | **Kam se zařadí nově publikovaný projekt?** Zadání říká na konec (SPEC 8.5, TECH 6), ale očekávání je „nejnovější nahoru". Na konec = stabilní rozvržení, ale klientka musí každý nový projekt ručně protáhnout nahoru. Na začátek = sedí samo, ale algoritmus přerovná celou mřížku (ověřeno: 9 z 9 projektů změní pozici). Návrh: **na začátek**. | Sabrina | **F3** (hook po publikaci) | |
| 11 | **Má jít připíchnout projekt do konkrétního sloupce?** Klientka dnes určuje pořadí, ne pozici (SPEC 3.2), a přes pořadí má nepřímou kontrolu. Připíchnutí by šlo jen na desktopu (třetí sloupec jinde neexistuje) a rozbilo by se při výměně fotky za jiný poměr stran. Návrh: **odložit, rozhodnout až na reálném obsahu** — přidat pole do prázdné DB je nic, do plné je migrace. | my + Sabrina | F5, dopad na **F3** (schéma) | návrh: odložit |

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
| 23. 9. | Web je **jednojazyčný anglicky**, vícejazyčnost se nedělá | klientka |
| 23. 9. | Portrét do Information je v F2 placeholder, reálný přijde v F5 | klientka ho zatím nemá |
| 23. 9. | Tablet a mobil se řídí **algoritmem**, ne artboardy UI 06 / UI 12 | oba jsou skládané ručně a algoritmu neodpovídají (Portraits a Fog prohozené, Marlow před Silence). Stejný případ jako už přijaté UI 04B. S reálným obsahem se ruční rozvržení neudrží — jiné poměry stran, jiný počet projektů |
| 23. 9. | Ve F3 postavit **živý náhled mřížky** na obrazovce Pořadí (SPEC 8.5 jako `[návrh]`) | dělá z přeskládávání skutečný nástroj na layout — klientka vidí dopad hned a nepotřebuje ruční pozicování |
| 23. 9. | Strop first-load JS přepsán ze 150 kB na **≤ 25 kB vlastního kódu / ≤ 195 kB celkem** | podlaha Next 16 + React 19 je 168,9 kB, původní cíl nešel splnit ani s prázdnou stránkou; hlídat má smysl to, co ovlivníme |
| 23. 9. | Přeskládání mřížky animováno **CSS přechody, ne `motion`** | dlaždice jsou pozicované přes `calc()` nad CSS proměnnými, takže je to animovatelné zadarmo — 0,2 kB místo ~38 kB. `motion` se rozhodne až u přechodu dlaždice → detail |
| 23. 9. | **Fotka v detailu se nikdy neořezává**, ruší `cover` u poměrů blízkých 620:740 (SPEC 4.1) | klient; přizpůsobovat fotku ploše je nežádoucí. Znát to bude až na reálných fotkách v F5 — portrét 2:3 se dřív ořízl o ~8 %, teď se ukáže celý |
| 24. 9. | **Fotka v detailu vyplní šířku sloupce**, ruší pevnou plochu 620 × 740 (SPEC 4.1) | klient; pevná plocha dělala z fotky na výšku užší blok než okolní text a bylo to vidět. Cena: vysoká fotka může na nižším okně scrollovat |
| 24. 9. | **Šipky zarovnané s okrajem fotky, chevron ve středu kruhu** (SPEC 4.3) | klient; původních 16 px odsazení a 1,5px optický posun narušovaly zarovnání |
| 24. 9. | **Plocha detailu má velikost podle okna, ne podle fotky** (SPEC 4.1) | klient s referencí `lydiebonhomme.com`; když výšku určovala fotka, plocha při listování série poskakovala. Takhle jde mít zarovnanou fotku na celou šířku *i* stabilní plochu |
| 24. 9. | **Plocha fotky je vysoká jako nejvyšší fotka série**; přechod je **slide**, ne crossfade (SPEC 4.2) | klient; šipka centrovaná na fotku skákala, když série střídala výšku a šířku |
| 24. 9. | Přechod dlaždice → detail přes **nativní View Transitions**, ne `motion` (SPEC 4.5, TECH 2) | stejný efekt za 0 kB místo ~38 kB; `motion` tím v projektu zatím není potřeba vůbec |
| 24. 9. | Přidán `eslint-plugin-react-hooks` | odhalil čtení a zápis `ref` během renderu v `OffsetGrid` — s concurrent renderingem tiše nespolehlivé a nic jiného by si toho nevšimlo |

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
