# Technika — stack, architektura, infrastruktura

**Ověřeno k 23. 9. 2026:** Next.js 16.3, Payload 3.90 (Payload 4 zatím není stabilní), Payload 3.89+ jede na Next 16.3.

---

## 1. Architektura

```
Návštěvník ──► Cloudflare ──► statický web (apps/web/out)    ◄── Cloudflare Pages
                   │
                   └──► img.<doména> ──► R2 bucket (WebP varianty + originály)

Klientka ──► admin.<doména> ──► Hetzner CAX11: Caddy ─► Payload (apps/cms) ─► Postgres
                                        │
                                        └── „Publikovat web" ─► Cloudflare deploy hook
                                                                  └─► build apps/web (čte Payload API)
```

**Veřejný web je statický a na serveru nezávisí.** Server obsluhuje jen admin a běží při buildu. Když spadne, web jede dál; jen nejde editovat.

---

## 2. Stack

| Vrstva | Volba | Proč |
|---|---|---|
| Monorepo | **pnpm workspaces** | sdílené komponenty a schéma; bez Turborepa (není potřeba) |
| Web | **Next.js 16, App Router, `output: 'export'`** | statické HTML na CDN, nulové náklady, rychlost |
| CMS | **Payload 3.x** + `@payloadcms/db-postgres` | MIT, self-host, admin v Reactu, česká lokalizace |
| DB | **Postgres 16** (Docker na serveru) | volitelně později Neon free tier |
| Fotky | **Cloudflare R2** | S3 API, žádné poplatky za přenos |
| Hosting webu | **Cloudflare Pages** | statika zdarma, deploy hook; kdyby Cloudflare Pages omezil, výstup `out/` jde beze změny na Workers Static Assets |
| Styl | **Tailwind CSS** | tokeny v theme |
| Animace | **`motion`** | `layoutId` pro přechod dlaždice → detail a přeskládání gridu |
| Validace | **zod** | jedno schéma pro web, CMS i seed |
| WebP v prohlížeči | canvas + **`@jsquash/webp`** fallback | viz 5 |
| E-mail adminu | Resend (`@payloadcms/email-resend`) | reset hesla |
| Analytika | Cloudflare Web Analytics | bez cookies |
| Testy | Vitest (unit), Playwright (e2e, pár klíčových toků) | |

**Verze:** `apps/cms` drží přesně verzi Next, kterou chce Payload v `peerDependencies`. `apps/web` na stejné verzi, ať `packages/ui` nemá dvě Reacty.

---

## 3. Repo

```
/
├── CLAUDE.md
├── docs/                    SPEC, DESIGN, TECH, PHASES
├── apps/
│   ├── web/                 Next.js statický export
│   │   ├── app/
│   │   │   ├── page.tsx                 → <Site overlay={null}>
│   │   │   ├── work/[slug]/page.tsx     → <Site overlay={project}>, generateStaticParams
│   │   │   ├── information/page.tsx     → <Site overlay={info}>
│   │   │   ├── not-found.tsx
│   │   │   ├── sitemap.ts, robots.ts
│   │   ├── lib/content.ts   getContent(): seed | payload
│   │   └── content/seed.json
│   └── cms/                 Next.js + Payload
│       ├── collections/     Projects, Photos, Users
│       ├── globals/         Homepage, Settings
│       ├── components/      vlastní admin komponenty (upload, náhled dlaždice, publikovat)
│       └── endpoints/       presign, publish
├── packages/
│   ├── shared/              schema.ts (zod), grid.ts, photo-url.ts, categories.ts
│   └── ui/                  Photo, Tile, OffsetGrid…
├── infra/
│   ├── docker-compose.yml   caddy, postgres, cms
│   ├── Caddyfile
│   └── backup.sh
└── .env.example
```

---

## 4. Klíčová rozhodnutí

### 4.1 Overlaye a URL (statický export nepodporuje intercepting routes)

Next.js při `output: 'export'` **nepodporuje Intercepting Routes** (ani Server Actions, middleware, cookies, ISR, výchozí loader `next/image`). Proto:

1. **Každá URL má vlastní statické HTML** se stejnou stránkou a jiným počátečním stavem:
   - `/` → grid
   - `/work/[slug]/` → grid + otevřený detail (`generateStaticParams`, `dynamicParams = false`)
   - `/information/` → grid + otevřený Information
