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

## Content status

**Every figure on this site is an illustrative placeholder** — founding year,
tonnage, line count, governorate coverage, ISO 22000 / HACCP certification, the
phone number, the email and the address. The footer carries a visible
disclaimer; leave it until real data lands. The `ku` and `tr` copy is a first
pass and wants a native review before launch.
