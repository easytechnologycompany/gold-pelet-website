import { Reveal } from '@/components/motion/Reveal'
import { copy } from '@/lib/content'
import { useT } from '@/lib/i18n'

/** The one full-bleed display moment on the page: a single number, at the
 *  largest size in the scale, with the tightest tracking. */
export function Statement() {
  const { t } = useT()

  return (
    <section className="section statement" id="story">
      <div className="bay">
        <Reveal as="p" className="mega">
          {t(copy.statementMega)}
        </Reveal>
        <Reveal as="p" className="lead sub" delay={80}>
          {t(copy.statementSub)}
        </Reveal>
      </div>
    </section>
  )
}
