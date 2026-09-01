import type { GlyphId } from '@/lib/sprite-ids'

/**
 * The one place that says which visual belongs to which product.
 *
 * The catalogue has twelve products and, at the time of writing, six
 * photographs between them: all seven wheat products share one raw and one
 * fried shot, the three potato products share another pair, and the two corn
 * products share a third. On a page that shows the whole catalogue at once
 * that reads as a mistake — three pictures repeating down the grid — rather
 * than as twelve products.
 *
 * So a product only shows a photograph it does not share with another product.
 * Where it does share one, it falls back to its own glyph instead. Nothing is
 * deleted to achieve that: the photographs stay in the CMS exactly as the
 * admin set them, and the moment a product gets a picture of its own it starts
 * showing it again with no code change. `scripts/check-assets.mjs` fails the
 * build if two products are ever assigned the same glyph.
 */

/**
 * A glyph per catalogue product, keyed by slug.
 *
 * Each depicts what its product actually is — the slugs name real shapes — so
 * the fallback still carries information rather than being decoration. Keyed
 * by slug rather than name because names are CMS-editable and translated.
 */
export const GLYPH_BY_PRODUCT: Record<string, GlyphId> = {
  'spiral-potatoes': 'g-curl',
  'colorful-wheat-chips': 'g-ridged',
  'egyptian-3d-fish': 'g-fish',
  'egyptian-3d-ball': 'g-ball',
  'window-wheat': 'g-window',
  'potato-skins': 'g-skin',
  'plain-potatoes': 'g-classic',
  'square-wheat-serrated-flakes': 'g-serrated',
  'wheat-pipe': 'g-pipe',
  'wheat-ring-small': 'g-ring',
  'wheat-ring-large': 'g-ring-large',
  'flower-wheat': 'g-flower',
  // The shapes the factory actually shows on its sample shelf. Added
  // ahead of their CMS records so a new product renders as itself from
  // the moment it is created, rather than borrowing the category glyph
  // off a product that already has it.
  'crinkle-smooth': 'g-crinkle',
  'square-tube': 'g-tube-square',
  'cones': 'g-cone',
  'flat-small': 'g-flat-small',
}

/** Used for a product the map has not been told about yet — a new record in
 *  the admin should not render nothing while someone adds its glyph. */
const GLYPH_BY_CATEGORY: Record<string, GlyphId> = {
  potato: 'g-classic',
  wheat: 'g-ring',
  corn: 'g-curl',
}

/** The accent a category's artwork is drawn in. Here rather than in a
 *  component because two of them need it and it is an assignment like any
 *  other. */
const TONE_BY_CATEGORY: Record<string, string> = {
  potato: '#D4A017',
  wheat: '#EA9A0B',
  corn: '#C2410C',
}

export function toneFor(categorySlug: string): string {
  return TONE_BY_CATEGORY[categorySlug] ?? 'var(--gold)'
}

export function glyphFor(slug: string, categorySlug: string): GlyphId {
  return GLYPH_BY_PRODUCT[slug] ?? GLYPH_BY_CATEGORY[categorySlug] ?? 'g-classic'
}
