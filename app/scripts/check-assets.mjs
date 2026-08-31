/**
 * Fails the build if a visual asset is assigned to more than one thing.
 *
 * The rule this enforces is that one asset has one use. It is written as a
 * build step rather than a unit test because this app has no test runner, and
 * the guarantee is only worth having if it cannot be skipped — a convention
 * that lives in a comment gets broken the first busy afternoon.
 *
 * Reads the source directly rather than importing it: the map is a plain
 * literal, and parsing it here keeps this script free of a TypeScript loader.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const mapPath = resolve(here, '../src/lib/asset-map.ts')
const spritePath = resolve(here, '../src/components/layout/Sprite.tsx')

const mapSrc = readFileSync(mapPath, 'utf8')
const spriteSrc = readFileSync(spritePath, 'utf8')

const block = mapSrc.match(
  /export const GLYPH_BY_PRODUCT: Record<string, GlyphId> = \{([\s\S]*?)\n\}/,
)
if (!block) {
  console.error('check-assets: could not find GLYPH_BY_PRODUCT in asset-map.ts')
  process.exit(1)
}

const entries = [...block[1].matchAll(/'([^']+)':\s*'([^']+)'/g)].map((m) => ({
  slug: m[1],
  glyph: m[2],
}))

const errors = []

if (entries.length === 0) errors.push('GLYPH_BY_PRODUCT is empty')

// One glyph, one product.
const byGlyph = new Map()
for (const { slug, glyph } of entries) {
  if (!byGlyph.has(glyph)) byGlyph.set(glyph, [])
  byGlyph.get(glyph).push(slug)
}
for (const [glyph, slugs] of byGlyph) {
  if (slugs.length > 1) {
    errors.push(`glyph ${glyph} is assigned to ${slugs.length} products: ${slugs.join(', ')}`)
  }
}

// One product, one entry.
const bySlug = new Map()
for (const { slug } of entries) bySlug.set(slug, (bySlug.get(slug) ?? 0) + 1)
for (const [slug, count] of bySlug) {
  if (count > 1) errors.push(`product ${slug} appears ${count} times`)
}

// Every glyph named here has to exist in the sprite, or the card renders a
// blank box — a <use href> pointing at nothing fails silently.
const defined = new Set([...spriteSrc.matchAll(/id="(g-[a-z-]+)"/g)].map((m) => m[1]))
for (const { slug, glyph } of entries) {
  if (!defined.has(glyph)) {
    errors.push(`glyph ${glyph} (${slug}) is not defined in Sprite.tsx`)
  }
}

if (errors.length) {
  console.error('\ncheck-assets: asset assignment is not unique\n')
  for (const e of errors) console.error('  - ' + e)
  console.error('')
  process.exit(1)
}

console.log(`check-assets: ${entries.length} products, ${byGlyph.size} distinct glyphs, all defined`)
