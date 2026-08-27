import { Reveal } from '@/components/motion/Reveal'
import { ButtonLink } from '@/components/ui/Button'
import { copy } from '@/lib/content'
import { useT } from '@/lib/i18n'

export function Cta() {
  const { t } = useT()

  return (
    <section className="section cta" id="trade">
      <div className="bay">
        <Reveal as="h2">{t(copy.ctaHeading)}</Reveal>
        <Reveal as="p" className="lead" delay={70}>
          {t(copy.ctaLead)}
        </Reveal>
        <Reveal className="row" delay={140}>
          <ButtonLink variant="fill" href="#trade">
            {t(copy.ctaPrimary)}
          </ButtonLink>
          <ButtonLink variant="ghost" href="#specs">
            {t(copy.ctaSecondary)}
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  )
}
