import { useEffect } from 'react'

/**
 * Title and robots tag for the admin screens.
 *
 * The public <Seo> lives inside the public layout route, so it is unmounted
 * here — which means whatever it last wrote would otherwise stay in the tab.
 * Navigating /about -> /admin left the title reading "Gold Pelet — 404",
 * because an unrouted path is how Seo treats anything it does not own.
 *
 * noindex is belt-and-braces rather than load-bearing: the admin is behind a
 * token and is neither prerendered nor in the sitemap, so a crawler has no
 * path to it. It costs one tag to be certain.
 */
export function useAdminHead(title: string) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} — Gold Pelet Admin`

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
      // Only remove the tag if this hook is what added it; otherwise hand the
      // public Seo back exactly what it had.
      if (ownsTag) robots?.remove()
      else if (robots) robots.content = previousRobots
    }
  }, [title])
}
