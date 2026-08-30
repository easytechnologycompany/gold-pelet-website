import { useT } from '@/lib/i18n'
import { copy } from '@/lib/content'

/**
 * The retail pack, shown once on the catalogue page between the intro copy and
 * the ranges themselves — the thing every product below eventually becomes.
 *
 * This is the same drawing that used to open the home page before the frying
 * footage replaced it, recovered rather than redrawn. Being vector matters
 * more here than it did there: it is displayed far larger, it has no
 * whitespace to crop because the artwork fills its own viewBox, and it costs
 * about a kilobyte against a photograph of the same pack.
 *
 * Static, unlike the hero version it came from. That one was tied to scroll
 * position because it was the first thing on the page and had a whole hero to
 * travel through; this sits mid-document as a divider between reading and
 * browsing, where movement would only compete with the cards below it.
 *
 * The chip glyph comes from the global sprite in App, so it is the same
 * artwork the product cards use rather than a second copy of it.
 */
export function PackShot() {
  const { t } = useT()

  return (
    <div className="packshot">
      <span className="glow" aria-hidden="true" />
      <svg className="pack" viewBox="0 0 260 340" role="img" aria-label={t(copy.packAlt)}>
        <defs>
          <linearGradient id="foil-shot" x1="0" y1="0" x2="1" y2=".5">
            <stop offset="0" stopColor="var(--gold-lo)" />
            <stop offset=".34" stopColor="var(--gold)" />
            <stop offset=".52" stopColor="#F7DFA0" />
            <stop offset=".72" stopColor="var(--gold)" />
            <stop offset="1" stopColor="var(--gold-lo)" />
          </linearGradient>
        </defs>

        {/* crimped top seal */}
        <path
          fill="url(#foil-shot)"
          opacity=".92"
          d="M18,6 H242 V24 L227,34 L212,24 L197,34 L182,24 L167,34 L152,24 L137,34 L122,24 L107,34 L92,24 L77,34 L62,24 L47,34 L32,24 L18,32 Z"
        />
        {/* body, with a highlight down the left and a shade down the right */}
        <path fill="url(#foil-shot)" d="M22,28 C13,120 13,226 22,306 L238,306 C247,226 247,120 238,28 Z" />
        <path fill="#FFF" opacity=".16" d="M22,28 C13,120 13,226 22,306 L74,306 C66,226 66,120 74,28 Z" />
        <path fill="#000" opacity=".10" d="M206,28 C214,120 214,226 206,306 L238,306 C247,226 247,120 238,28 Z" />
        {/* crimped bottom seal */}
        <path
          fill="url(#foil-shot)"
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
