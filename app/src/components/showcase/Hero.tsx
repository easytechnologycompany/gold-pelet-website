import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { ChevronLink } from '@/components/ui/ChevronLink'
import { useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'
import { PackArt } from './PackArt'

/**
 * The home hero, driven by the `home` page-hero record. English comes from the
 * admin dashboard, the other three locales from the `home.hero.*` keys.
 *
 * The whole heading carries the gradient. It used to split at the last comma
 * so only the closing clause was gold, but that made the treatment depend on
 * where an admin happened to punctuate — and a heading with no comma got no
 * gradient at all. One span over the full string is both simpler and stable
 * across all four locales, whatever the CMS holds.
 */
export function Hero() {
  const { tk, cms } = useOverlay()
  const hero = useCms((s) => s.heroes.home)

  const kicker = cms('home.hero.eyebrow', hero?.eyebrow ?? '')
  const heading = cms('home.hero.h1', hero?.heading ?? '')
  const lead = cms('home.hero.lede', hero?.subheading ?? '')

  return (
    <section className="hero">
      <div className="bay">
        {kicker && (
          <Reveal as="p" className="kicker">
            {kicker}
          </Reveal>
        )}

        <Reveal as="h1" delay={60}>
          <span className="grad">{heading}</span>
        </Reveal>

        {lead && (
          <Reveal as="p" className="lead" delay={130}>
            {lead}
          </Reveal>
        )}

        <Reveal as="p" className="links" delay={190}>
          <ChevronLink href="#range" label={tk('home.products.eyebrow')} />
          <Link className="chev" to="/services">
            {tk('home.hero.cta.solutions')}
          </Link>
        </Reveal>
      </div>

      <PackArt />
    </section>
  )
}

