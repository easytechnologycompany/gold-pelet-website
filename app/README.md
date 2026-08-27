# Gold Pelet — React front end

The React port of the approved Gold Pelet design, built to the stack locked in
[`easytechnologycompany/gold-pelet`](https://github.com/easytechnologycompany/gold-pelet)
(`docs/stack.md`). Front end only — no Express server, no Postgres, no admin
console.

This lives in `app/` and is **completely separate** from the existing static
site at the repository root (`index.html`, `css/`, `js/`, `main.go`, `admin/`).
Nothing outside this folder was modified.

---

## Run it

```bash
npm install --prefix app
```

```bash
npm run dev --prefix app
```

Vite serves on <http://localhost:5173>. Other scripts: `build` (`tsc -b && vite
build`), `lint`, `preview`.

---

## Stack

Exactly what `docs/stack.md` specifies, all resolved inside the pinned ranges:

| Layer | Package | Installed |
|---|---|---|
| Runtime | Node | 24.13 (`engines: >=20`) |
| Build | `vite` + `@vitejs/plugin-react` | 8.2.2 / 6.x |
| Language | `typescript` | 6.0.3 |
| Styling | `tailwindcss` + `@tailwindcss/vite` | 4.3.3 — CSS-first, **no `tailwind.config.js`** |
| Routing | `react-router-dom` | 7.18.2 |
| State | `zustand` | 5.x |
| Motion | `motion` + `lenis` | 12.43 / 1.3 |
| Icons | `lucide-react` | UI icons only |
| Variants | `cva` + `clsx` + `tailwind-merge` | `cn()` in `src/lib/utils.ts` |

No Next.js, no component library, no CSS-in-JS, no ORM, no icon font, no
external image host.

## Structure

By feature, not by type.

```
src/
  components/
    layout/     Chrome, Footer, Sprite, ThemeProvider, LocaleProvider
    ui/         Button (cva), ChevronLink, Icon
    showcase/   Hero, PackArt, Statement, BentoGrid, ManufacturingStory,
                ProductRail, Specs, Cta
    motion/     Reveal, SmoothScroll, useScrollLinked
  lib/
    api.ts      CMS client: origin resolution, safe fetch, response types
    cms.ts      zustand store hydrated from the API + formatStat()
    i18n.ts     locale store + Str type + useT()
    content.ts  every user-facing string, keyed, four locales
    products.ts bento / product / spec data (the designed fallback)
    theme.ts    three-state theme store
    utils.ts    cn()
  pages/        Home, NotFound
  index.css     tokens + @theme inline + component layer
```

## The invariants this port preserves

- **Hand-drawn artwork.** Every icon, and every crisp without a photograph, is
  an SVG `<symbol>` in `Sprite.tsx` referenced with `<use href="#id">`. (The
  original *no external images at all* rule no longer holds — see
  [The no-external-images invariant was lifted](#the-no-external-images-invariant-was-lifted).
  Images now come from the CMS's own `/uploads`, not a third-party host.)
- **Three-state theming.** Explicit light, explicit dark, and unset. Unset
  *removes* `data-theme` so `prefers-color-scheme` stays in charge — see
  `ThemeProvider.tsx`.
- **Size-specific tracking.** No global `letter-spacing`. The per-size table
  from the design docs is reproduced verbatim in `index.css`.
- **Arabic is first-class.** All four locales (en / ar / ku / tr) ship, `ar`
  and `ku` are RTL with the Arabic-script font and `letter-spacing: normal`,
  and every measured per-locale leading override is carried across. Layout uses
  logical properties throughout — no `left` / `right`.
- **Motion.** Press feedback at 100ms, the hero pack scroll-linked 1:1 on
  `requestAnimationFrame` writing only `transform`, reduced motion degrading to
  a cross-fade rather than to nothing.

## Deliberate deviations from the source

Three, all small and all commented at the point of change:

1. **`@custom-variant dark`** is defined against `data-theme` + the media
   query rather than `stack.md`'s sketched `.dark` class, which this project
   never had and which would silently never match.
2. **The theme toggle uses `lucide-react`'s `Sun` / `Moon`** instead of the
   two hand-inlined paths, because `stack.md` calls for Lucide for UI icons.
   Product artwork stays hand-drawn.
3. **Lenis smooth scrolling with `anchors: true`.** The static page jumped
   instantly to anchors; `stack.md` lists Lenis for smooth scroll. Disabled
   entirely under `prefers-reduced-motion`.

Plus one restoration: `.specs` re-declares `margin-bottom: 1em`, which the
original inherited from the UA default for `dl` and Tailwind's Preflight
resets. Without it the specs section measured 17px shorter than the reference.

## Backend connection

The app reads from the existing Go API — the same service `js/cms.js` and the
admin dashboard already use (`/api/v1`, origin
`https://backend-production-cfda.up.railway.app`, or `http://localhost:8090`
locally).

