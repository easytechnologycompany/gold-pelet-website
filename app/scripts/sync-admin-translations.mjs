/**
 * Regenerates src/lib/admin-translations.ts from admin/js/i18n.js.
 *
 * The sibling of sync-translations.mjs, and for the same reason: the old
 * dashboard's dictionary stays the source of truth, so a string edited there
 * reaches the ported screens by re-running this rather than by hand-copying.
 *
 *   node scripts/sync-admin-translations.mjs
 *
 * The admin dictionary is deliberately separate from the public one. It holds
 * strings the public site does not have — nav labels, CRUD chrome, field
 * labels — and it carries two locales (en, tr), not the public site's four.
 *
 * Only the object literal is evaluated, never the surrounding module:
 * admin/js/i18n.js touches document and localStorage at load, neither of
 * which exists here.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SOURCE = resolve(here, '../../admin/js/i18n.js')
const TARGET = resolve(here, '../src/lib/admin-translations.ts')

const src = readFileSync(SOURCE, 'utf8')

/** Brace-matched slice, same approach as sync-translations.mjs: a regex
 *  cannot do this safely because the values contain braces and apostrophes. */
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

const table = new Function(`return ${extractLiteral(src, 'const ADMIN_TRANSLATIONS = {')}`)()

const locales = Object.keys(table)
if (!locales.includes('en')) throw new Error('the admin dictionary has no `en` block')

// English is the fallback for every other locale, so a key missing there is a
// key that renders as its own name. A gap in `tr` is fine and falls back.
const enKeys = Object.keys(table.en)
const counts = locales.map((l) => `${l}: ${Object.keys(table[l]).length}`).join(', ')

const missing = locales
  .filter((l) => l !== 'en')
  .flatMap((l) => enKeys.filter((k) => !(k in table[l])).map((k) => `${l}/${k}`))

const body = JSON.stringify(table, null, 2).replace(/\n/g, '\n')

writeFileSync(
  TARGET,
  `/**
 * GENERATED FILE — do not edit by hand.
 * Run \`node scripts/sync-admin-translations.mjs\` to regenerate.
 *
 * Source: admin/js/i18n.js, the finished admin dashboard's dictionary, which
 * remains the source of truth. Separate from lib/translations.ts: these are
 * admin-only strings, and the admin ships two locales rather than four.
 *
 * ${locales.length} locales (${counts}).
 * ${missing.length} key(s) fall back to English.
 */

export type AdminLocale = ${locales.map((l) => `'${l}'`).join(' | ')}

export const ADMIN_LOCALES: readonly AdminLocale[] = [${locales.map((l) => `'${l}'`).join(', ')}]

export const ADMIN_TRANSLATIONS: Record<AdminLocale, Record<string, string>> = ${body} as const
`,
  'utf8',
)

console.log(`wrote ${TARGET}`)
console.log(`  ${counts}`)
console.log(`  ${missing.length} key(s) fall back to English`)
