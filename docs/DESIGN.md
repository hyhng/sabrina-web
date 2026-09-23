# Design — tokeny, mřížka, Figma

**Figma soubor:** `llti0o1c802eZCRmdrw1hi` → stránka **UI** (`80:3`) → sekce **„UI — Finál v2 (01C + 02A, Lora, filtr)"** (`154:2`)

Čísla níže jsou vytažená z Figmy 23. 9. 2026. **Když se liší od Figmy, platí Figma** — pro přesné hodnoty (hlavně typografii) volej `get_design_context` na konkrétní node.

Všechno ostatní na stránce UI (01A–01C, 02A–02F, 03) je **explorace — neimplementovat**.

---

## Mapa artboardů

| Node | Artboard | Rozměr | Implementuje |
|---|---|---|---|
| `154:3` | UI 04 — Grid 3 sloupce · Desktop | 1440 × 2260 | grid, header, patička, filtr |
| `161:379` | UI 04B — Filtr Commercial · Desktop | 1440 × 1582 | stav filtru (rozmístění viz SPEC 3.2) |
| `154:71` | UI 05 — Detail · Desktop | 1440 × 1024 | detail, fotka na výšku |
| `161:180` | UI 05B — Detail · fotka na šířku | 1440 × 1024 | `contain` v ploše 620 × 740 |
| `156:2` | Poznámka — šipky | — | chování šipek |
| `154:319` | UI 06 — Grid 2 sloupce · Mobil | 390 × 1607 | mobilní grid |
| `161:515` | UI 06B — Filtr Commercial · Mobil | 390 × 1125 | |
| `161:583` | UI 12 — Grid · Tablet 810 | 810 × 2880 | tabletový grid |
| `161:2` | UI 07 — Information · Desktop | 1440 × 1024 | Information |
| `161:266` | UI 08 — Information · Mobil | 390 × 923 | |
| `161:278` | UI 09 — Detail · Mobil | 390 × 844 | swipe |
| `161:292` | UI 10 — 404 · Desktop | 1440 × 1024 | |
| `161:365` | UI 11 — 404 · Mobil | 390 × 844 | |

**Admin (wireframy, stránka UX `26:2`)** — low-fi, vizuál adminu dává Payload; z wireframů se bere struktura a texty:

| Node | Obrazovka |
|---|---|
| `66:6` | 01 Dashboard / Projekty |
| `67:2` | 02 Editor projektu |
| `77:2` | 02b Fotky / Upload |
| `69:2` | 03 Pořadí dlaždic |
| `70:5` | 04 Nastavení webu |
| `71:2` | 05 Prázdné stavy a chyby |
| `73:2` | 06 Flow — Nový projekt |

---

## Barvy

| Token | Hex | Použití |
|---|---|---|
| `paper` | `#FAF9F6` | pozadí webu |
| `ink` | `#14130F` | text |
| `muted` | `#78746B` | patička, hover kategorie |
| `soft` | `#A19C91` | kategorie v popisce |
| `line` | `#E2DFD7` | linky |
| `white` | `#FFFFFF` | bílá plocha detailu, závoj Information |
| `arrow` | `#9E9E9E` @ 55 % | pozadí šipek |

Neaktivní položka filtru: `ink` @ 40 % (⚠️ kontrast, viz SPEC 9.3). Tokeny drž na jednom místě (Tailwind theme / CSS proměnné), ať jde změna kontrastu udělat jedním řádkem.

Pozadí overlayů:
- **Detail:** homepage vybledlá (krytí ověř v `154:183`) + bílá plocha 800 px
- **Information:** homepage v plné sytosti + bílý závoj **93 %** přes celé okno

---

## Typografie

**Lora** (serif), řezy **Regular 400** a **Medium 500**, subsety `latin` + `latin-ext`. Načítání přes `next/font/google` (self-host při buildu), `display: 'swap'`.

Orientační velikosti (výšky řádků z Figmy; **přesné hodnoty vytáhni z Figmy** — font se měnil ze Schibsted Grotesk na Lora):

| Prvek | Desktop | Mobil | Řez |
|---|---|---|---|
| Jméno (wordmark) | výška řádku 27 | 20 | Medium |
| Navigace header | 21 | 17 | Regular |
| Filtr | 19 | 18 | Regular |
| Kategorie na dlaždici | 17 | 13 | Regular, `soft` |
| Název na dlaždici | 22 | 17 | Regular |
| Název v detailu | 27 | 19 | Regular |
| Meta v detailu | 19 | 16–17 | Regular |
| Patička | 17 | 15 | Regular, `muted` |

---

