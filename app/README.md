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
    showcase/   Hero, PackArt, Statement, BentoGrid, ProductRail, Specs, Cta
    motion/     Reveal, SmoothScroll, useScrollLinked
  lib/
    i18n.ts     locale store + Str type + useT()
    content.ts  every user-facing string, keyed, four locales
    products.ts bento / product / spec data
    theme.ts    three-state theme store
    utils.ts    cn()
  pages/        Home, NotFound
  index.css     tokens + @theme inline + component layer
```

## The invariants this port preserves

- **No external images.** Zero `<img>` elements on the page; every crisp and
  icon is a hand-drawn SVG `<symbol>` in `Sprite.tsx`, referenced with
  `<use href="#id">`. Google Fonts is the only external host.
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
| `/public/stats` | The `daily_capacity` bento cell | designed `14t` |
| `/public/certifications` | The ISO/HACCP bento cell heading | designed `ISO 22000 · HACCP` |

These are exactly the placeholder figures `CLAUDE.md §4` marks for replacement.
Digits are localized (`٥٠+ t/day` in Arabic); unit suffixes are not, because
the API has no translation column for them.

### What is deliberately not wired

- **`/public/products`** — the CMS sells raw pellets B2B (*Spiral Potatoes*,
  *Wheat Pellets*) with raw/fried photographs. The approved rail sells finished
  snack flavours with a cut, a heat level and a pack weight. Different product
  model, **no shared key**, and the CMS's photos are barred by the no-external-
  images invariant. The rail therefore still renders its designed six
  flavours. See *What the rail needs from the CMS* below — the agreed plan is
  to add the real product data to the CMS first, then wire the rail to it.
- **`/public/content`** — keys target the old site's pages
  (`about.story.heading`); nothing corresponds to this design's copy.
- **`/public/branding`** — returns the old green/navy palette (`#446931`,
  `#0B4363`). Applying it would destroy the approved black-and-gold token
  system.
- **`/public/site-images`**, `/public/page-heroes`, `/public/timeline`,
  `/public/news` — photographic or page-specific; this design is entirely
  hand-drawn SVG and single-page.

### What the rail needs from the CMS

Spec for the backend/admin work, so the rail can be wired the moment the data
exists. The rail's shape is `Product` in `src/lib/products.ts`; the existing
products table already covers `name`, `description`, `sort_order` and
`is_active`.

**Five fields to add.** None of them are images — the rail draws its own
artwork and must keep doing so.

| Field | Type | Notes |
|---|---|---|
| `cut` | text | The cut name, e.g. *Classic cut*, *Rings*, *Curls*. Shown above the product name. |
| `glyph` | enum | Which hand-drawn crisp to render. Exactly one of `g-classic`, `g-ridged`, `g-ring`, `g-curl`, `g-stick`. **Not** a URL — these are SVG symbols in `Sprite.tsx`. Adding a new shape means drawing it there first. |
| `tone` | hex colour | Per-product artwork glow, e.g. `#D4A017`. This is the only place colour variety lives, and it comes from the product rather than the interface. |
| `weight_grams` | integer | Retail pack weight. Rendered as `45 g`. |
| `heat_level` | integer 0–3 | `0` renders the word *mild*; `1`–`3` render filled dots. An empty meter reads as missing data, which is why zero is a word. |

**Translations are the harder half.** The products table is English-only today
— `js/cms.js` works around that with client-side overrides keyed by slug. The
rail ships all four locales, so pulling names from the CMS as-is would *lose*
Arabic, Kurdish and Turkish for every product. Either add translation columns
(or a `product_translations` table) for `name`, `description` and `cut`, or
accept English-only product copy on an otherwise fully localized page.

A product the rail can render completely:

```json
{
  "slug": "salt-sunflower",
  "name": "Salt & Sunflower",
  "description": "Three ingredients. Coarse sea salt applied warm so it lands in flakes, not dust.",
  "cut": "Classic cut",
  "glyph": "g-ridged",
  "tone": "#D4A017",
  "weight_grams": 45,
  "heat_level": 0,
  "sort_order": 1,
  "is_active": true,
  "translations": {
    "ar": { "name": "ملح وزيت دوّار الشمس", "cut": "قصّة كلاسيكية", "description": "…" },
    "ku": { "name": "خوێ و گوڵەبەڕۆژە", "cut": "قەدی کلاسیکی", "description": "…" },
    "tr": { "name": "Tuz & Ayçiçeği", "cut": "Klasik kesim", "description": "…" }
  }
}
```

The designed copy for all six flavours, in all four locales, already exists in
`src/lib/products.ts` and can be lifted straight into the CMS seed.

## Content status

**Every figure on this site is an illustrative placeholder** — founding year,
tonnage, line count, governorate coverage, ISO 22000 / HACCP certification, the
phone number, the email and the address. The footer carries a visible
disclaimer; leave it until real data lands. The `ku` and `tr` copy is a first
pass and wants a native review before launch.
