# Specifikace — Sabrina Kulhankova portfolio

**Stav:** schváleno klientkou (design Finál v2), 23. 9. 2026
**Figma:** sekce „UI — Finál v2" (`154:2`) — mapa nodů v `DESIGN.md`

Značení: **[rozhodnuto]** = odsouhlaseno klientkou, neměnit bez ní. **[návrh]** = náš návrh, ve Figmě není, dá se doladit při kódování. **[otevřené]** = čeká na odpověď (viz `PHASES.md → Otevřené otázky`).

---

## 1. Cíl a rozsah

Portfolio, které ukáže práci a nechá fotky mluvit. Návštěvník projde grid, otevře projekt, prolistuje fotky, najde kontakt. Klientka sama přidává projekty a fotky, aniž by musela řešit velikost souborů.

**V rozsahu:** grid s filtrem, detail projektu (carousel), Information, 404, admin pro projekty / fotky / pořadí / nastavení, publikace jedním tlačítkem.

**Mimo rozsah (MVP):** vícejazyčnost, blog, kontaktní formulář, e-shop, komentáře, více uživatelů a role v adminu, plný náhled webu z adminu (jen náhled dlaždice), cookie lišta (nepotřebujeme).

---

## 2. Informační architektura

Jedna stránka, overlaye mají vlastní URL.

| URL | Co se zobrazí | Poznámka |
|---|---|---|
| `/` | grid, filtr All | |
| `/?filter=commercial`, `/?filter=art` | grid, filtrovaný | neplatná hodnota → All |
| `/work/[slug]/` | grid v pozadí + otevřený detail projektu | sdílitelný odkaz, indexuje se |
| `/information/` | grid v pozadí + otevřený Information | |
| cokoliv jiného | 404 | |

- Otevření overlaye **přidá** položku do historie → tlačítko Zpět overlay zavře.
- Filtr se mění **nahrazením** položky v historii (`replaceState`) — Zpět neprochází jednotlivá kliknutí na filtr. **[návrh]**
- Když je aktivní filtr a otevře se detail, filtr zůstane v URL (`/work/fog/?filter=art`) a grid v pozadí zůstává filtrovaný. **[návrh]**

---

## 3. Homepage — grid

Figma: UI 04 (desktop), UI 04B (filtr), UI 06 / 06B (mobil), UI 12 (tablet).

### 3.1 Mřížka

- **Desktop:** 3 sloupce se svislým posunem (offset) — **[rozhodnuto]** varianta 01C
- **Tablet a mobil:** vždy **2 sloupce** — **[rozhodnuto]**
- Přesná čísla (okraje, mezery, offsety) v `DESIGN.md → Grid`

### 3.2 Rozmístění dlaždic

Klientka určuje **pořadí**, ne pozici. Pozice se dopočítá:

1. Projekty v pořadí z adminu (globál Homepage).
2. Každý sloupec začíná svým offsetem.
3. Další projekt jde vždy do **nejkratšího sloupce** (při shodě ten víc vlevo).
4. Výška dlaždice = šířka sloupce ÷ poměr stran titulní fotky + výška popisky.

Algoritmus žije v `packages/shared/grid.ts` jako čistá funkce (vstup: poměry stran, počet sloupců, offsety; výstup: sloupec pro každý projekt) a má unit testy. Rozmístění se počítá **při renderu z dat**, ne měřením DOM.

> Ověřeno: UI 04 ve Figmě přesně odpovídá tomuto algoritmu. **UI 04B (filtr) je ve Figmě skládaný ručně a algoritmu neodpovídá** — kód se řídí algoritmem, rozdíl oproti 04B je přijatý.

### 3.3 Dlaždice

- Fotka (titulní fotka projektu) na celou šířku sloupce, poměr stran z dat, `object-fit: cover`
- Pod ní popiska: **kategorie** (malá, světlejší) a pod ní **název projektu**
- Celá dlaždice je jeden odkaz na `/work/[slug]/`
- **Hover:** název se podtrhne, kategorie ztmavne. **Fotka se nezvětšuje** (posunula by sousedy). **[návrh — převzato z ui-homepage]**
- Při načítání: plocha fotky má barvu `dominantColor` z dat, fotka se po načtení prolne (~200 ms). **[návrh]**

