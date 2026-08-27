import { Reveal } from '@/components/motion/Reveal'
import { copy } from '@/lib/content'
import { useT } from '@/lib/i18n'
import { specs } from '@/lib/products'

/** Trade detail as a definition list — the one place on the page where the
 *  content is dense on purpose. */
export function Specs() {
  const { t } = useT()

  return (
    <section className="section bay" id="specs">
      <Reveal as="p" className="eyebrow">
        {t(copy.specsEyebrow)}
      </Reveal>
      <Reveal as="h2" delay={60}>
        {t(copy.specsHeading)}
      </Reveal>

      <dl className="specs">
        {specs.map((spec, i) => (
          <Reveal key={spec.k.en} className="spec" delay={i * 35}>
            <dt>{t(spec.k)}</dt>
            <dd>{t(spec.v)}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  )
}
