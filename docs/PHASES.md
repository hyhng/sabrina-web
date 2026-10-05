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
- [x] Nahrávání fotek v prohlížeči: Worker, WebP + `@jsquash/webp` fallback, presign, přímý PUT do R2 (TECH 5) — **ověřeno 1. 10. na reálném bucketu** z reálného prohlížeče, bez podvržených služeb: 4 varianty + originál, správný content-type a `Cache-Control: public, max-age=31536000, immutable`, CORS projde, a mazání řádku fotky uklidilo i objekty v R2. Cestou zjištěno, že podpis kryje jen `host` — content-type ani cache-control se nepodepisují, takže je musí poslat prohlížeč sám (dřív se uložilo bez cache-control, i když to kód tvrdil opakěm)
- [x] Tabulka nahrávání: před → po, stavy, varování nízkého rozlišení — náhled · soubor · rozlišení · velikost · stav, tři soubory najednou, odmítnutý formát si nechá řádek s důvodem
- [x] Řazení fotek v projektu, výběr titulní fotky
- [~] Obrazovka Pořadí na homepage **s živým náhledem mřížky** — hotovo; automatické zařazení nového projektu čeká na otevřenou otázku 10
- [x] Nastavení webu (portrét, bio s počítadlem, kontakt, SEO) — počítadlo je vlastní komponenta (`afterInput`), protože Payload u textarey žádné nekreslí, jen odmítne uložení; ověřeno v prohlížeči ve všech třech stavech. Chybí **Vybraní klienti** a **Publikace** — čekají na otevřenou otázku 3
- [x] Náhled dlaždice v editoru (`Tile` z `packages/ui`)
- [x] Flow Nový projekt (dialog jen s názvem → Fotky) — tlačítko nad seznamem projektů, dialog s jedním polem, „Vytvořit a nahrát fotky“ → vznikne **koncept** (jen s konceptem jde uložit projekt bez kategorie) a otevře se rovnou záložka Fotky. Ověřeno v prohlížeči. **Nedělá zatím jedno:** automatické zařazení do pořadí na homepage — to je otevřená otázka 10
- [x] Prázdné stavy a chybové hlášky (SPEC 8.8) — hlášky u publikace, nahrávání a obou náhledů. Prázdné stavy seznamů řeší Payload sám a česky („Vytvořit nový Projekt"); vlastní komponenta by říkala totéž a šla proti pravidlu 9
- [x] Mazání fotky maže i R2 objekty — `afterDelete` na `Photos`, klíče ze stejné funkce, jakou podepisuje upload, takže se nemůžou rozejít. Bez klíčů v `.env` (nebo když R2 delete spadne) se řádek smaže a do logu jde varování se **výčtem klíčů** — hook běží až po smazání, takže odmítnout se nedá
- [~] Nasazení na server: arm64 image, Caddy, `admin.<doména>` — celý stack napsán a **vyzkoušen lokálně** (`infra/Dockerfile`, `docker-compose.prod.yml`, `Caddyfile`, `README.md` jako runbook). Image 105 MB, arm64, není root, bez secretů. Admin obsloužen přes Caddy po HTTPS/2. Cestou zjištěno, že **Payload v produkci schéma nevytvoří** — proto `apps/cms/migrations/` a `prodMigrations`, ověřeno proti prázdné databazi (19 tabulek, 106 ms) i na druhý start (nespustí se znovu). **Zbývá server** — `ufw`/SSH, reálný certifikát, DNS
- [~] Zálohy: denní `pg_dump` do R2, retence 30 dní — `infra/backup.sh`, otestován proti běžícímu stacku. Kontroluje, že dump jde rozgzipovat a není podezřele malý. Bez R2 zašálohuje lokálně a řekne to. **Upload do R2 potřebuje klíče**
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
- [~] **Test obnovení zálohy** (obnovit DB na čistý kontejner) — **nazkoušeno 1. 10.**: dump celé databaze obnoven do stacku, kde bylo jen zmigrované schéma, a obsah přečten zpátky přes Caddy. Devět projektů tam, devět zpátky, žádná chyba. **Zopakovat na reálném serveru** — to je jediný krok z runbooku, který notebook nezastoupí
- [ ] Kontrola: všechny účty na klientku, vývojář jen pozvaný
- [x] Krátký návod pro klientku česky (1 strana: přidat projekt, seřadit, publikovat, co dělat, když něco nejde) — napsáno jako dokument k poslání. Názvy tlačítek ověřeny proti českým překladům Payloadu, ne odhadnuty. Při změně adminu aktualizovat
- [ ] Předání přístupů, domluva údržby (aktualizace a kontrola záloh 2× ročně)

---

## Otevřené otázky

| # | Otázka | Kdo | Blokuje | Stav |
|---|---|---|---|---|
| 1 | ~~Jaká doména?~~ | Sabrina | | ✅ **`sabrinakulhankova.photography`** (1. 10.) — registrovaná přímo u Cloudflaru, platná do 10. 6. 2027, takže se nic nepřepisuje u registrátora |
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

## UX poznámky z prvního testu nahrávání (1. 10.) — **hotovo**

První skutečné nahrání: 8 fotek (6 na výšku, 2 na šířku, 1,4–3,4 MB), všechny v R2, koncept uložen se všemi
fotkami a titulní. Data byla v pořádku, potíž byla v rozhraní. Vyřešeno jednou **mřížkou náhledů** místo tabulky
nahrávání, seznamu „Bez názvu — ID" a rozbalovátka s názvy souborů:

- **Každá fotka je dlaždice od okamžiku, kdy ji pustíš**: vlastní náhled, stav přímo na ní (Ve frontě / Převádím… /
  Nahrávám…), varování nízkého rozlišení, číslo pořadí. Po nahrání je to tatáž dlaždice, nic neskáče.
- **Stav přežije přepnutí záložky.** Fronta už nežije v komponentě (Payload ji při přepnutí odmontuje), ale v
  `lib/upload-store.ts`. Fotka, která se dokončí, když mřížka není na obrazovce, čeká a připojí se, jakmile se
  vrátí. V postranním panelu je stálé „Nahrávám fotky… 3 z 8". Při zavírání okna během nahrávání se prohlížeč ptá.
- **Titulní fotka:** klik na fotku otevře detail a tam je „Nastavit jako titulní". Titulní má štítek a rámeček, a
  dokud žádná není, mřížka na to upozorní (bez ní by Publikovat stejně odmítl).
- **Detail fotky:** velký náhled ve správném poměru stran, soubor, rozlišení, velikost před → po, varování, popis
  (alt), „← Dřív / Později →", smazání se dvěma kroky.
- **Pořadí:** tažením dlaždic. Pole `photos` a `cover` jsou v adminu skrytá a řídí je mřížka; data zůstávají.
- **Lišta hromadných akcí v seznamu projektů** vypadá jako tlačítka (Odstranit červeně). Je to **jediná vědomá
  výjimka z pravidla 9**: `apps/cms/styles/payload-exceptions.css`, jen selektory pod `.list-selection`, test
  hlídá, že nic dalšího nepřibude. Po každém upgradu Payloadu ji zkontrolovat.

Ověřeno v prohlížeči proti skutečnému bucketu: 6 fotek najednou, přepnutí záložky uprostřed nahrávání, titulní,
přetažení, uložení, studený načet s miniaturami z `img.`, smazání (řádek, soubory v R2 i koncept projektu).
Cestou našel test dvě chyby: smazaná fotka se zobrazila jako „čekající" dlaždice (opraveno + test) a detail se
otevíral prázdný, dokud se nenačetl obrázek (rámeček s poměrem stran a barvou).

**Smazání fotky se děje hned, ne až při Uložit** (řádek je pryč natrvalo), proto se současně uloží i koncept
projektu. Jinak by neuložený projekt dál odkazoval na neexistující fotku a build by narazil na díru.

**Otevřené:**
- ~~Nahrané, ale neuložené fotky jsou osiřelé~~ — **rozhodnuto (4. 10.): automatické ukládání konceptu se
  nedělá.** Když odejde bez uložení, fotky se k projektu nepřipojí; přijde o ně, ale s upozorněním. Ověřeno v
  prohlížeči, že Payload upozorní oběma způsoby: při zavírání okna (beforeunload) i při odchodu přes menu
  („Odejít bez uložení — Vaše změny nebyly uloženy"). Kód se neměnil. **Důsledek:** soubory zůstanou v R2 a
  řádky v databázi; stojí to haléře, ale časem by stálo za to osiřelé fotky (nepatří žádnému projektu ani verzi)
  jednou za čas smazat.
- Dlaždice jsou čtverce s ořezem jen v náhledu (v detailu je fotka celá). Návrh, dá se změnit na skutečné poměry.

## Drobnosti k dořešení

- [ ] **Portrét v Nastavení nemá nahrávání.** Jde jen vybrat z už nahraných fotek; „+“ (ruční formulář s rozměry a bajty) je od 5. 10. schované. Potřebuje stejné nahrávání jako fotky v projektu (přetáhnout, náhled, převod v prohlížeči), jinak si ho Sabrina sama nenahraje.
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
| 1. 10. | Doména je **`sabrinakulhankova.photography`** na Cloudflaru, ne `sabrinakulhankovaphotography.com` u iFastNetu | ta druhá čístě žila v rozbitém portálu („Expired“ u domény zaplacené do 2027) a nameservery šly na Canvu. Nová sedí na Instagram `@sabrinakulhankova.photography` a nemá žádné přepisování. Stará + hosting za 29,99 $ ročně čeká na rozhodnutí Sabriny |
| 1. 10. | Cloudflare Pages: **root directory prázdný**, build `pnpm --filter web build`, výstup `apps/web/out` (TECH 7 říká root `apps/web`) | monorepo — pnpm potřebuje vidět celé repo kvůli sdíleným balíčkům. Ověřeno: build z čistého klonu prošel |
| 1. 10. | Produkční build **odmítne doběhnout bez `NEXT_PUBLIC_SITE_URL`** (větev `main` na Pages) | první živé nasazení mělo sitemap, robots.txt i JSON-LD na `example.com` a nic nevarovalo. Lokálně a na preview se dál jen varuje |
| 5. 10. | **Detail je pevná šablona jedné velikosti**: plocha jen pro fotky 4:5, výška `clamp(480, 100dvh − 316, 775)`, a **sloupec (nadpis, ✕, plocha, meta) je stejně široký, `min(620, výška × 0,8)`**; fotka se do plochy vejde celá a je vycentrovaná; scrolluje okno, ne panel, a jen když je dlouhé meta nebo nízké okno | vývojář, podle `lydiebonhomme.com` (Rosée Marron). Mění rozhodnutí z 23. a 24. 9.: okraje textu lícují se sloupcem a vejde se bez scrollu, cenou je užší sloupec na nižších oknech (467 px na 900 px) |
| 5. 10. | Šipky karuselu **16 px od okraje plochy fotek** (od 24. 9. byly na okraji fotky) | vývojář: u kraje vypadají jako součást rámu; u okraje plochy se nehýbou podle tvaru fotky |
| 5. 10. | Meta pod fotkou v detailu (Client, Credits) **14 px** na všech šířkách | vývojář: 12,5 px z Figmy bylo malé |
| 5. 10. | **Plocha fotek v detailu je 3:4**, nejvyšší formát, se kterým web počítá; užší fotka má automaticky volné místo po stranách, nic se neořezává | vývojář: fotka na výšku tak přesně lícuje s textem; klientka nemusí nic upravovat |
| 5. 10. | **Fotka přes celé okno** (SPEC 4.6): klik na fotku v detailu, Esc vrací do detailu | vývojář, podle lydiebonhomme.com; nová funkce mimo původní spec |
| 5. 10. | Overlaye (detail, Information, fotka přes celé okno) se při otevření kliknutím **objeví fade-in 250 ms**; při příchodu přímo na adresu bez animace | vývojář |
| 5. 10. | **Header je sticky a ustupuje** (dolů se zasune, nahoru se hned vrátí) | vývojář; dřív „není sticky“ jen jako návrh. Pravidla v `header-visibility.ts`, testovaná bez prohlížeče |
| 5. 10. | **Patička: © vlevo, „Created by KeySpace“ vpravo (odkaz na keyspace.cz, tučné jen KeySpace, Medium), bez navigace**; písmo 13 / 14 / 15 px místo 12 / 12,5; odstup nad ní 96 / 120 / 140 px | vývojář; ve Figmě je © vlevo a odkazy vpravo, patička přilepená k obsahu. Navigaci má header; na mobilu jsou e-mail a Instagram na stránce Information. „Tučně“ je Medium 500, protože další řez Lory se nenačítá |
| 1. 10. | Nastavení buildu veřejného webu je v **`apps/web/.env.production` v repu**, ne v proměnných Cloudflare Pages | „Variables and secrets“ v Pages se do buildu nedostaly — build vypísal všechny proměnné, které vidí, a ze čtyř nastavených nebyla žádná. Hodnoty nejsou tajné (adresa webu, cesta k fotkám), tak jdou do repa; test hlídá, že se tam nedostane nic jiného. Výjimka z pravidla 11 jen pro tenhle soubor. Ověřeno: čistý klon, žádné proměnné |
| 1. 10. | Fotky projektu jsou **mřížka náhledů** a fronta nahrávání je **mimo React** (`upload-store.ts`) | Payload odmontuje obsah neaktivní záložky a fronta v komponentě s ním zmizela, i když se nahrávalo dál. Store je jediný zdroj pravdy pro mřížku i postranní stav |
| 1. 10. | **Výjimka z pravidla 9** pro lištu hromadných akcí v seznamu (`styles/payload-exceptions.css`) | klientka: vypadala jako text, ne jako tlačítka. Úzce vymezeno: jen `.list-selection`, test hlídá rozsah, po upgradu Payloadu zkontrolovat |
| 1. 10. | `public/_headers`: `/_next/static/*` na `immutable`, rok | výchozí Pages je `max-age=0, must-revalidate` i pro soubory s hashem v názvu |
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
| 1. 10. 2026 | **Produkční stack hotový a nazkoušený lokálně** — arm64 image (105 MB, není root), Caddy + Postgres + cms, zálohovací skript, runbook, workflow na build image. Apple Silicon je stejná architektura jako CAX11, takže se to postavilo a rozjelo celé. Nejdůležitější nález: **Payload v produkci nevytvoří schéma** — čerstvý server by spadl na `relation "users" does not exist`. Vyřešeno migracemi přes `prodMigrations`. Nazkoušeno i **obnovení zálohy**. Opraven flaky e2e test — byl to skutečný závod s hydratací, změřeno. Klientce napsány **dva dokumenty**: co si má zařídit a jak přidat projekt. | **Bez účtů už nezbývá nic podstatného.** Čeká se na: Cloudflare (Pages + R2 + deploy hook), Hetzner, doménu, Resend — a na Sabrinin obsah pro F5. Vizuální kontrola UI proti Figmě odložena záměrně na reálné fotky. |
| 5. 10. 2026 | **Admin běží na serveru** — Hetzner CPX12 (CX23 byl vyprodaný, typ lze později snížit přes Rescale), Ubuntu 24.04, ufw 22/80/443, SSH jen klíčem, automatické bezpečnostní aktualizace, Docker, stack z `infra/`, certifikát od Let’s Encrypt, DNS `admin.sabrinakulhankova.photography`. Image z workflow „CMS image“ existuje pro amd64 i arm64 (ověřeno). První účet vytvořen, registrace je zavřená. Přesměrování `/` → `/admin`. Vývojář prošel preview webu a zadal úpravy: detail bez vnitřního scrollu, šipky 16 px od kraje, sticky header, patička (KeySpace, střed, větší písmo, odstup). **401 unit + 25 e2e testů**, ověřeno v prohlížeči na 1440, 810 a 390. | **Na serveru chybí:** klíče k R2 (bez nich nejdou nahrát fotky), `CF_DEPLOY_HOOK_URL`, plán záloh (`backup.sh`), `CONTENT_SOURCE=payload`. Pak otestovat Publikovat od začátku do konce. Rotovat R2 token (byl v chatu), `noindex` na `pages.dev`, smazat testovací projekt „asdf“. Otevřené otázky **3** a **10** na Sabrině. |
