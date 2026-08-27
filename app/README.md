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

## Deployment

Deployed as its own Railway service, **`gold-pelet-app`**, in the
`gold-pelet-backend` project — separate from `frontend`, which serves the
static site at the repo root and is untouched by any of this.

<https://gold-pelet-app-production.up.railway.app>

| Setting | Value |
|---|---|
| Source | `easytechnologycompany/gold-pelet-website`, branch `master` |
| Root directory | `app` |
| Builder | Dockerfile (`app/Dockerfile`) |

Pushes to `master` deploy automatically. `railway.json` sets `watchPatterns`
to `**` — relative to the service root, so only changes under `app/` trigger a
build. Without it, every commit to the static site at the repo root would
rebuild and redeploy this app for nothing, and master carries both projects.

The image builds the bundle with Node and ships only the static output on
`caddy:alpine`, so there is no Node in the runtime image. Caddy handles the
SPA fallback that react-router needs — see the comments in `Caddyfile`.

**A new deployment URL needs adding to the API's CORS allowlist**, or the app
will run on its designed fallback content instead of live data:

```bash
railway variables --service backend --set "CORS_ORIGINS=<existing>,<new-origin>"
```

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

  Two things to know about the logo itself. The CMS ships one asset: a full
  lockup reading "GOLD PELET", in which the navy graphic *is* the P. At
  header size its "ELET" lettering is what forces the whole thing small, so
  the header crops to the **mark only** — leaf, P and dot — and the wordmark
  returns as live text beside it, which is the lockup the design always had.

  The crop is CSS, not a committed asset, so the header follows whatever the
  admin uploads. It is measured off the current artwork (910x576): the mark
  ends at x=475, and the leaf's tip overhangs the "E", which begins at x=426
  below y=380 — so the box crops to the first and a polygon notches out the
  second. Those ratios hold for any re-upload of the same artwork at any
  resolution, but a genuinely different logo design would need re-measuring.

  Second: measured against the dark ground the logo's navy lands at
  **1.88:1**, under the 3:1 floor for non-text graphics — unreadable, not
  merely dull. On the light ground it is fine (10.07:1 navy, 6.07:1 green).
  So dark mode sits the mark on a **light plate** rather than recolouring it,
  and the brand's navy and green survive intact.

  The plate colour is deliberately not a theme token: its whole job is to
  stay light while everything around it goes dark, which is exactly what a
  swapping token would not do. It is `--plate`, defined once and never
  redefined in a theme block.

  Worth recording, since it came up: `assets/img/logo-white.png` in the old
  site is **pixel-for-pixel the same artwork** as the colour logo, just
  filled flat white — 100% identical alpha silhouette, no green, no navy.
  Uploading a white variant to the CMS would therefore add nothing the old
  `brightness(0) invert(1)` filter did not already produce, which is why the
  plate exists instead.

## Content status

Every public page reads from the live CMS. The catalogue, categories,
certifications, milestones, news, stats, page heroes, site images, branding and
contact details are all real records the admin dashboard owns, and there is no
second hardcoded copy of any of them — the designed placeholder catalogue, the
bento cells and the spec table were deleted rather than left as a fallback.

What remains in `src/lib/content.ts` is chrome only: the brand name, three aria
labels, the rail hint and the two 404 strings.

### Translations

The backend stores **English only** — no `name_ar`, no `description_ku`, no
translation table. The finished site produces four languages with a client-side
overlay, and `src/lib/overlay.ts` is that same rule expressed as a function:

    API record (English) -> derived key -> TRANSLATIONS[locale] -> text
                                              (else the English value)

`src/lib/translations.ts` is generated from `js/i18n.js` by
`npm run sync:translations`. The old file stays the source of truth; never edit
the generated one. Re-run the sync after changing any copy over there.

One deliberate difference from the live site: there, `applyTranslations()` runs
for English too, so a `products.<slug>.name` override outranks the database and
renaming a product in the admin dashboard never shows. Here English is
admin-owned everywhere and the overlay supplies `ar`/`ku`/`tr` only.

Records with no override — certifications, milestones, news — read in English
in every locale, exactly as they do on the live site. Fixing that means adding
translation columns to the backend.

## SEO

Three pieces, and they have to agree with each other:

- **`src/lib/seo.ts`** — the page list, and the `seo.<page>.title` /
  `seo.<page>.description` keys. Those keys live in `js/i18n.js` like all the
  others, so titles and descriptions exist in all four locales; the live site
  had them hardcoded in each HTML file in English only.
- **`src/components/layout/Seo.tsx`** — keeps the head correct once React takes
  over: on client-side navigation, and when the visitor switches language.
  Also sets `noindex` on the 404 route.
- **`scripts/prerender.mjs`** — runs as part of `npm run build`. Writes a static
  shell per route into `dist/`, plus `404.html`, `robots.txt` and `sitemap.xml`.

The prerender step is what makes this work for crawlers that do not run
JavaScript. It is **not** server-side rendering — the `<body>` is still the
empty root div — but each shell carries the right `<title>`, description,
canonical and Open Graph tags, which is the part a scraper reads.

`Caddyfile` has to cooperate: `try_files {path} {path}/index.html /404.html`.
The middle candidate serves the per-route shells; without it every URL returns
one document and the whole site shares the home page's metadata.

### Deploying somewhere other than production

Canonical URLs, `og:url` and the sitemap all default to
`https://www.goldpeletcips.com`. Override for any other host:

    VITE_SITE_ORIGIN=https://gold-pelet-app-production.up.railway.app npm run build

A review deploy that claims the production canonical tells search engines to
index the wrong host. The prerender script reads the same variable.

### No hreflang, and why

hreflang annotates *distinct URLs* for the same content in different languages.
This site has none: locale is a stored preference, not part of the path, so
`/about` serves all four languages. Emitting hreflang for it would be a lie.

That also means only the English copy is indexable. Fixing it properly needs
locale-prefixed routes (`/ar/about`) with a shell per locale per page — a
routing change, not an SEO tweak. Worth doing if the non-English pages need to
rank; noted here so the gap is a decision rather than an oversight.
