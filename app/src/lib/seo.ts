import type { Locale } from './i18n'

/**
 * Per-page metadata, and the values that describe the site as a whole.
 *
 * The titles and descriptions are `seo.*` translation keys, added to
 * js/i18n.js alongside everything else — the live site had them hardcoded in
 * each HTML file in English only, so this is the first time they exist in all
 * four locales.
 */

const PROD_BACKEND_ORIGIN = 'https://backend-production-cfda.up.railway.app'

/**
 * The public origin this site is served from, used for canonical URLs, og:url
 * and the sitemap. Override with VITE_SITE_ORIGIN when deploying somewhere
 * else — a review deploy that claims the production canonical would tell
 * search engines to index the wrong host.
 */
export const SITE_ORIGIN = (
  import.meta.env.VITE_SITE_ORIGIN || 'https://www.goldpeletcips.com'
).replace(/\/$/, '')

export const SITE_NAME = 'Gold Pelet'

export type PageKey = 'home' | 'products' | 'services' | 'about' | 'news' | 'contact'

/** Route path to page key. Kept in one place so the router, the head manager
 *  and the sitemap generator cannot drift apart. */
export const PAGES: { path: string; key: PageKey }[] = [
  { path: '/', key: 'home' },
  { path: '/products', key: 'products' },
  { path: '/services', key: 'services' },
  { path: '/about', key: 'about' },
  { path: '/news', key: 'news' },
  { path: '/contact', key: 'contact' },
]

export const pageKeyForPath = (pathname: string): PageKey | null =>
  PAGES.find((p) => p.path === pathname)?.key ?? null

export const seoKeys = (page: PageKey) => ({
  title: `seo.${page}.title`,
  description: `seo.${page}.description`,
})

/** `og:locale` wants language_TERRITORY. */
export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  ar: 'ar_AR',
  tr: 'tr_TR',
}

/**
 * Absolute URL for an `/uploads/...` path. `mediaURL` in api.ts deliberately
 * returns a relative path in dev so the Vite proxy can handle it, but a social
 * scraper fetching og:image has no proxy — these must always be absolute and
 * always point at the real backend.
 */
export const absoluteMediaURL = (path?: string | null): string => {
  if (!path) return ''
  return path.startsWith('http') ? path : `${PROD_BACKEND_ORIGIN}${path}`
}

/** The home page canonicalises to the origin *with* its trailing slash, which
 *  is what the sitemap lists — the two disagreeing is a self-inflicted
 *  duplicate-URL signal. */
export const canonicalFor = (pathname: string): string => `${SITE_ORIGIN}${pathname}`
