import { useEffect } from 'react'
import { RTL, useLang } from '@/lib/i18n'
import { useAdminLang } from '@/lib/admin-i18n'

/**
 * Title, robots tag and `<html lang>` for the admin screens.
 *
 * The public <Seo> lives inside the public layout route, so it is unmounted
 * here — which means whatever it last wrote would otherwise stay in the tab.
 * Navigating /about -> /admin left the title reading "Gold Pelet — 404",
 * because an unrouted path is how Seo treats anything it does not own.
 *
 * `lang` needs the same treatment for a subtler reason: LocaleProvider sets
 * it from the *visitor's* locale and wraps the admin too, but the admin has
 * its own operator locale. Whichever wrote last would win, so this one takes
 * ownership while an admin screen is mounted and restores the visitor's on
 * the way out. `dir` is deliberately untouched — both admin locales are
 * Latin and LTR, so there is nothing to flip, and writing it would fight
 * LocaleProvider for no benefit.
 *
 * noindex is belt-and-braces rather than load-bearing: the admin is behind a
 * token and is neither prerendered nor in the sitemap, so a crawler has no
 * path to it. It costs one tag to be certain.
 */
export function useAdminHead(title: string) {
  const adminLocale = useAdminLang((s) => s.locale)
  const siteLocale = useLang((s) => s.locale)

  useEffect(() => {
    const root = document.documentElement
    const previousTitle = document.title
    document.title = `${title} — Gold Pelet Admin`
    root.lang = adminLocale

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const ownsTag = !robots
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    const previousRobots = robots.content
    robots.content = 'noindex, nofollow'

    return () => {
      document.title = previousTitle
      // Hand the document back to LocaleProvider's model, rather than to
      // whatever `lang` happened to be when this mounted: the visitor may
      // have switched languages while the admin was open.
      root.lang = siteLocale
      root.dir = RTL.has(siteLocale) ? 'rtl' : 'ltr'
      // Only remove the tag if this hook is what added it; otherwise hand the
      // public Seo back exactly what it had.
      if (ownsTag) robots?.remove()
      else if (robots) robots.content = previousRobots
    }
  }, [title, adminLocale, siteLocale])
}