2. **Uvnitř aplikace se nenaviguje, jen mění URL:** klik na dlaždici zavolá `window.history.pushState(null, '', '/work/fog/')`. Next.js App Router nativní `pushState` / `replaceState` synchronizuje s `usePathname()` a `useSearchParams()`, takže stav overlaye se **odvozuje z URL** a nic se nenačítá ze serveru.
3. **Zavření:** pokud byl overlay otevřen uvnitř aplikace → `history.back()`; pokud se na URL přišlo zvenku → `pushState` na `/`.
4. **Filtr:** `replaceState` s `?filter=`.
5. `useSearchParams` ve statickém exportu vyžaduje obalení do `<Suspense>`.
6. `trailingSlash: true` → `work/fog/index.html`, Cloudflare Pages to servíruje bez rewrite pravidel.

Data všech projektů (včetně metadat fotek) jsou součástí stránky — pro desítky projektů jde o jednotky kB a detail se otevře okamžitě bez fetch.

### 4.2 Obrázky

- **Klíče v R2:** `photos/{photoId}/{width}.webp`, originál `originals/{photoId}.{ext}`
- **URL:** `https://img.<doména>/photos/{photoId}/{width}.webp`, helper `photoSrcSet(photo)` v `packages/shared/photo-url.ts`
- **Komponenta `Photo`** = obyčejný `<img>` se `srcset` z `photo.widths`, `sizes` podle breakpointu, `width`/`height` + `aspect-ratio` z dat. **Ne `next/image`** — varianty jsou předgenerované, optimalizaci nepotřebujeme.
- Cache: soubory jsou neměnné (nová fotka = nové `photoId`) → `Cache-Control: public, max-age=31536000, immutable` přes Cloudflare Cache Rule na `img.`

### 4.3 Font

`next/font/google` s `Lora`, `weight: ['400','500']`, `subsets: ['latin','latin-ext']`, `display: 'swap'`. Next font stáhne při buildu a servíruje z naší domény → **žádný request na Google za běhu** (GDPR). Funguje i se statickým exportem.

### 4.4 Obsah při buildu

`apps/web/lib/content.ts`:

- `CONTENT_SOURCE=seed` → čte `content/seed.json` (fáze 2, bez CMS)
- `CONTENT_SOURCE=payload` → REST API Payloadu:
  - `GET /api/globals/homepage?depth=2` — pořadí + projekty + fotky
  - `GET /api/globals/settings?depth=1`
- Výstup vždy prochází **zod validací** → rozbitá data shodí build, místo aby se nasadil rozbitý web. Předchozí nasazená verze zůstane online.
- Veřejné čtení: Payload access control vrací nepřihlášeným jen `published`. Žádný API klíč v buildu.
- Web navíc sám odfiltruje projekty bez titulní fotky nebo bez fotek (a vypíše varování do logu buildu) — Homepage globál může odkazovat i na koncept.

### 4.5 Algoritmus gridu

Čistá funkce v `packages/shared/grid.ts`:

```ts
layoutColumns(items: { aspectRatio: number }[], cfg: {
  columns: number; columnWidth: number; offsets: number[];
  gapY: number; captionHeight: number;
}): number[] // index sloupce pro každou položku
```

Další položka jde do sloupce, jehož spodní hrana (včetně offsetu) je nejvýš; při shodě levější. Unit test: UI 04 (desktop, 9 projektů) musí vyjít přesně jako ve Figmě — pořadí **Wool, Summer in the Mountains, Soda, Portraits, Fog, Hotel, Silence, Mirrors, Marlow** → sloupce **1, 3, 2, 2, 1, 3, 3, 2, 1** a y-pozice 104, 174, 274, 691, 789, 859, 1276, 1342, 1474 (výšky dlaždic 589 / 321 / 555, mezera 96). Tohle pořadí použij i v seed datech.

Rozmístění se počítá pro každý breakpoint zvlášť a vyrenderuje se do HTML (tři varianty přepínané CSS media queries, nebo CSS proměnné). **Žádné měření DOM**, žádný posun po hydrataci.

---

## 5. Nahrávání fotek (admin)

Vlastní klientská komponenta v Payload adminu (záložka Fotky projektu).

```
soubor ─► validace typu (JPEG/PNG) ─► createImageBitmap (EXIF orientace se aplikuje)
      ─► šířka/výška/poměr, průměrná barva
      ─► pro každou šířku ≤ originál: canvas → WebP (quality ~0.82)
      ─► POST /api/photos/presign  ─► podepsané PUT URL (R2, platnost 10 min)
      ─► PUT varianty + originál přímo do R2
      ─► POST /api/photos  (záznam: rozměry, widths, dominantColor, velikosti)
```

⚠️ **Safari neumí z canvasu kódovat WebP** — `toBlob('image/webp')` tiše vrátí PNG. Proto:

