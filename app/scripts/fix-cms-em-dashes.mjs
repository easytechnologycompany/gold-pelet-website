/**
 * Replaces the em dashes still stored in the live CMS with the comma phrasing
 * the rest of the site already uses.
 *
 *   node scripts/fix-cms-em-dashes.mjs            # dry run, prints the diff
 *   GP_ADMIN_TOKEN=... node scripts/fix-cms-em-dashes.mjs --apply
 *
 * Why this is needed at all, given commit 273c3b3 already replaced them:
 * English is admin-owned. lib/overlay.ts's resolveCms returns the CMS value
 * verbatim for locale "en" and never consults TRANSLATIONS, so cleaning
 * translations.ts fixed Arabic, Kurdish and Turkish only. The English on
 * screen is read straight from the database, which still has the dashes.
 *
 * Every replacement is read out of translations.ts rather than typed here, so
 * the database ends up byte-identical to the overlay's English instead of to
 * fresh wording that merely reads the same. A replacement that still contains
 * an em dash aborts the run.
 *
 * Writing needs the bearer token the admin dashboard stores in localStorage
 * under "gp_admin_token" once you are signed in. The dry run needs nothing:
 * it reads the public endpoints only.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const EM = String.fromCharCode(0x2014)
const API = 'https://backend-production-cfda.up.railway.app/api/v1'
const TOKEN = process.env.GP_ADMIN_TOKEN
const APPLY = process.argv.includes('--apply')

const here = dirname(fileURLToPath(import.meta.url))
const SOURCE = resolve(here, '../src/lib/translations.ts')

/** Brace-matched slice of the object literal, same approach as
 *  sync-translations.mjs: a regex cannot do this safely because the values
 *  contain braces, quotes and apostrophes. */
function extractLiteral(text, declaration) {
  const at = text.indexOf(declaration)
  if (at === -1) throw new Error(declaration + ' not found in ' + SOURCE)
  const open = text.indexOf('{', at)
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return text.slice(open, i + 1)
  }
  throw new Error('unterminated literal for ' + declaration)
}

const literal = extractLiteral(readFileSync(SOURCE, 'utf8'), 'export const TRANSLATIONS')
const en = new Function('return ' + literal)().en

const need = (key) => {
  const value = en[key]
  if (value === undefined) throw new Error('missing key in translations.ts: ' + key)
  if (value.includes(EM)) throw new Error('replacement still has an em dash: ' + key)
  return value
}

/** Which CMS record each overlay key is the clean English for. */
const HERO_KEYS = {
  home: 'home.hero.lede',
  products: 'products.hero.p',
  services: 'services.hero.p',
  about: 'about.hero.p',
  news: 'news.hero.p',
  contact: 'contact.hero.p',
}
const CONTENT_KEYS = ['about.story.para1']
const CATEGORY_SLUGS = ['wheat', 'corn']

const headers = () => {
  const h = { 'Content-Type': 'application/json' }
  if (TOKEN) h.Authorization = 'Bearer ' + TOKEN
  return h
}

async function json(path) {
  const res = await fetch(API + path, { headers: headers() })
  if (!res.ok) throw new Error(res.status + ' ' + res.statusText + ' on ' + path)
  return res.json()
}

const planned = []

// Page heroes: PUT replaces the record, so carry every field forward.
for (const [page, key] of Object.entries(HERO_KEYS)) {
  const hero = await json('/public/page-heroes/' + page)
  if (!hero.subheading.includes(EM)) continue
  planned.push({
    label: 'page-heroes/' + page,
    before: hero.subheading,
    after: need(key),
    path: '/admin/page-heroes/' + page,
    body: {
      page_key: hero.page_key,
      image_url: hero.image_url,
      eyebrow: hero.eyebrow,
      heading: hero.heading,
      subheading: need(key),
    },
  })
}

// Content: the endpoint takes the value on its own.
const content = (await json('/public/content')).data
for (const key of CONTENT_KEYS) {
  const row = content.find((c) => c.content_key === key)
  if (!row) throw new Error('no content row for ' + key)
  if (!row.content_value.includes(EM)) continue
  planned.push({
    label: 'content/' + key,
    before: row.content_value,
    after: need('content.' + key),
    path: '/admin/content/' + encodeURIComponent(key),
    body: { content_value: need('content.' + key) },
  })
}

// Categories: keyed by id, and again a full-record PUT.
const categories = (await json('/public/categories')).data
for (const slug of CATEGORY_SLUGS) {
  const row = categories.find((c) => c.slug === slug)
  if (!row) throw new Error('no category ' + slug)
  if (!row.description.includes(EM)) continue
  planned.push({
    label: 'categories/' + slug,
    before: row.description,
    after: need('categories.' + slug + '.description'),
    path: '/admin/categories/' + row.id,
    body: {
      name: row.name,
      slug: row.slug,
      description: need('categories.' + slug + '.description'),
      sort_order: row.sort_order,
      is_active: row.is_active,
    },
  })
}

if (planned.length === 0) {
  console.log('Nothing to do: no em dashes left in the CMS.')
  process.exit(0)
}

console.log(planned.length + ' record(s) to update:')
console.log('')
for (const p of planned) {
  console.log('  ' + p.label)
  console.log('    - ' + p.before)
  console.log('    + ' + p.after)
  console.log('')
}

if (!APPLY) {
  console.log('Dry run. Re-run with --apply and GP_ADMIN_TOKEN set to write these.')
  process.exit(0)
}

if (!TOKEN) {
  console.error('GP_ADMIN_TOKEN is not set. It is the bearer token the admin')
  console.error('dashboard stores in localStorage under "gp_admin_token".')
  process.exit(1)
}

for (const p of planned) {
  const res = await fetch(API + p.path, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(p.body),
  })
  if (!res.ok) {
    console.error('FAILED ' + p.label + ': ' + res.status + ' ' + (await res.text()))
    process.exit(1)
  }
  console.log('updated ' + p.label)
}

// Verify against the same public endpoints the site reads.
let dirty = 0
for (const page of Object.keys(HERO_KEYS)) {
  if (JSON.stringify(await json('/public/page-heroes/' + page)).includes(EM)) {
    dirty++
    console.error('still dirty: page-heroes/' + page)
  }
}
for (const path of ['/public/content', '/public/categories']) {
  if (JSON.stringify(await json(path)).includes(EM)) {
    dirty++
    console.error('still dirty: ' + path)
  }
}
console.log('')
console.log(dirty ? dirty + ' endpoint(s) still contain an em dash.'
                  : 'Verified: no em dashes left in any public endpoint.')
