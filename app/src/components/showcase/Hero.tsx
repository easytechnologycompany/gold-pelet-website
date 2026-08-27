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
 * The heading is one CMS string, so the design's two-line split — plain line
 * over gradient line — is derived rather than authored: it breaks at the last
 * sentence boundary when there is one, and otherwise renders as a single line.
 * That keeps the gradient treatment without needing the admin to think about
 * where the line breaks.
 */
export function Hero() {
  const { tk, cms } = useOverlay()
  const hero = useCms((s) => s.heroes.home)

  const kicker = cms('home.hero.eyebrow', hero?.eyebrow ?? '')
  const heading = cms('home.hero.h1', hero?.heading ?? '')
  const lead = cms('home.hero.lede', hero?.subheading ?? '')

  const [first, second] = splitHeading(heading)

  return (
    <section className="hero">
      <div className="bay">
        {kicker && (
          <Reveal as="p" className="kicker">
            {kicker}
          </Reveal>
        )}

        <Reveal as="h1" delay={60}>
          {second ? (
            <>
              <span>{first}</span>
              <br />
              <span className="grad">{second}</span>
            </>
          ) : (
            <span className="grad">{first}</span>
          )}
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

/**
 * Splits on the last comma so the gradient falls on the closing clause, which
 * is where the design put it. Arabic and Kurdish use the same comma character
 * here; Arabic's own `،` is handled too. A heading with no comma stays whole
 * rather than being broken at an arbitrary word.
 */
function splitHeading(heading: string): [string, string | null] {
  const at = Math.max(heading.lastIndexOf(','), heading.lastIndexOf('،'))
  if (at === -1 || at === heading.length - 1) return [heading, null]
  return [heading.slice(0, at + 1), heading.slice(at + 1).trim()]
}