1. Zkusit nativní `canvas.toBlob(..., 'image/webp', q)` / `OffscreenCanvas.convertToBlob`
2. **Vždy zkontrolovat `blob.type === 'image/webp'`**
3. Jinak kódovat přes **`@jsquash/webp`** (WASM), načítané líně jen když je potřeba
4. Kódování běží ve **Web Workeru**, ať admin nezamrzá

Další pozor:
- Velké fotky (40+ Mpx) na iOS Safari můžou narazit na limit velikosti canvasu → zmenšovat postupně / přes `createImageBitmap` s `resizeWidth`. Admin se primárně používá z počítače; iOS otestovat, ne optimalizovat.
- Nahrávat souběžně max. 3 soubory.
- **R2 CORS:** povolit `PUT` z `https://admin.<doména>`.
- Payload `upload` kolekce ani `@payloadcms/storage-s3` **nepoužíváme** — generují varianty na serveru přes sharp. `Photos` je obyčejná kolekce s metadaty; podepisování přes `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`.
- Smazání fotky smaže i objekty v R2 (hook `afterDelete`).

---

## 6. Admin (Payload)

- `i18n`: čeština jako jediný jazyk rozhraní (`@payloadcms/translations/languages/cs`), vlastní texty v `cs`
- Jeden uživatel, kolekce `Users` s auth, bez rolí; registrace vypnutá
- `Projects` s `versions: { drafts: true }` → koncept / publikováno
- Slug: hook `beforeValidate` generuje z názvu; po první publikaci pole `readOnly` s popiskem pod polem
- `Homepage` globál: `relationship` hasMany na `Projects`, řazení tažením; hook po publikaci projektu ho přidá na konec
- Tlačítko **Publikovat web**: vlastní komponenta → endpoint `/api/publish` → `POST` na `CF_DEPLOY_HOOK_URL`. Ukazuje čas posledního publikování.
- Náhled dlaždice: importuje `Tile` z `packages/ui`
- Vzhled adminu jen přes `admin.components` a konfiguraci. **Nepřepisovat CSS Payloadu.**

---

## 7. Infrastruktura

### Server — Hetzner CAX11 (ARM, 2 vCPU, 4 GB)
- Ubuntu LTS, Docker Compose: `caddy` (reverse proxy + HTTPS), `postgres:16`, `cms`
- Docker image `cms` buildit pro **arm64**
- `ufw` (22, 80, 443), SSH jen klíčem, `unattended-upgrades`
- Cron: denně `pg_dump` → R2 (`backups/`), retence 30 dní
- **Test obnovení zálohy** je součást předání, ne volitelný

### DNS (Cloudflare)
| Záznam | Kam | Proxy |
|---|---|---|
| `<doména>`, `www` | Cloudflare Pages | ✓ |
| `admin` | IP serveru | ✓ (skryje IP) |
| `img` | R2 custom domain | ✓ |

### Build a deploy
- Cloudflare Pages napojené na GitHub repo, root `apps/web`, build `pnpm --filter web build`, výstup `apps/web/out`
- Build z `main` → produkce, z ostatních branchí → preview URL
- Deploy hook (Pages) volá Payload při „Publikovat web"
- `apps/cms` se nasazuje na server ručně / přes GitHub Action (build image → push → `docker compose pull && up -d`)

### Účty — **všechny na klientku**
Registrátor domény, Cloudflare, Hetzner, Resend. Vývojář má přístup jako člen/pozvaný uživatel. Repo na GitHubu je naše; předání dohodou.

---

## 8. Env proměnné

`apps/web`:
```
CONTENT_SOURCE=seed|payload
PAYLOAD_PUBLIC_URL=https://admin.<doména>
NEXT_PUBLIC_IMG_BASE=https://img.<doména>
NEXT_PUBLIC_SITE_URL=https://<doména>
```

`apps/cms`:
```
DATABASE_URI=postgres://...
PAYLOAD_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
IMG_BASE_URL=https://img.<doména>
CF_DEPLOY_HOOK_URL=
RESEND_API_KEY=
EMAIL_FROM=
ADMIN_ORIGIN=https://admin.<doména>
```

`.env.example` v repu, skutečné hodnoty nikdy v gitu.

---

## 9. Konvence

- TypeScript `strict`, žádné `any` bez komentáře proč
- ESLint + Prettier, `pnpm lint` v CI
- Conventional Commits v angličtině
- Komponenty: funkční, props typované, žádné default exporty v `packages/`
- Texty webu anglicky přímo v komponentách (web je jednojazyčný); texty adminu česky přes Payload i18n
- CI (GitHub Actions): lint, typecheck, unit testy, build webu se seed daty

---

## 10. Provozní náklady klientky

~172 Kč / měsíc (doména ~21, Hetzner ~150, R2 ~1, zbytek zdarma). Nerostou s návštěvností.
