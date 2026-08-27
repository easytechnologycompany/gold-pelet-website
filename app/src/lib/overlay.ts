import { useMemo } from 'react'
import { useLang, type Locale } from './i18n'
import { TRANSLATIONS } from './translations'

/**
 * The translation overlay — the adapter between the existing backend and the
 * redesigned components.
 *
 * The finished site's database stores **English only**. There is no `name_ar`,
 * no `description_ku`, no translation table: `/public/products`, `/public/news`,
 * `/public/certifications` and the rest each return one untranslated string per
 * field. js/i18n.js says so in its own header comment, and the live responses
 * confirm it.
 *
 * The way the finished site produces four languages is this: cms.js writes the
 * English CMS value into the DOM and stamps a derived `data-i18n` key on the
 * node (`products.<slug>.name`, `stats.<stat_key>.label`, …); i18n.js then
 * overwrites it if that key exists in TRANSLATIONS, and leaves the English in
 * place if it does not. That overlay is the real localisation layer, and this
 * module is the same rule expressed as a function instead of a DOM pass.
 *
 *     API record (English)  ->  derived key  ->  TRANSLATIONS[locale]  ->  text
 *                                                    (else the English value)
 *
 * Nothing here changes the backend or invents copy. A record with no override
 * renders its real English CMS value, which is precisely what the live site
 * shows today for that record in that language.
 */

/** Matches js/i18n.js's `t(key, vars)`: replaces the first `{name}` per var. */
function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  let out = str
  for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v))
  return out
}

/**
 * Resolve `key` for `locale`, falling back to `fallback` (normally the real
 * English value from the API) when the locale has no override.
 */
export function translate(
  locale: Locale,
  key: string | null | undefined,
  fallback: string,
  vars?: Record<string, string | number>,
): string {
  if (!key) return interpolate(fallback, vars)

  const value = TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS.en?.[key]
  if (value === undefined) {
    // Parity with applyTranslations(): a gap is loud in development but never
    // blanks the page — the English CMS text stays.
    if (import.meta.env.DEV && locale !== 'en' && fallback === '') {
      console.warn(`[overlay] missing "${key}" for locale "${locale}"`)
    }
    return interpolate(fallback, vars)
  }
  return interpolate(value, vars)
}

/**
 * Keys derived from CMS records. Ported verbatim from cms.js so that a string
 * translated on the live site is translated here, and one that is not stays
 * identical in both. Changing a pattern here silently drops translations.
 */
export const overlayKey = {
  productName: (slug: string) => `products.${slug}.name`,
  productDescription: (slug: string) => `products.${slug}.description`,
  categoryName: (slug: string) => `categories.${slug}.name`,
  categoryDescription: (slug: string) => `categories.${slug}.description`,
  statLabel: (statKey: string) => `stats.${statKey}.label`,
  content: (contentKey: string) => `content.${contentKey}`,
}

/**
 * Content keys that are prose and therefore translated. The rest of
 * `/public/content` is fact — an email, a phone number, an address — which is
 * the same string in every language, and translating it would corrupt real
 * contact data. This set is copied from cms.js's TRANSLATABLE_CONTENT_KEYS.
 */
export const TRANSLATABLE_CONTENT_KEYS: ReadonlySet<string> = new Set([
  'about.story.heading',
  'about.story.para1',
  'about.story.para2',
  'footer.blurb',
])

export type Overlay = {
  locale: Locale
  /** Static UI copy that lives only in TRANSLATIONS (nav, labels, headings). */
  tk: (key: string, vars?: Record<string, string | number>) => string
  /** A CMS field: the derived key when one exists, else the real English value. */
  cms: (key: string | null | undefined, english: string) => string
  /** A `/public/content` value, translated only if the key is prose. */
  content: (contentKey: string, value: string) => string
}

/**
 * One deliberate deviation from the live site, worth stating plainly.
 *
 * `applyTranslations()` runs for every locale including English, so on the
 * live site a `products.<slug>.name` override silently outranks the database:
 * rename a product in the admin dashboard and the English page still shows the
 * hardcoded string. Page heroes do the opposite — `applyPageHero()` returns
 * early for non-English, so English there is admin-owned.
 *
 * Here English is admin-owned everywhere. The dashboard is meant to control
 * the site, and a CMS edit that cannot appear is a bug, not a feature. The
 * overlay therefore supplies ar/ku/tr only, and falls back to the real English
 * CMS value when a locale has no override — never to invented copy.
 */
function resolveCms(locale: Locale, key: string | null | undefined, english: string): string {
  // API unreachable or the field is genuinely blank: the overlay's own English
  // is a verbatim copy of the live site's text, so it is the honest fallback.
  if (!english) return translate(locale, key, '')
  return locale === 'en' ? english : translate(locale, key, english)
}

export function useOverlay(): Overlay {
  const locale = useLang((s) => s.locale)

  return useMemo(
    () => ({
      locale,
      tk: (key, vars) => translate(locale, key, key, vars),
      cms: (key, english) => resolveCms(locale, key, english),
      content: (contentKey, value) =>
        TRANSLATABLE_CONTENT_KEYS.has(contentKey)
          ? resolveCms(locale, overlayKey.content(contentKey), value)
          : value,
    }),
    [locale],
  )
}
