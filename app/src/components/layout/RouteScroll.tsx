import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scroll behaviour across route changes.
 *
 * A single-page app keeps the scroll position when the URL changes, so without
 * this you land halfway down a page you have never seen. Two cases:
 *
 *   /about          -> top of the new page
 *   /products#corn  -> that section, cleared of the fixed header
 *
 * The hash case waits a frame: the target element does not exist until the new
 * route has rendered, and querying for it in the same tick always misses.
 *
 * Lenis drives the window's own scroll, so `window.scrollTo` is still the right
 * call here — it stays in sync rather than fighting the smoothing.
 */
export function RouteScroll() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      return
    }

    const id = requestAnimationFrame(() => {
      const target = document.querySelector(hash)
      if (!target) return

      const chrome =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue('--chrome-h'), 10) || 64
      const top = target.getBoundingClientRect().top + window.scrollY - chrome

      window.scrollTo({ top, behavior: 'smooth' })
    })

    return () => cancelAnimationFrame(id)
  }, [pathname, hash])

  return null
}