### 3.4 Filtr

- Tři položky **All · Commercial · Art**, All je výchozí — **[rozhodnuto]**
- Aktivní: plná barva + podtržení. Neaktivní: 40 % krytí — **[rozhodnuto, ale viz přístupnost 9.3]**
- Filtruje se **na klientovi** — všechny projekty jsou v HTML, filtr jen skryje nepatřičné a grid se přepočítá.
- Přeskládání je animované (layout animace, stejná mechanika jako přechod do detailu). Mizející dlaždice fade out, zbylé se přesunou. **[návrh]**
- Položky filtru jsou `<button aria-pressed>`, stav se propisuje do URL.

---

## 4. Detail projektu (overlay)

Figma: UI 05 (desktop, fotka na výšku), UI 05B (fotka na šířku), UI 09 (mobil), poznámka `156:2` (šipky).

### 4.1 Desktop a tablet (≥ 768 px)

- Homepage v pozadí **vybledlá**, přes ni **bílá plocha 800 px** vycentrovaná vodorovně
- Uvnitř sloupec **620 px**: nahoře **název projektu** vlevo a **✕** vpravo, pod tím **fotka**, pod ní **meta** ve dvou sloupcích:
  - `Client :` — název klienta, druhý řádek (např. „Marlow" / „Marlow Cosmetics")
  - `Credits :` — řádky `Role · Jméno`
- **Plocha pro fotku je 620 × 740** (při výšce okna 1024). Při nižším okně se plocha zmenšuje v poměru 620:740 tak, aby se název, fotka i meta vešly bez scrollu. **[návrh]**
- **Fotka na výšku** (poměr blízký 620:740, rozdíl do ~8 %): `cover` — mírný ořez je v designu schválený
- **Fotka na šířku / výrazně jiný poměr:** `contain`, vycentrovaná v ploše. Název, meta a šipky zůstávají na stejném místě (UI 05B)
- Tablet (810): stejné okno jako desktop. Bílá plocha má šířku `min(800px, 100vw − 48px)`, obsahový sloupec 620 px zůstává — na 810 px vyjde bílá plocha 762 px a kolem sloupce 71 px. Samostatný návrh není potřeba.

### 4.2 Carousel

- Vždy **jedna fotka**, přepíná se na místě — **[rozhodnuto]**
- **Bez číselného indikátoru pozice** — **[rozhodnuto]**. Vědomé riziko: do ~8 fotek v sérii OK, nad ~12 uživatel neví, kolik zbývá.
- **Neprotáčí se dokola.** Na první fotce není šipka zpět, na poslední není šipka vpřed. Bez počítadla je to jediný signál konce série. **[návrh]**
- Detail se otevře na **titulní fotce** (ta, ze které byl přechod z dlaždice). **[návrh]**
- Sousední fotka (±1) se přednačítá.
- Přechod mezi fotkami: krátký crossfade (~250 ms). **[návrh]**

### 4.3 Šipky — **[rozhodnuto]**

- Kulaté tlačítko **40 px**, `#9E9E9E` / 55 % krytí + jemný `backdrop-filter: blur`
- Bílý chevron **7 × 14 px**, tah 1,5 px, zakulacené konce
- Na fotce, **16 px** od levého / pravého okraje fotky, svisle uprostřed fotky
- Chevron opticky posunutý o **1,5 px** proti směru šipky
- **Skryté**, objeví se při hoveru nad fotkou (fade ~200 ms). Při fokusu z klávesnice viditelné vždy.
- Klávesy **← →** listují, **Esc** zavírá
- Na dotykových zařízeních (`(hover: none)`) se nezobrazují — ovládá se **swipe**
- `aria-label`: „Previous photo" / „Next photo"

### 4.4 Mobil (< 768 px) — UI 09

- Celoobrazovkový, **bez** vybledlé homepage v pozadí
- Horní lišta: název vlevo, ✕ vpravo
- Fotka **přes celou šířku**, swipe doleva/doprava, bez šipek
- Meta pod fotkou pod sebou (Client, pak Credits); stránka se svisle scrolluje

