import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { Icon } from '@/components/ui/Icon'
import { mediaURL } from '@/lib/api'
import { formatStat, useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'
import { useT } from '@/lib/i18n'
import type { IconId } from '@/lib/sprite-ids'

/**
 * Manufacturing capacity — the live site's `home.capacity` section, in the
 * redesign's bento language.
 *
 * Every cell is now sourced: the three claims are `home.capacity.bullet*`, the
 * photograph is the `split.home_capacity` image the admin manages, and the
 * peak-output figure is the `daily_capacity` stat. The seven designed cells
 * that used to fill this grid stated process facts with no CMS counterpart and
 * have been dropped.
 */

const BULLETS: { key: string; icon: IconId }[] = [
  { key: 'home.capacity.bullet1', icon: 'i-scan' },
  { key: 'home.capacity.bullet2', icon: 'i-check' },
  { key: 'home.capacity.bullet3', icon: 'i-truck' },
]

export function BentoGrid() {
  const { tk, cms } = useOverlay()
  const { locale } = useT()
  const image = useCms((s) => s.images['split.home_capacity'])
  const peak = useCms((s) => s.stats.daily_capacity)

  return (
    <section className="section bay" id="made">
      <div className="center">
        <Reveal as="p" className="eyebrow">
          {tk('home.capacity.eyebrow')}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {tk('home.capacity.h2')}
        </Reveal>
        <Reveal as="p" className="lead" delay={110}>
          {tk('home.capacity.p')}
        </Reveal>
      </div>

      <div className="bento">
        {BULLETS.map((b, i) => (
          <Reveal key={b.key} as="article" className="cell w2" delay={i * 55}>
            <span className="ico">
              <Icon id={b.icon} />
            </span>
            <p>{tk(b.key)}</p>
          </Reveal>
        ))}

        {peak && (
          <Reveal as="article" className="cell w2 tint" delay={165}>
            <span className="num">{formatStat(peak, locale)}</span>
            <span className="cap">{tk('home.capacity.peakOutput')}</span>
            <Link className="chev" to="/services">
              {tk('home.capacity.cta')}
            </Link>
          </Reveal>
        )}

        {image && (
          <Reveal as="article" className="cell w4" delay={220}>
            {/* Bleeding the photograph to the cell's edges is what stops it
                reading as a picture pasted into a card. */}
            <div className="shot-art">
              <img
                src={mediaURL(image.image_url)}
                alt={cms(null, image.label)}
                loading="lazy"
                decoding="async"
              />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}
