import { useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { useScrollLinked } from '@/components/motion/useScrollLinked'
import { useT } from '@/lib/i18n'
import { copy } from '@/lib/content'

/**
 * The hero product shot: ten seconds of pellets going into the oil, linked 1:1
 * to scroll position.
 *
 * This replaces the drawn SVG pack that stood here before. The footage is a
 * process shot rather than a pack shot, so it keeps its own 16:9 frame instead
 * of being cropped into the pack's portrait slot — cropping to that aspect
 * would have thrown away well over half the width of every frame.
 *
 * The scroll behaviour is unchanged from the artwork it replaces: the
 * transform is computed from `scrollY` on each rAF tick and written straight
 * to the node, never through React state, which would re-render the whole hero
 * sixty times a second for a value only the compositor needs. Only `transform`
 * is touched; nothing here animates layout.
 *
 * Muted, looping and inline, because that is the only combination browsers
 * will autoplay — and there is nothing to hear in it anyway, so the encode
 * carries no audio track at all. `poster` matters more than it looks: without
 * one the stage is an empty box until enough of the video has arrived to paint
 * a frame, which on a slow connection is the first thing a visitor sees.
 */
export function HeroFilm() {
  const { t } = useT()
  const stageRef = useRef<HTMLDivElement>(null)
  const filmRef = useRef<HTMLVideoElement>(null)
  // `?? false` because the hook reports null until it has read the media
  // query, and both `autoPlay` and `controls` want a definite boolean.
  const reduce = useReducedMotion() ?? false

  useScrollLinked((y) => {
    const film = filmRef.current
    const stage = stageRef.current
    if (!film || !stage) return

    if (reduce) {
      film.style.transform = ''
      return
    }

    const height = stage.offsetHeight || 1
    const progress = Math.min(1, Math.max(0, y / (height * 1.35)))
    film.style.transform = `translate3d(0, ${progress * -46}px, 0) scale(${1 - progress * 0.16})`
  })

  return (
    <div className="stage" ref={stageRef}>
      <span className="glow" aria-hidden="true" />
      <video
        className="film"
        ref={filmRef}
        src="/pellet-fry.mp4"
        poster="/pellet-fry.jpg"
        /* Reduced motion gets the poster and a play button rather than
           movement it did not ask for — withheld autoplay, not withheld
           content. */
        autoPlay={!reduce}
        controls={reduce}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={t(copy.filmAlt)}
      />
    </div>
  )
}