## Grid

### Desktop — UI 04 (1440)

| | Hodnota |
|---|---|
| Header | výška 80, jméno x = 34 |
| Okraj vlevo/vpravo | **34** |
| Sloupce | **3 × 401** |
| Mezera mezi sloupci | **84** |
| Offset sloupců (od prvního řádku) | **0 / 170 / 70** |
| První dlaždice | y = 104 (24 pod headerem) |
| Svislá mezera mezi dlaždicemi | **96** |
| Fotka → popiska | 12 |
| Popiska | kategorie (17) + 3 + název (22) = 42 |
| Patička | výška 106 |

Poměry fotek v designu: 401 × 535 (3:4), 401 × 501 (4:5), 401 × 267 (3:2). Ve skutečnosti se bere poměr z dat.

### Tablet — UI 12 (810)

| | Hodnota |
|---|---|
| Header | výška 63, okraj 24; filtr pod jménem (řádek 55) |
| Okraj | **24** |
| Sloupce | **2 × 371**, mezera **20** |
| Offset sloupců | **0 / 96** |
| Svislá mezera | **48** |
| Fotka → popiska | 10, popiska 36 |
| Patička | výška 80 |

### Mobil — UI 06 (390)

| | Hodnota |
|---|---|
| Header | výška 52, okraj 16; filtr pod jménem (řádek 46) |
| Okraj | **16** |
| Sloupce | **2 × 173**, mezera **12** |
| Offset sloupců | **0 / 56** |
| Svislá mezera | **28** |
| Fotka → popiska | 8, popiska 32 (13 + 2 + 17) |

⚠️ Na mobilu a tabletu jsou fotky ve Figmě typu *rounded rectangle* — ověř, že poloměr je 0. Fotky nemají zaoblení (CLAUDE.md, pravidlo 5).

### Mezi breakpointy **[návrh]**

| Šířka okna | Layout |
|---|---|
| < 600 | mobil (hodnoty z UI 06) |
| 600–1023 | tablet (hodnoty z UI 12) |
| ≥ 1024 | desktop (hodnoty z UI 04) |

Detail projektu má vlastní hranici: **≥ 768** okno s bílou plochou (UI 05), **< 768** celoobrazovkový mobilní detail (UI 09). Breakpointy tedy `600 / 768 / 1024`.

- Okraje a mezery drží pevné px z Figmy, **sloupce jsou pružné** (`1fr`)
- **Offsety se škálují se šířkou sloupce** (desktop: `offset = šířka sloupce × 170/401`), jinak by na užším okně byly vizuálně moc velké
- Nad 1680 px se obsah vycentruje s max. šířkou 1680 **[návrh]**

---

## Detail — UI 05 (1440 × 1024)

| | Hodnota |
|---|---|
| Bílá plocha | 800 × 979, x = 320, y = 35 |
| Obsahový sloupec | 620, x = 410 |
| Název | y = 83 |
| ✕ | vpravo, zarovnaný s pravou hranou sloupce, y = 83 |
| Plocha fotky | 620 × 740, y = 131 |
| Meta | y = 897, 2 sloupce × 310, řádky po 19 |
| Šipky | 40 × 40, 16 px od hrany fotky, svisle uprostřed fotky |

Mobil (UI 09): horní lišta 58, fotka 390 × 465 přes celou šířku, meta s okrajem 16.

## Information — UI 07 (1440 × 1024)

| | Hodnota |
|---|---|
| Titulek | x = 64, y = 70 |
| ✕ | x = 1362, y = 68 |
| Portrét | x = 64, y = 132, **343 × 444** |
| Bio | x = 477, šířka **471** |
| Kontakt | x = 1045, šířka 340 |

Mobil (UI 08): lišta 58, portrét 358 × 463 s okrajem 16, pod ním bio a kontakt.

## 404 — UI 10

Obsah vycentrovaný (blok 301 × 140): `404` → nadpis → linka 1 × 8 → odkaz „Back to all work".

---

## Komponenty (`packages/ui`)

| Komponenta | Kde | Poznámka |
|---|---|---|
| `Photo` | všude | `<img srcset>` z variant, `aspect-ratio` z dat, `dominantColor` jako pozadí |
| `Tile` | web grid, admin náhled | fotka + popiska; **stejná komponenta v adminu** |
| `OffsetGrid` | web | vstup: projekty + breakpoint config, rozmístění z `packages/shared/grid.ts` |
| `Filter` | web header | |
| `DetailOverlay`, `Carousel`, `ArrowButton` | web | |
| `InfoOverlay` | web | |
| `Header`, `Footer` | web | |