### 4.5 Otevření a zavření

- **Přechod z dlaždice [rozhodnuto — nápad klientky]:** fotka dlaždice plynule vyroste do pozice fotky v detailu, okolní dlaždice „uhnou" (odjedou od ní a zeslábnou do vybledlého stavu), pak se dokreslí bílá plocha a texty. Implementace: sdílený `layoutId` v `motion`. Přesnou choreografii doladit v kódu.
- **Přímý příchod na `/work/[slug]/`:** bez přechodu, detail je rovnou otevřený.
- **Zavření:** ✕, Esc, klik na vybledlé pozadí mimo bílou plochu, tlačítko Zpět v prohlížeči. Pokud je dlaždice projektu v aktuálním filtru, fotka se vrátí zpět do ní (obrácený přechod); jinak fade.
- `prefers-reduced-motion`: všechny přechody nahradit krátkým fade.
- Při otevřeném overlayi se stránka pod ním nescrolluje; po zavření zůstane grid na stejném místě.

---

## 5. Information (overlay)

Figma: UI 07 (desktop), UI 08 (mobil).

- **Desktop:** homepage v pozadí **v plné sytosti**, přes ni **bílý závoj 93 %** přes celé okno (skutečná vrstva, ne snížení průhlednosti gridu) — **[rozhodnuto]**
- Nahoře vlevo titulek **„Sabrina Kulhankova, photographer."**, vpravo ✕
- Tři sloupce: **portrét** · **bio** · **kontakt** (`Based in Prague.`, e-mail jako `mailto:`, Instagram jako odkaz ven)
- Kontakt je text, **ne formulář** — **[rozhodnuto]**
- Overlay se na desktopu **nemá scrollovat** — délku bia hlídá admin (počítadlo znaků, viz 8.4)
- **Mobil:** horní lišta s titulkem a ✕, pod ní portrét přes šířku, bio, kontakt, svislý scroll
- Zavření stejně jako detail (✕, Esc, Zpět)

---

## 6. 404

Figma: UI 10 (desktop), UI 11 (mobil). Header a patička jako na homepage, uprostřed: `404` · „This page doesn't exist." · krátká svislá linka · odkaz „Back to all work" na `/`. Statický `404.html`.

---

## 7. Header a patička

| | Desktop (UI 04) | Tablet (UI 12) | Mobil (UI 06) |
|---|---|---|---|
| Vlevo | jméno (odkaz na `/`) | jméno | jméno |
| Uprostřed | filtr | — | — |
| Vpravo | Information · e-mail · Instagram | Information · Instagram | Information |
| Filtr | v headeru uprostřed | pod jménem | pod jménem |
| Patička | © rok + Information · e-mail · Instagram | totéž | totéž |

- Klik na jméno: zavře overlay a resetuje filtr na All. **[návrh]**
- Header **není sticky**, odscrolluje se s obsahem. **[návrh — chování při scrollu ve Figmě není]**
- Rok v patičce se bere z data buildu.

---

## 8. Admin (CMS)

Figma: stránka UX, sloupec „CMS / ADMIN" (wireframy, nody v `DESIGN.md`). Admin je **česky**, jeden uživatel, žádné role. Navigace: **Projekty · Pořadí na homepage · Nastavení webu · Odhlásit**.

### 8.1 Projekty (dashboard) — `66:6`
- Seznam projektů: náhled, název, kategorie, počet fotek, stav (koncept / publikováno)
- **Koncept / publikováno je na úrovni projektu**, ne fotky
- Sloupec počtu fotek prozradí zapomenutou rozdělanou sérii

### 8.2 Nový projekt — flow `73:2`
1. Klik „Nový projekt" → dialog se ptá **jen na název**
2. Okamžitě vznikne **koncept**
3. Otevře se rovnou **záložka Fotky** (ne detail) — nahrávání trvá minuty, metadata sekundy
4. Metadata se vyplňují, zatímco fotky jedou nahoru
5. Výběr titulní fotky → Publikovat

