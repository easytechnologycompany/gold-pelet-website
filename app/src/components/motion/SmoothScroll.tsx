import { useEffect } from 'react'
import Lenis from 'lenis'
import { useReducedMotion } from 'motion/react'

/**
 * Lenis, driving the window's own scroll — so `window.scrollY` stays the
 * source of truth and the scroll-linked hero pack keeps working unchanged.
 *
 * Switched off entirely under prefers-reduced-motion: smoothed scrolling has
 * no gentler equivalent, and the honest degradation is the browser's native
 * scroll.
 */
export function SmoothScroll() {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return

    // Read from the token rather than repeating the number, so the offset
    // cannot drift out of step with the header's actual height.
    const chromeHeight =
      parseInt(getComputedStyle(document.documentElement).getPropertyValue('--chrome-h'), 10) || 64

    const lenis = new Lenis({
      duration: 1.05,
      // Critically damped, matching the --spring token's intent: settle,
      // never overshoot.
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      // Stop short of the target by the height of the fixed chrome, which
      // would otherwise cover the heading you just navigated to. The CSS
      // `scroll-padding-top` does the same for the native scroll path.
      anchors: { offset: -chromeHeight },
    })

    let id = requestAnimationFrame(function raf(time: number) {
      lenis.raf(time)
      id = requestAnimationFrame(raf)
    })

    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
    }
  }, [reduce])

  return null
}
