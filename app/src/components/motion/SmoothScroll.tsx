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

    const lenis = new Lenis({
      duration: 1.05,
      // Critically damped, matching the --spring token's intent: settle,
      // never overshoot.
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      anchors: true,
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
