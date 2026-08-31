import type { ApiProduct } from '@/lib/api'
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

/**
 * Every photograph URL that more than one product points at.
 *
 * Derived from the live catalogue rather than hard-coded, so it stays correct
 * as photography is added: upload a picture for one wheat product and that
 * product starts showing it, while the six still sharing the old one keep
 * their glyphs. Raw and fried are pooled deliberately — a picture used as one
 * product's raw shot and another's fried shot is still the same picture
 * appearing twice.
 */
export function sharedProductImages(products: ApiProduct[]): Set<string> {
  const seen = new Map<string, number>()
  for (const p of products) {
    for (const url of [p.raw_image_url, p.fried_image_url]) {
      if (!url) continue
      seen.set(url, (seen.get(url) ?? 0) + 1)
    }
  }
  const shared = new Set<string>()
  for (const [url, count] of seen) if (count > 1) shared.add(url)
  return shared
}

/** A photograph this product does not share with any other, or null. */
export function ownPhoto(
  url: string | null | undefined,
  shared: Set<string>,
): string | null {
  if (!url || shared.has(url)) return null
  return url
}
