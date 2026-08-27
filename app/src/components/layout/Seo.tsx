import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'
import {
  OG_LOCALE,
  SITE_NAME,
  absoluteMediaURL,
  canonicalFor,
  pageKeyForPath,
  seoKeys,
} from '@/lib/seo'

/**
 * Keeps the document head in step with the route and the active locale.
 *
 * The build also writes a static shell per route (scripts/prerender.mjs), so a
 * crawler that does not run JavaScript already receives the right title,
 * description and Open Graph tags. This component is what keeps them correct
 * once React takes over — on client-side navigation, and when the visitor
 * switches language, neither of which the static shell can know about.
 *
 * A note on hreflang: it is deliberately absent. hreflang annotates *distinct
 * URLs* for the same content in different languages, and this site has none —
 * locale is a stored preference, not part of the path. Emitting hreflang for
 * URLs that serve all four languages would be a lie. See the README.
 */
export function Seo() {
  const { pathname } = useLocation()
  const { tk, locale } = useOverlay()
  const heroes = useCms((s) => s.heroes)
  const branding = useCms((s) => s.branding)

  useEffect(() => {
    const page = pageKeyForPath(pathname)

    // An unrouted path is the 404. Tell crawlers not to index it rather than
    // leaving the previous page's metadata in place.
    if (!page) {
      setTitle(`${SITE_NAME} — 404`)
      setMeta('name', 'robots', 'noindex, follow')
      removeManaged(['description', 'og:', 'twitter:'])
      setLink('canonical', null)
      return
    }

    const keys = seoKeys(page)
    const title = tk(keys.title)
    const description = tk(keys.description)
    const url = canonicalFor(pathname)

    // The page's own hero photograph is the most honest share image there is —
    // it is what the visitor lands on. Falls back to the brand logo.
    const image = absoluteMediaURL(heroes[page]?.image_url ?? branding?.logo_url ?? null)

    setTitle(title)
    setMeta('name', 'robots', 'index, follow')
    setMeta('name', 'description', description)
    setLink('canonical', url)

    setMeta('property', 'og:type', page === 'home' ? 'website' : 'article')
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:locale', OG_LOCALE[locale])
    setMeta('property', 'og:image', image || null)

    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image || null)
  }, [pathname, locale, tk, heroes, branding])

  return null
}

/* ---------------- head helpers ----------------
   Every tag written here carries data-seo so it can be found and updated in
   place on the next route change. Without that marker each navigation would
   append a second copy, and a crawler reading the first one would see stale
   metadata. */

const MANAGED = 'data-seo'

function setTitle(value: string) {
  if (document.title !== value) document.title = value
}

function setMeta(attr: 'name' | 'property', key: string, content: string | null) {
  const selector = `meta[${attr}="${CSS.escape(key)}"]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)

  if (content === null) {
    if (el?.hasAttribute(MANAGED)) el.remove()
    return
  }

  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  // Stamp the marker even when reusing a tag that came from the prerendered
  // shell. Without this, a shell's own <meta name="description"> stays
  // unmanaged forever and the 404 route cannot clear it — the visitor gets the
  // home page's description on a page that does not exist.
  el.setAttribute(MANAGED, '')
  if (el.content !== content) el.content = content
}

function setLink(rel: string, href: string | null) {
  // Not scoped to [data-seo]: the prerendered shell ships its own canonical,
  // and a second one appended beside it would leave the page declaring two.
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (href === null) {
    el?.remove()
    return
  }

  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.setAttribute(MANAGED, '')
  if (el.href !== href) el.href = href
}

/** Drops managed tags whose key starts with any of the given prefixes. */
function removeManaged(prefixes: string[]) {
  document.head.querySelectorAll<HTMLMetaElement>(`meta[${MANAGED}]`).forEach((el) => {
    const key = el.getAttribute('name') ?? el.getAttribute('property') ?? ''
    if (prefixes.some((p) => key.startsWith(p))) el.remove()
  })
}