Tlačítko v dialogu: **„Vytvořit a nahrát fotky"**.

### 8.3 Editor projektu — `67:2`, fotky `77:2`
- Formulář: Název · Slug · Kategorie · Rok · Klient + druhý řádek · Kredity (opakovatelné: role + jméno) · Titulní fotka
- **Slug se generuje z názvu a po první publikaci se zamkne** — napsané přímo pod polem
- **Kategorie:** výběr ze dvou hodnot (Commercial / Art)
- Pole **„Typ dlaždice" neexistuje** (zrušeno)
- Vpravo **náhled dlaždice** ve skutečné velikosti — stejná komponenta `Tile` z `packages/ui` jako na webu
- Záložka **Fotky**: drag & drop nahrávání, řazení tažením, smazání, alt text (volitelný)

### 8.4 Nahrávání fotek — **[rozhodnuto]**
1. Klientka přetáhne **JPEG nebo PNG** (TIFF, HEIC odmítnout s vysvětlením „Exportuj prosím jako JPEG")
2. **Prohlížeč** přečte rozměry, spočítá poměr stran a průměrnou barvu
3. **Prohlížeč** fotku zmenší a převede do **WebP** v šířkách **400 / 800 / 1200 / 1600 / 2400** (nikdy nezvětšovat nad originál). Při překreslení na canvas se převede do sRGB a zahodí EXIF včetně GPS.
4. Varianty i originál jdou **přímo do R2** přes podepsané URL
5. Server zapíše jen záznam fotky
6. Tabulka nahrávání: náhled · soubor · rozlišení · **velikost před → po** (např. „8,2 MB → 310 kB") · stav (`Převádím…` / `✓ Připraveno` / `⚠ …`)
7. **Jediné varování: nízké rozlišení**, kontextově:
   - šířka < 1240 px → „Málo pro detail — v gridu OK" **[návrh prahu: 620 px × 2 pro retinu]**
   - šířka < 800 px → „Málo i pro grid" **[návrh prahu: 401 px × 2]**
8. **Publikovat jde i s varováním.** Převod do sRGB a odstranění GPS se neoznamují.

### 8.5 Pořadí na homepage — `69:2`
- Vlastní obrazovka, ne pole v projektu
- Seznam publikovaných projektů, řazení tažením
- Nově publikovaný projekt se automaticky přidá **na konec**
- Náhled rozložení do 3 sloupců (stejný algoritmus jako web) **[návrh — ve wireframu je, v MVP stačí seznam]**

### 8.6 Nastavení webu — `70:5`
- Portrét (jedna fotka, stejná konverze)
- **Bio — prostý text**, odstavce oddělené prázdným řádkem, žádný rich text. Počítadlo znaků s doporučeným maximem, aby se Information na desktopu nescrolloval. **[návrh — limit určit podle Figmy UI 07]**
- Lokalita (`Based in Prague.`), e-mail, Instagram (handle + URL)
- SEO popis webu, OG obrázek
- **Žádné nastavení vzhledu**

### 8.7 Publikace
- Tlačítko **Publikovat web** → zavolá Cloudflare deploy hook → web se přegeneruje
- U tlačítka napsat: „Změny budou na webu za pár minut."
- Uložení projektu **nepublikuje** web automaticky. **[návrh — klientka má kontrolu, kdy se web mění; alternativa: auto-publish po uložení publikovaného projektu]**

### 8.8 Prázdné stavy a chyby — `71:2`
- Prázdný stav je návod („Zatím tu nic není. Začni prvním projektem.")
- Zašedlé tlačítko Publikovat říká, co chybí („Chybí titulní fotka")
- Chybová hláška má tři části: **co se stalo · co s tím · co se nestalo** („Nahrání selhalo. Zkus to znovu. Ostatní fotky jsou uložené.")

---

## 9. Kvalita

### 9.1 Výkon
- LCP < 2,0 s na mobilu (4G), CLS ≈ 0 (poměry stran z dat)
- Prvních ~4 dlaždic `loading="eager"` + `fetchpriority="high"` na první, zbytek `lazy`
- `srcset` z variant 400–2400, `sizes` podle breakpointu
- First-load JS: **podlaha Next 16 + React 19 je ~169 kB gzip** (změřeno 23. 9. 2026 na stránce 404, kde není žádný náš kód). Původní cíl 150 kB nešlo splnit ani s prázdnou stránkou. Co hlídáme, je **náš vlastní kód: ≤ 25 kB gzip**, tedy celkem **≤ 195 kB**. Aktuálně 2,6 kB našeho / 171,5 kB celkem. **[návrh]**
  - Měří se součet skriptů, které stránka skutečně spouští (`<script src>`), ne preloady.
  - Tenhle strop existuje kvůli nehodám typu „knihovna se omylem dostala do prohlížeče" — přesně tak uteklo 88 kB zodu přes barrel export. Framework neovlivníme, vlastní kód ano.
  - Přidání `motion` (~38 kB) by strop prorazilo a je to samostatné rozhodnutí, ne automatika.

### 9.2 SEO a sdílení
- Každý `/work/[slug]/` vlastní `<title>` („Fog — Sabrina Kulhankova"), description, OG obrázek = titulní fotka
- `sitemap.xml`, `robots.txt` generované při buildu
- JSON-LD `Person` na homepage
- Admin: `noindex`, `robots.txt` na `admin.` zakazuje vše
- Favicon a OG obrázek webu — **[otevřené, ve Figmě chybí]**

### 9.3 Přístupnost
- Overlay: `role="dialog"`, `aria-modal`, `aria-labelledby` na název, focus trap, po zavření vrátit fokus na dlaždici
- Viditelný `:focus-visible` na všech interaktivních prvcích **[ve Figmě chybí, navrhnout]**
- Alt text: vyplněný v adminu, jinak „{Název projektu} — photo {n}"
- ⚠️ **Kontrast** (spočítáno proti `#FAF9F6`):
  - neaktivní filtr při 40 % krytí → **2,6 : 1** (AA pro malý text vyžaduje 4,5 : 1)
  - barva Soft `#A19C91` → **2,6 : 1**, Muted `#78746B` → 4,4 : 1
  - Nejde o blokující chybu, ale je potřeba to klientce říct. Řešení: neaktivní filtr 60 % (4,8 : 1). **[otevřené]**

### 9.4 Prohlížeče
Poslední 2 verze Chrome, Safari (macOS + iOS), Firefox, Edge. Kritické: **iOS Safari** (swipe, `100dvh`, backdrop-filter).

---

## 10. Datový model

Kanonická definice v `packages/shared/schema.ts` (zod). Payload kolekce musí odpovídat.

### Project
| Pole | Typ | Poznámka |
|---|---|---|
| `title` | string, povinné | |
| `slug` | string, unikátní | z názvu; zamčené po první publikaci |
| `category` | `'commercial' \| 'art'` | povinné |
| `year` | number | |
| `client` | string | např. „Marlow" |
| `clientLine2` | string | např. „Marlow Cosmetics" |
| `credits` | `{ role, name }[]` | např. Photography · Sabrina Kulhankova |
| `photos` | `Photo[]` (seřazené) | |
| `cover` | `Photo` | musí být jedna z `photos` |
| `status` | `draft \| published` | Payload drafts |

### Photo
| Pole | Typ | Poznámka |
|---|---|---|
| `id` | string | zároveň prefix klíčů v R2 |
| `width`, `height` | number | originál |
| `aspectRatio` | number | `width / height`, **povinné** |
| `widths` | number[] | vygenerované varianty, např. `[400, 800, 1200]` |
| `dominantColor` | string (hex) | placeholder |
| `alt` | string? | |
| `originalFilename` | string | |
| `bytesOriginal`, `bytesWebp` | number | pro sloupec „před → po" |

### Homepage (globál)
| `projects` | `Project[]` seřazené | pořadí dlaždic |

### Settings (globál)
`portrait` (Photo) · `bio` (text) · `location` · `email` · `instagramHandle` · `instagramUrl` · `seoDescription` · `ogImage` (Photo)
