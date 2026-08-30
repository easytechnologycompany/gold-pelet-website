import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { ChevronLink } from '@/components/ui/ChevronLink'
import { useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'
import { HeroFilm } from './HeroFilm'

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
  /* The headline comes from the repo, not the CMS.
     Every other field on this hero still comes from the dashboard; this one
     is set here because it is the page's one piece of display typography and
     its length is load-bearing -- it is sized and wrapped against a measured
     column, and a longer string silently costs a line. */
  const heading = tk('home.hero.h1')
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
          {heading}
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

        <HeroFilm />
      </div>
    </section>
  )
}

