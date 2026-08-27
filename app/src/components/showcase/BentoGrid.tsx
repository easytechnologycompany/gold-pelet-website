import { Reveal } from '@/components/motion/Reveal'
import { Icon } from '@/components/ui/Icon'
import { copy } from '@/lib/content'
import { useT } from '@/lib/i18n'
import { formatStat, useCms } from '@/lib/cms'
import { mediaURL } from '@/lib/api'
import { bento, type BentoCell, type GlyphId } from '@/lib/products'
import { cn } from '@/lib/utils'

/**
 * Asymmetric credential grid. Column counts are pinned per breakpoint rather
 * than left to `auto-fit`: seven cells in a six-column auto-fit grid left a
 * dead cell that read as a bug.
 *
 * Two cells read live values from the CMS when it is reachable — the daily
 * capacity figure and the certifications list. Every other cell states a
 * process fact with no CMS counterpart and stays as designed.
 */
export function BentoGrid() {
  const { t } = useT()

  return (
    <section className="section bay" id="made">
      <div className="center">
        <Reveal as="p" className="eyebrow">
          {t(copy.bentoEyebrow)}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {t(copy.bentoHeading)}
        </Reveal>
      </div>

      <div className="bento">
        {bento.map((cell, i) => (
          <Reveal key={i} as="article" className={cn('cell', cell.cls)} delay={i * 55}>
            <CellHead cell={cell} />
            <p>{t(cell.p)}</p>
            {cell.kind === 'art' && <CellArt glyph={cell.glyph} />}
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/**
 * The art cell shows the factory floor when the CMS has a photograph for it,
 * and the hand-drawn crisp when it does not. Bleeding the image to the cell's
 * edges is what stops it reading as a picture pasted into a card.
 */
function CellArt({ glyph }: { glyph: GlyphId }) {
  const image = useCms((s) => s.images['split.home_capacity'])

  if (image) {
    return (
      <div className="shot-art">
        <img src={mediaURL(image.image_url)} alt={image.label} loading="lazy" decoding="async" />
      </div>
    )
  }

  return (
    <svg className="art" viewBox="0 0 200 200" aria-hidden="true">
      <use href={`#${glyph}`} />
    </svg>
  )
}

function CellHead({ cell }: { cell: BentoCell }) {
  const { t, locale } = useT()
  const stats = useCms((s) => s.stats)
  const certifications = useCms((s) => s.certifications)

  if (cell.kind === 'num') {
    const live = cell.statKey ? stats[cell.statKey] : undefined
    return (
      <>
        <span className="num">{live ? formatStat(live, locale) : cell.num}</span>
        <span className="cap">{t(cell.cap)}</span>
      </>
    )
  }

  if (cell.kind === 'ico') {
    // The CMS holds certification names only — no translations — so the
    // designed (and localized) heading stands whenever the list is empty.
    const live =
      cell.fromCertifications && certifications.length
        ? certifications.map((c) => c.name).join(' · ')
        : null

    return (
      <>
        <span className="ico">
          <Icon id={cell.icon} size={24} />
        </span>
        <h3>{live ?? t(cell.h)}</h3>
      </>
    )
  }

  return <h3>{t(cell.h)}</h3>
}
