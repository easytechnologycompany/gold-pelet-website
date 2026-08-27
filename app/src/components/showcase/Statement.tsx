import { Reveal } from '@/components/motion/Reveal'
import { formatStat, useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'
import { useT } from '@/lib/i18n'

/**
 * The one full-bleed display moment on the page, now carrying a real figure.
 *
 * It used to read "4×" against a designed sub-line — a number with no source.
 * The live site publishes five `/public/stats` records and shows four of them
 * in a strip; this keeps the design's mega treatment for the headline figure
 * and puts the rest beneath it, so the display moment survives and every
 * number on it is one an admin can edit.
 *
 * Labels come from `stats.<stat_key>.label`, which is how the live site
 * translates them — the CMS label is English only.
 */

/** The figure that gets the mega treatment. The others fill the strip. */
const HEADLINE = 'daily_capacity'

export function Statement() {
  const { cms } = useOverlay()
  const { locale } = useT()
  const stats = useCms((s) => s.stats)

  const headline = stats[HEADLINE]
  const rest = Object.values(stats)
    .filter((s) => s.stat_key !== HEADLINE)
    .sort((a, b) => a.sort_order - b.sort_order)

  if (!headline && !rest.length) return null

  const label = (statKey: string, english: string) => cms(`stats.${statKey}.label`, english)

  return (
    <section className="section statement" id="numbers">
      <div className="bay">
        {headline && (
          <>
            <Reveal as="p" className="mega">
              {formatStat(headline, locale)}
            </Reveal>
            <Reveal as="p" className="lead sub" delay={80}>
              {label(headline.stat_key, headline.label)}
            </Reveal>
          </>
        )}

        {rest.length > 0 && (
          <div className="stat-strip">
            {rest.map((stat, i) => (
              <Reveal key={stat.stat_key} className="stat-cell" delay={140 + i * 55}>
                <span className="num">{formatStat(stat, locale)}</span>
                <span className="cap">{label(stat.stat_key, stat.label)}</span>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
