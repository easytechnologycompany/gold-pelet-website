/**
 * Ids of the symbols in the SVG sprite (see components/layout/Sprite.tsx).
 *
 * This file used to be `products.ts` and also carried the designed catalogue —
 * six invented snack flavours, a seven-cell bento and a spec table. All of it
 * is gone: the catalogue, the capacity claims and the certifications now come
 * from the API, so the only thing still needed here is the two id unions that
 * keep `<Icon id="...">` honest.
 */

/** Hand-drawn product glyphs. No external images anywhere on this site. */
export type GlyphId =
  | 'g-classic'
  | 'g-ridged'
  | 'g-ring'
  | 'g-curl'
  | 'g-stick'
  | 'g-fish'
  | 'g-ball'
  | 'g-window'
  | 'g-skin'
  | 'g-serrated'
  | 'g-pipe'
  | 'g-ring-large'
  | 'g-flower'

/** UI icon symbols. */
export type IconId = 'i-chev' | 'i-check' | 'i-cert' | 'i-leaf' | 'i-scan' | 'i-truck'
