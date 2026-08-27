/**
 * Regenerates src/lib/translations.ts from the finished site's js/i18n.js.
 *
 * The live site keeps its four locales in a single `TRANSLATIONS` literal, and
 * that file stays the source of truth — the backend has no translation columns,
 * so this map is the only place the Arabic, Kurdish and Turkish copy exists.
 * Rather than hand-copying 960 strings (and re-copying them every time someone
 * edits the old site), this reads the literal and emits it verbatim.
 *
 *   node scripts/sync-translations.mjs
 *
 * It evaluates only the object literal, never the surrounding module — i18n.js
 * touches `document` and `localStorage` at load, which do not exist here.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SOURCE = resolve(here, '../../js/i18n.js')
const TARGET = resolve(here, '../src/lib/translations.ts')

const src = readFileSync(SOURCE, 'utf8')

/** Slice out `const TRANSLATIONS = { ... }` by brace matching. A regex cannot
 *  do this safely: the values contain braces, quotes and apostrophes. */
function extractLiteral(text, declaration) {
  const at = text.indexOf(declaration)
  if (at === -1) throw new Error(`${declaration} not found in ${SOURCE}`)
  const open = text.indexOf('{', at)
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return text.slice(open, i + 1)
  }
  throw new Error(`unterminated literal for ${declaration}`)
}

const table = new Function(`return ${extractLiteral(src, 'const TRANSLATIONS = {')}`)()

const locales = Object.keys(table)
const counts = locales.map((l) => `${l}: ${Object.keys(table[l]).length}`).join(', ')

// Every locale must carry every key. The old site falls back to English and
// logs a warning; here a gap means the sync itself went wrong, so it fails.
const reference = Object.keys(table.en)
for (const locale of locales) {
  const missing = reference.filter((k) => table[locale][k] === undefined)
  if (missing.length) {
    throw new Error(`${locale} is missing ${missing.length} key(s), e.g. ${missing.slice(0, 3).join(', ')}`)
  }
}

const banner = `/**
 * GENERATED FILE — do not edit by hand.
 * Run \`node scripts/sync-translations.mjs\` to regenerate.
 *
 * Source: js/i18n.js in the finished Gold Pelet site, which remains the source
 * of truth for all four locales. The CMS returns English only — there are no
 * translation columns on any table — so these keys are the overlay that turns
 * an English database record into Arabic, Kurdish or Turkish. See lib/overlay.ts.
 *
 * ${locales.length} locales, ${reference.length} keys each (${counts}).
 */
`

const body = `export const TRANSLATIONS: Record<string, Record<string, string>> = ${JSON.stringify(
  table,
  null,
  2,
)} as const\n`

writeFileSync(TARGET, banner + '\n' + body, 'utf8')
console.log(`translations.ts <- js/i18n.js  (${counts})`)
