import { Reveal } from '@/components/motion/Reveal'
import { ChevronLink } from '@/components/ui/ChevronLink'
import { copy } from '@/lib/content'
import { useT } from '@/lib/i18n'
import { PackArt } from './PackArt'

export function Hero() {
  const { t } = useT()

  return (
    <section className="hero">
      <div className="bay">
        <Reveal as="p" className="kicker">
          {t(copy.heroKicker)}
        </Reveal>

        <Reveal as="h1" delay={60}>
          <span>{t(copy.heroLine1)}</span>
          <br />
          <span className="grad">{t(copy.heroLine2)}</span>
        </Reveal>

        <Reveal as="p" className="lead" delay={130}>
          {t(copy.heroLead)}
        </Reveal>

        <Reveal as="p" className="links" delay={190}>
          <ChevronLink href="#range" label={t(copy.heroLinkProducts)} />
          <ChevronLink href="#trade" label={t(copy.heroLinkTrade)} />
        </Reveal>
      </div>

      <PackArt />
    </section>
  )
}
