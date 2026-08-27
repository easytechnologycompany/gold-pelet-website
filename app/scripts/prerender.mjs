/**
 * Writes a static HTML shell per route into dist/, plus robots.txt and
 * sitemap.xml.
 *
 *   node scripts/prerender.mjs        (runs automatically after `npm run build`)
 *
 * Why this exists
 * ---------------
 * Caddy serves the SPA with `try_files {path} {path}/index.html /index.html`,
 * so without these files every URL returns the same document — one title and
 * one description for the whole site. Google renders JavaScript and would
 * eventually see the head manager's output, but most social scrapers and some
 * crawlers do not run JS at all, so a shared link would show the home page's
 * title no matter which page was shared.
 *
 * This is not full server-side rendering: the <body> is still the empty root
 * div that React mounts into. What each shell carries is a correct <head> —
 * title, description, canonical, Open Graph and Twitter tags — which is the
 * part crawlers read before deciding what to display.
 *
 * The copy comes from the generated translations (English, since a static file
 * cannot know the visitor's stored locale) and is identical to what the head
 * manager writes for `en`, so there is no disagreement between the two.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(here, '../dist')
const TRANSLATIONS_TS = resolve(here, '../src/lib/translations.ts')

const SITE_ORIGIN = (process.env.VITE_SITE_ORIGIN || 'https://www.goldpeletcips.com').replace(
  /\/$/,
  '',
)
const SITE_NAME = 'Gold Pelet'
const BACKEND = 'https://backend-production-cfda.up.railway.app'

/** Must match PAGES in src/lib/seo.ts. */
const PAGES = [
  { path: '/', key: 'home', priority: '1.0' },
  { path: '/products', key: 'products', priority: '0.9' },
  { path: '/services', key: 'services', priority: '0.8' },
  { path: '/about', key: 'about', priority: '0.7' },
  { path: '/news', key: 'news', priority: '0.6' },
  { path: '/contact', key: 'contact', priority: '0.8' },
]

/** Reads the English table out of the generated module. */
function loadEnglish() {
  const src = readFileSync(TRANSLATIONS_TS, 'utf8')
  const open = src.indexOf('{')
  const close = src.lastIndexOf('} as const')
  const table = JSON.parse(src.slice(open, close + 1))
  return table.en
}

const en = loadEnglish()

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Hero images per page, so a shared link previews the photograph that page
 * actually opens with. Fetched at build time; if the API is unreachable the
 * build still succeeds and the shells simply carry no og:image.
 */
async function fetchHeroImages() {
  const out = {}
  await Promise.all(
    PAGES.map(async ({ key }) => {
      try {
        const res = await fetch(`${BACKEND}/api/v1/public/page-heroes/${key}`, {
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) return
        const hero = await res.json()
        if (hero?.image_url) out[key] = `${BACKEND}${hero.image_url}`
      } catch {
        /* offline or slow — og:image is optional, the rest of the head is not */
      }
    }),
  )
  return out
}

const images = await fetchHeroImages()
const missing = PAGES.filter((p) => !images[p.key]).map((p) => p.key)
if (missing.length) {
  console.log(`prerender: no og:image for ${missing.join(', ')} (API unreachable or unset)`)
}

const template = readFileSync(join(DIST, 'index.html'), 'utf8')

/** Replaces the placeholder head block Vite copied from index.html. */
function shellFor({ path, key }) {
  const title = en[`seo.${key}.title`]
  const description = en[`seo.${key}.description`]
  // Trailing slash kept for '/', matching canonicalFor() and the sitemap.
  const url = `${SITE_ORIGIN}${path}`
  const image = images[key]

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${key === 'home' ? 'website' : 'article'}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:locale" content="en_US" />`,
    image ? `<meta property="og:image" content="${image}" />` : null,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    image ? `<meta name="twitter:image" content="${image}" />` : null,
  ]
    .filter(Boolean)
    .join('\n    ')

  // Order matters: strip the template's placeholder description *before*
  // inserting the new tags. Doing it the other way round makes the non-greedy
  // regex match the description we just wrote and delete that instead, leaving
  // every page carrying the home page's description.
  return template
    .replace(/\s*<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace(/<title>[\s\S]*?<\/title>/, tags)
}

for (const page of PAGES) {
  const dir = page.path === '/' ? DIST : join(DIST, page.path)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), shellFor(page), 'utf8')
}
console.log(`prerender: ${PAGES.length} shells written`)

/**
 * The fallback shell, for paths that match no route.
 *
 * Caddy tries {path} then {path}/index.html before this, and every real route
 * has a shell of its own — so this document is only ever served for a URL that
 * does not exist. Falling back to the home shell instead (the obvious thing,
 * and what the config did first) means a crawler with no JavaScript sees every
 * mistyped URL as a duplicate of the home page, complete with the home
 * canonical. `noindex` is the honest answer.
 *
 * React still mounts and renders the NotFound page as usual.
 */
const notFound = template
  .replace(/\s*<meta\s+name="description"[\s\S]*?\/>/, '')
  .replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${SITE_NAME} — 404</title>\n    <meta name="robots" content="noindex, follow" />`,
  )
writeFileSync(join(DIST, '404.html'), notFound, 'utf8')
console.log('prerender: 404.html written')

// A build stamp rather than the current date on every page: lastmod should say
// when the content changed, and this is the closest honest approximation.
const lastmod = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(
  ({ path, priority }) => `  <url>
    <loc>${SITE_ORIGIN}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
  </url>`,
).join('\n')}
</urlset>
`
writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf8')

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`
writeFileSync(join(DIST, 'robots.txt'), robots, 'utf8')
console.log('prerender: sitemap.xml and robots.txt written')
