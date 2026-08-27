import { useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { useScrollLinked } from '@/components/motion/useScrollLinked'
import { useT } from '@/lib/i18n'
import { copy } from '@/lib/content'

/**
 * The hero product, drawn as SVG and linked 1:1 to scroll position.
 *
 * The transform is computed from `scrollY` on each rAF tick and written
 * straight to the node — never through React state, which would re-render the
 * whole hero sixty times a second for a value only the compositor needs.
 * Only `transform` is touched; nothing here animates layout.
 */
export function PackArt() {
  const { t } = useT()
  const stageRef = useRef<HTMLDivElement>(null)
  const packRef = useRef<SVGSVGElement>(null)
  const reduce = useReducedMotion()

  useScrollLinked((y) => {
    const pack = packRef.current
    const stage = stageRef.current
    if (!pack || !stage) return

    if (reduce) {
      pack.style.transform = ''
      return
    }

    const height = stage.offsetHeight || 1
    const progress = Math.min(1, Math.max(0, y / (height * 1.35)))
    pack.style.transform = `translate3d(0, ${progress * -46}px, 0) scale(${1 - progress * 0.16})`
  })

  return (
    <div className="stage" ref={stageRef}>
      <span className="glow" aria-hidden="true" />
      <svg
        className="pack"
        ref={packRef}
        viewBox="0 0 260 340"
        role="img"
        aria-label={t(copy.packAlt)}
      >
        <defs>
          <linearGradient id="foil" x1="0" y1="0" x2="1" y2=".5">
            <stop offset="0" stopColor="var(--gold-lo)" />
            <stop offset=".34" stopColor="var(--gold)" />
            <stop offset=".52" stopColor="#F7DFA0" />
            <stop offset=".72" stopColor="var(--gold)" />
            <stop offset="1" stopColor="var(--gold-lo)" />
          </linearGradient>
        </defs>

        {/* crimped top seal */}
        <path
          fill="url(#foil)"
          opacity=".92"
          d="M18,6 H242 V24 L227,34 L212,24 L197,34 L182,24 L167,34 L152,24 L137,34 L122,24 L107,34 L92,24 L77,34 L62,24 L47,34 L32,24 L18,32 Z"
        />
        {/* body, with a highlight down the left and a shade down the right */}
        <path fill="url(#foil)" d="M22,28 C13,120 13,226 22,306 L238,306 C247,226 247,120 238,28 Z" />
        <path fill="#FFF" opacity=".16" d="M22,28 C13,120 13,226 22,306 L74,306 C66,226 66,120 74,28 Z" />
        <path fill="#000" opacity=".10" d="M206,28 C214,120 214,226 206,306 L238,306 C247,226 247,120 238,28 Z" />
        {/* crimped bottom seal */}
        <path
          fill="url(#foil)"
          opacity=".92"
          d="M18,334 H242 V316 L227,306 L212,316 L197,306 L182,316 L167,306 L152,316 L137,306 L122,316 L107,306 L92,316 L77,306 L62,316 L47,306 L32,316 L18,308 Z"
        />

        <g fill="#3A2A0A">
          <text
            x="130"
            y="104"
            textAnchor="middle"
            style={{ fontFamily: 'var(--font)', fontSize: '26px', fontWeight: 800, letterSpacing: '-1px' }}
          >
            Gold Pelet
          </text>
          <text
            x="130"
            y="128"
            textAnchor="middle"
            opacity=".72"
            style={{ fontFamily: 'var(--font)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '2.4px' }}
          >
            SALT &amp; SUNFLOWER
          </text>
          <g style={{ color: '#3A2A0A' }} opacity=".5">
            <use href="#g-ridged" x="88" y="148" width="84" height="84" />
          </g>
          <text
            x="130"
            y="268"
            textAnchor="middle"
            opacity=".6"
            style={{ fontFamily: 'var(--font)', fontSize: '10px', fontWeight: 600, letterSpacing: '1.2px' }}
          >
            NET 45 g
          </text>
        </g>
      </svg>
    </div>
  )
}