It follows the same **progressive-enhancement** contract as `js/cms.js`: the
designed content is the baseline, live values overlay it, and an unreachable
API is silent — every fetch in `src/lib/api.ts` resolves to `null` rather than
throwing, so the page keeps exactly what it shipped with.

### ⚠ CORS blocks this in production today

The backend returns `Access-Control-Allow-Headers` and `-Allow-Methods` but
**never `Access-Control-Allow-Origin`**, so browsers block every cross-origin
call to it. `curl` does not enforce CORS, which is why the endpoints look
reachable from a shell and are not from a page.

Dev works because Vite proxies `/api` and `/uploads`, making the request
same-origin. Production has no proxy, so until the backend sends that header
for the site's origin the app runs permanently on its designed fallback
content. Nothing breaks — it just never shows live data.

Point dev at a local backend with:

```bash
VITE_BACKEND_ORIGIN=http://localhost:8090 npm run dev --prefix app
```

### What is wired

| Endpoint | Where it lands | Fallback |
|---|---|---|
| `/public/products` | The product rail — 12 real products with their photography, category and spec labels | the six designed flavours |
| `/public/categories` | Product card `cut` line, and the footer's Products column | designed flavour list |
| `/public/site-images` | The manufacturing story strip, and the bento art cell | strip hides; cell keeps its hand-drawn crisp |
| `/public/content` | Footer contact block (`contact.*`) | designed Baghdad placeholders |
| `/public/stats` | The `daily_capacity` bento cell | designed `14t` |
| `/public/certifications` | The ISO/HACCP bento cell heading | designed `ISO 22000 · HACCP` |
| `/public/branding` | The header logo (`logo_url` only) | hand-drawn mark + "Gold Pelet" |

Every one of these degrades to the designed content when the API is
unreachable — nothing can render blank.

Digits are localized (`٥٠+ t/day` in Arabic); unit suffixes are not, because
the API has no translation column for them.

### The no-external-images invariant was lifted

`CLAUDE.md §2` barred external images outright, and every crisp was hand-drawn
SVG. That was **overridden deliberately on the client's instruction** so the
real catalogue and process photography could be used. The SVG sprite is still
there and still used wherever a product has no photograph, so the two coexist.

### Known content gaps in the CMS

Not code problems — things to fix in the admin dashboard.

- **Only 3 distinct product photographs exist across 12 products** (one per
  category), so all seven wheat products render the same picture. Same for
  the fried state.
- **Products are English-only.** There is no translation column, so product
  names, descriptions and category labels stay English while the rest of the
  page switches through all four locales.
- **Images are single full-size originals** (1200×900, ~105 KB each) with no
  thumbnail or `srcset` variants, displayed as small as 145 px. Total is under
  1 MB and everything is lazy-loaded, so this is a sharpness/bandwidth nicety
  rather than a problem today.

### Still not wired, and why

- **`/public/branding` colour fields** — the logo *is* used, but
  `primary_hex` and friends return the *old* green/navy palette (`#446931`,
  `#0B4363`). Applying those would overwrite the approved black-and-gold
  token system, so nothing reads them.

  Two things to know about the logo itself. It is a full wordmark that
  already spells "GOLD PELET", so it replaces the mark *and* the text rather
  than sitting beside them — otherwise the name prints twice. And its navy
  would all but vanish on the dark theme's near-black ground, so it is
  flattened to the foreground colour with `brightness(0) invert(1)` in dark
  mode. That drops the green and navy. If the brand colours must survive
  literally, the alternative is a light-on-dark logo variant uploaded to the
  CMS, the way the old site ships `assets/img/logo-white.png`.
- **`/public/page-heroes`, `/public/timeline`, `/public/news`** — page-specific
  content for the old multi-page site. This design is a single page with no
  section that corresponds.

## Content status

**Every figure on this site is an illustrative placeholder** — founding year,
tonnage, line count, governorate coverage, ISO 22000 / HACCP certification, the
phone number, the email and the address. The footer carries a visible
disclaimer; leave it until real data lands. The `ku` and `tr` copy is a first
pass and wants a native review before launch.
