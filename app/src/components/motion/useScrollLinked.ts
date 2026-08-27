import { useEffect, useRef } from 'react'

/**
 * Runs `onFrame(scrollY)` on a requestAnimationFrame tick, coalesced so a
 * burst of scroll events produces one write per frame.
 *
 * This is deliberately not a keyframed animation and not a motion-library
 * scroll trigger: the hero pack's transform is derived 1:1 from scroll
 * position, so it tracks the finger continuously and reverses the instant
 * the scroll does. Keep it that way (CLAUDE.md §2).
 */
export function useScrollLinked(onFrame: (scrollY: number) => void) {
  const cb = useRef(onFrame)

  useEffect(() => {
    cb.current = onFrame
  })

  useEffect(() => {
    let ticking = false

    const frame = () => {
      ticking = false
      cb.current(window.scrollY)
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(frame)
    }

    frame() // settle the initial position before the first scroll
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
}
