import { PageHero } from '@/components/layout/PageHero'
import { Reveal } from '@/components/motion/Reveal'
import { ButtonRoute } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useOverlay } from '@/lib/overlay'

/**
 * Services, rebuilt in the redesign's language on the finished site's copy.
 * Every string is a `services.*` key from js/i18n.js, so all four locales come
 * from the same place the live page uses — nothing here is authored locally.
 */

const PILLARS = [
  { icon: 'i-scan', slug: 'dev' },
  { icon: 'i-truck', slug: 'pack' },
  { icon: 'i-cert', slug: 'quality' },
] as const

const STAGES = ['stage1', 'stage2', 'stage3', 'stage4'] as const
const CAPACITY = ['bullet1', 'bullet2', 'bullet3'] as const

export function Services() {
  const { tk } = useOverlay()

  return (
    <main id="top">
      <PageHero page="services" />

      <section className="section bay" id="capabilities">
        <div className="bento">
          {PILLARS.map((p, i) => (
            <Reveal key={p.slug} as="article" className="cell w2" delay={i * 55}>
              <span className="ico">
                <Icon id={p.icon} />
              </span>
              <h3>{tk(`services.${p.slug}.title`)}</h3>
              <p>{tk(`services.${p.slug}.description`)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section bay" id="how">
        <div className="center">
          <Reveal as="p" className="eyebrow">
            {tk('services.how.eyebrow')}
          </Reveal>
          <Reveal as="h2" delay={60}>
            {tk('services.how.h2')}
          </Reveal>
        </div>

        {/* A numbered list, not a grid: these are sequential and the markup
            should say so for anyone reading it with a screen reader. */}
        <ol className="flow">
          {STAGES.map((s, i) => (
            <Reveal key={s} as="li" className="flow-item" delay={i * 60}>
              <span className="flow-num">{tk(`services.${s}.num`)}</span>
              <h3>{tk(`services.${s}.title`)}</h3>
              <p>{tk(`services.${s}.description`)}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="section bay" id="capacity">
        <Reveal as="p" className="eyebrow">
          {tk('services.capacity.eyebrow')}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {tk('services.capacity.h2')}
        </Reveal>
        <Reveal as="p" className="lead" delay={110}>
          {tk('services.capacity.p')}
        </Reveal>
        <ul className="ticks">
          {CAPACITY.map((b, i) => (
            <Reveal key={b} as="li" delay={160 + i * 45}>
              <Icon id="i-leaf" />
              <span>{tk(`services.capacity.${b}`)}</span>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="section cta" id="talk">
        <div className="bay">
          <Reveal as="h2">{tk('services.cta.h2')}</Reveal>
          <Reveal as="p" className="lead" delay={70}>
            {tk('services.cta.p')}
          </Reveal>
          <Reveal className="row" delay={140}>
            <ButtonRoute variant="fill" to="/contact#quote">
              {tk('services.cta.btn')}
            </ButtonRoute>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
