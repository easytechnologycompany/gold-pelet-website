import { Reveal } from '@/components/motion/Reveal'
import { useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'

/**
 * The hero for a sub-page, driven entirely by `/public/page-heroes/{page}`.
 *
 * The admin dashboard owns the eyebrow, heading, subheading and photo for each
 * of the six pages, so nothing here is hardcoded: English comes from the CMS
 * record and the other three locales from the overlay's `<page>.hero.*` keys,
 * which are the same keys the live site uses.
 *
 * Deliberately quieter than the home hero — no pack artwork, no gradient
 * split. These pages are read, not admired.
 */

type PageKey = 'products' | 'services' | 'about' | 'news' | 'contact'

/** Home calls its third line `lede`; every other page calls it `p`. */
const heroKeys = (page: PageKey) => ({
  eyebrow: `${page}.hero.eyebrow`,
  heading: `${page}.hero.h1`,
  lead: `${page}.hero.p`,
})

export function PageHero({ page }: { page: PageKey }) {
  const { cms } = useOverlay()
  const hero = useCms((s) => s.heroes[page])
  const key = heroKeys(page)

  const eyebrow = cms(key.eyebrow, hero?.eyebrow ?? '')
  const heading = cms(key.heading, hero?.heading ?? '')
  const lead = cms(key.lead, hero?.subheading ?? '')

  return (
    <section className="hero page-hero">
      <div className="bay">
        {eyebrow && (
          <Reveal as="p" className="eyebrow">
            {eyebrow}
          </Reveal>
        )}
        {heading && (
          <Reveal as="h1" delay={60}>
            {heading}
          </Reveal>
        )}
        {lead && (
          <Reveal as="p" className="lead" delay={130}>
            {lead}
          </Reveal>
        )}
      </div>
    </section>
  )
}
