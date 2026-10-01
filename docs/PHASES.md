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
| **F3** | CMS | F1, server z F0 | ⏳ běží |
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
- [x] ~~Přechod dlaždice → detail a zpět~~ — **zrušeno 24. 9.**, detail se otevírá bez animace
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

- [x] `apps/cms`: Payload 3 + Postgres, `docker compose` pro lokální DB
- [x] Čeština jako jazyk adminu
- [x] Kolekce `Users` (jeden uživatel), `Projects` (drafts), `Photos`
- [x] Globály `Homepage`, `Settings`
- [x] Access control: veřejně jen `published`
- [x] Slug — generování a zamčení po publikaci
- [~] Nahrávání fotek v prohlížeči: Worker, WebP + `@jsquash/webp` fallback, presign, přímý PUT do R2 (TECH 5) — celá cesta hotová a ověřená v prohlížeči (2000px JPEG → 4 varianty + originál, 368 kB → 169 kB, správné klíče a content-type). **Chybí jediné: reálný bucket.** Bez klíčů v `.env` vrací presign 503 a řekne, které chybí. Podpis se dělá lokálně, takže je otestovaný i bez R2; co ověřit s klíči: že R2 URL přijme (CORS na `PUT` z `admin.<doména>`)
- [x] Tabulka nahrávání: před → po, stavy, varování nízkého rozlišení — náhled · soubor · rozlišení · velikost · stav, tři soubory najednou, odmítnutý formát si nechá řádek s důvodem
- [x] Řazení fotek v projektu, výběr titulní fotky
- [~] Obrazovka Pořadí na homepage **s živým náhledem mřížky** — hotovo; automatické zařazení nového projektu čeká na otevřenou otázku 10
- [x] Nastavení webu (portrét, bio s počítadlem, kontakt, SEO) — počítadlo je vlastní komponenta (`afterInput`), protože Payload u textarey žádné nekreslí, jen odmítne uložení; ověřeno v prohlížeči ve všech třech stavech. Chybí **Vybraní klienti** a **Publikace** — čekají na otevřenou otázku 3
- [x] Náhled dlaždice v editoru (`Tile` z `packages/ui`)
- [x] Flow Nový projekt (dialog jen s názvem → Fotky) — tlačítko nad seznamem projektů, dialog s jedním polem, „Vytvořit a nahrát fotky“ → vznikne **koncept** (jen s konceptem jde uložit projekt bez kategorie) a otevře se rovnou záložka Fotky. Ověřeno v prohlížeči. **Nedělá zatím jedno:** automatické zařazení do pořadí na homepage — to je otevřená otázka 10
- [x] Prázdné stavy a chybové hlášky (SPEC 8.8) — hlášky u publikace, nahrávání a obou náhledů. Prázdné stavy seznamů řeší Payload sám a česky („Vytvořit nový Projekt"); vlastní komponenta by říkala totéž a šla proti pravidlu 9
- [x] Mazání fotky maže i R2 objekty — `afterDelete` na `Photos`, klíče ze stejné funkce, jakou podepisuje upload, takže se nemůžou rozejít. Bez klíčů v `.env` (nebo když R2 delete spadne) se řádek smaže a do logu jde varování se **výčtem klíčů** — hook běží až po smazání, takže odmítnout se nedá
- [ ] Nasazení na server: arm64 image, Caddy, `admin.<doména>`
- [ ] Zálohy: denní `pg_dump` do R2, retence 30 dní
- [x] Test uploadu v **Safari** (WebP fallback) a Chrome — ověřeno v WebKitu (Playwright, WebKit 26.6) i v Chromiu na stejné fotce 2000 × 2669:
  - WebKit: `convertToBlob({ type: 'image/webp' })` vrací **`image/png`** — tiše, bez chyby. Kontrola v `browser-image.ts` to zachytí a přepne na `@jsquash/webp`
  - výsledek je skutečný WebP a stejně velký: **167 kB (WebKit) vs 169 kB (Chromium)** ve čtyřech variantách. Kdyby to propadlo na PNG, byly by to megabajty
  - stejné `widths`, stejný poměr stran, průměrná barva se liší o jedničku na kanál (jiné dovzorkování canvasu)
  - WASM cesta je ~3× pomalejší (1,6 s vs 0,5 s), pro jednu fotku bez významu
  - **Zbývá na reálném Safari** (ne WebKitu z Playwrightu) a na iOS, kde je limit velikosti canvasu — to je v F5 spolu s reálnými fotkami

**Hotovo když:** na `admin.<doména>` jde projít celý flow Nový projekt → fotky → publikovat v Chrome i Safari a v R2 leží WebP varianty.

---

## F4 — Napojení a publikace

- [~] `CONTENT_SOURCE=payload` v buildu — web se umí postavit z CMS: `scripts/fetch-content.mts` načte oba globály, namapuje je na kanonické schéma a zvaliduje, pak teprve běží `next build`. Ověřeno lokálně: 9 projektů, 36 variant fotek, všechny odkazované soubory existují. **Zbývá pustit to na Cloudflare** — potřebuje účet
- [x] Endpoint `/api/publish` → deploy hook, tlačítko „Publikovat web“ s časem posledního publikování — tlačítko je v navigaci (je to poslední krok každé práce, ať skončí kdekoli), čas drží skrytý globál `publish`. Ověřeno v prohlížeči proti podvrženému hooku: jedno POST, česká hláška, řádek pod tlačítkem se přepne na „Publikováno právě teď.“ Bez `CF_DEPLOY_HOOK_URL` vrátí 503 a řekne, co chybí. **Zbývá skutečný hook z Cloudflare**
- [x] Zod validace při buildu — rozbitá data shodí build, stará verze zůstane — validuje se dvakrát: v `fetch-content.mts` (kvůli čitelné chybě) a pak v `getContent()` pro oba zdroje
- [x] Přenést seed obsah do CMS (ať web nezůstane prázdný) — `apps/cms/scripts/import-seed.ts`, 9 projektů a 15 fotek. Odmítne běžet nad databazí, kde už projekty jsou. Zkopíruje i varianty fotek do `apps/web/public/cms` ve stejném rozložení, jaké bude mít R2 — takže celá cesta jde projet včetně fotek ještě před tím, než bucket existuje
- [ ] e2e: změna v adminu → Publikovat → změna na webu — **jediná věc z F4, která nejde bez hostingu.** Prostřední část je ale už ověřená ručně: přejmenování projektu v CMS se po rebuildu objeví v HTML a po přejmenování zpátky zmizí

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

## Drobnosti k dořešení

- ~~E2E test `detail › closes with Escape` jednou spadl~~ — **vyřešeno.** Byl to závod testu s hydratací: detail je předgenerovaný, takže dialog je na obrazovce dřív, než se připojí obsluha kláves. Změřeno zablokováním klientských chunků: dialog vidět, Esc nic nedělá. Oba testy, které mačkají klávesu hned po `goto`, teď čekají na zámek scrollování — ten nastavuje stejná komponenta. 90 opakování na 8 workerech zelených.

- Po nahrání se fotka v seznamu pod tabulkou ukáže jako „Bez názvu — ID: 5", správný název se objeví
  až po uložení a otevření projektu. Payload si u relace nedotáhne dokument, který sám nenačetl, a
  zvenčí se jeho cache popisků naplnit nedá. Není to blokující — názvy i náhledy jsou vidět v tabulce
  nahrávání nad tím, a řadí se stejně jednou uložené. Kdyby to vadilo, jde to obejít jen přenačtením
  formuláře, což by zahodilo rozepsaná metadata.

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
| 24. 9. | **Přechod dlaždice → detail zrušen**, detail se otevírá bez animace (SPEC 4.5) | klient: působilo sekaně. Pozor — byl to původně nápad klientky, potvrdit s ní |
| 30. 9. | Lokálně **Colima** místo Docker Desktopu | Docker Desktop vyžaduje heslo správce na symlink do `/usr/local/bin`; Colima dá stejný `docker` i `docker compose` bez něj. Server v F3 zůstává na Dockeru podle TECH 7 |
| 30. 9. | Záznam fotky vzniká **před** nahráním bajtů, obráceně než v původním TECH 5 | klíč v R2 obsahuje id fotky, a to dává databáze. Zároveň tím endpoint nebere z requestu žádnou cestu — podepsat lze jen to, co už je v záznamu |
| 30. 9. | Fotka užší než 400 px dostane **jednu variantu ve své šířce** | SPEC 8.4 pod 400 px mlčí; prázdný seznam variant by nechal web bez souboru, na který ukázat, a publikovat se s varováním o rozlišení má dát. **[návrh]** |
| 30. 9. | Nový projekt se otevře na záložce Fotky zápisem do **Payloadových preferencí** | SPEC 8.2 to chce, a Payload si aktivní záložku drží jen v preferencích, ne v URL. Sází to na interní klíče (`_index-0`, `tabs-0`) a na to, že jsou taby první pole kolekce — když se to změní, klientka přistane na Podrobnostech a klikne. Ztratitelná sázka |
| 30. 9. | Obsah z CMS se načte **skriptem před buildem** do `content/payload.json`, ne fetchem v buildu | statický export prerenderuje jen route s cacheovatelnými daty, a Nextův fetch cache přežije build — změřeno: přejmenovaný projekt se v dalším buildu neobjevil. Tlačítko Publikovat existuje právě proto, aby se změna objevila, takže na cache se spoléhat nesmí |
| 30. 9. | Safari fallback ověřen v **WebKitu z Playwrightu**, ne na reálném Safari | WebKit tiše vrací `image/png` — přesně jak TECH 5 předpokládá — a `@jsquash/webp` vyrobí WebP o stejné velikosti (167 vs 169 kB). Reálné Safari a iOS (limit canvasu) zůstává na F5 |
| 30. 9. | Počítadlo znaků u bia je **vlastní komponenta** (`afterInput`) | Payload u textarey žádné nekreslí, `maxLength` jen odmítne uložení — a to je pozdě, SPEC 8.4 chce vidět délku při psaní |
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
| 24.–30. 9. 2026 | **F2 z velké části hotová** — 17 z 19 úkolů, ~25 commitů. Grid s offsetovými sloupci, hlavička a patička ve třech breakpointech, filtr se stavem v URL a CSS přeskládáním, routing overlayů přes `pushState` s předgenerovanou stránkou pro každý projekt, detail s carouselem a swipem, Information, 404, meta tagy, sitemapa, robots, JSON-LD. Focus trap, zámek scrollování, návrat fokusu. **149 unit + 25 e2e testů**, CI zelené. Vlastní JS 6,2 kB z 25. Cestou opraveno: zod unikal do prohlížeče (−88 kB), `useSearchParams` vyhazoval mřížku ze statického HTML, čtení `ref` během renderu, focus ring na ✕. Přechod dlaždice → detail postaven a na přání klienta zase zrušen. | **Zbývá ve F2:** Cloudflare preview (blokuje F0) a vizuální kontrola. **Kritická cesta vede přes Sabrinu** — účty pro F0 a otázka 3 pro schéma F3. |
| 30. 9. 2026 | **F3 hotová až na to, co chce účty** — dnes: počítadlo znaků u bia (Payload u textarey žádné nekreslí, jen odmítne uložení), tabulka nahrávání jako stavový stroj, převod fotek v prohlížeci ve workeru, podepisování PUT URL pro R2, drag & drop do projektu, mazání objektů s řádkem, dialog Nový projekt. **301 unit + 25 e2e testů**, build i CI zelené. Ověřeno v prohlížeci, ne jen v testech: celá cesta fotky (2000 px JPEG → 4 varianty + originál, 368 → 169 kB, správné klíče a content-type), úkliď po selhání (žádný osiřelý řádek), a Safari: WebKit vrací `image/png` a `@jsquash/webp` z toho udělá WebP stejné velikosti (167 vs 169 kB). | **Zbývá ve F3 už jen to, co nejde bez účtů:** reálný R2 bucket (+ CORS na PUT), nasazení na Hetzner, zálohy. Plus otevřené otázky **3** (Vybraní klienti / Publikace) a **10** (kam se nový projekt zařadí) — obojí na Sabrině. |
| 30. 9. 2026 | **F4 hotová až na hosting** — web se umí postavit z CMS: mapování Payloadu na kanonické schéma (celý, integer id → string, `null` → chybí, `_status` → `status`, koncept přijde jako číslo a tím se sám vyřadí), přenos seed obsahu do databáze, tlačítko Publikovat web. **317 unit + 25 e2e testů.** Ověřeno lokálně: build z CMS dá 9 projektů, 36 variant fotek a všechny odkazované soubory existují. Cestou zjištěno, že Nextův fetch cache přežije build — přejmenovaný projekt se v dalším buildu neobjevil — takže se obsah načítá skriptem ještě před buildem. | **Zbývá už jen to, co nejde bez účtů:** Cloudflare (build + deploy hook + R2), Hetzner, doména. Klientce je připravený návod, co si má zařídit. Otevřené otázky **3** a **10** pořád čekají na ni. |
