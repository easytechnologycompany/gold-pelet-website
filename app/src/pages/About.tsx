import { PageHero } from '@/components/layout/PageHero'
import { Reveal } from '@/components/motion/Reveal'
import { ButtonRoute } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'
import type { IconId } from '@/lib/sprite-ids'

/**
 * About Us. Two of the three sections are live records the admin dashboard
 * owns — the timeline and the certifications list — so they render from the
 * CMS and disappear entirely when it has nothing, rather than showing invented
 * history. Section headings and the leadership cards are `about.*` keys.
 *
 * Neither the timeline nor the certifications table has a translation column,
 * and neither has overrides in js/i18n.js, so those records read in English in
 * every locale. That is exactly what the live site shows today; fixing it means
 * adding translation columns to the backend, which is out of scope here.
 */

const LEADERSHIP = ['card1', 'card2', 'card3'] as const

/** The CMS stores an `icon_key` per certification; anything unrecognised falls
 *  back to the generic tick rather than rendering an empty box. */
const CERT_ICON: Record<string, IconId> = {
  'shield-check': 'i-cert',
  'shield-tick': 'i-cert',
  'circle-check': 'i-check',
  'document-check': 'i-scan',
}

export function About() {
  const { tk } = useOverlay()
  const milestones = useCms((s) => s.milestones)
  const certifications = useCms((s) => s.certifications)

  return (
    <main id="top">
      <PageHero page="about" />

      {milestones.length > 0 && (
        <section className="section bay" id="milestones">
          <Reveal as="p" className="eyebrow">
            {tk('about.milestones.eyebrow')}
          </Reveal>
          <Reveal as="h2" delay={60}>
            {tk('about.milestones.h2')}
          </Reveal>

          <dl className="specs">
            {milestones.map((m, i) => (
              <Reveal key={m.id} className="spec" delay={i * 45}>
                <dt>{m.year_label}</dt>
                <dd>
                  <strong>{m.title}</strong>
                  {m.description ? <span>{m.description}</span> : null}
                </dd>
              </Reveal>
            ))}
          </dl>
        </section>
      )}

      {certifications.length > 0 && (
        <section className="section bay" id="certifications">
          <div className="center">
            <Reveal as="p" className="eyebrow">
              {tk('about.certifications.eyebrow')}
            </Reveal>
            <Reveal as="h2" delay={60}>
              {tk('about.certifications.h2')}
            </Reveal>
          </div>

          <div className="bento">
            {certifications.map((c, i) => (
              <Reveal key={c.id} as="article" className="cell w3" delay={i * 55}>
                <span className="ico">
                  <Icon id={CERT_ICON[c.icon_key] ?? 'i-check'} />
                </span>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="section bay" id="team">
        <Reveal as="p" className="eyebrow">
          {tk('about.leadership.eyebrow')}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {tk('about.leadership.h2')}
        </Reveal>
        <Reveal as="p" className="lead" delay={110}>
          {tk('about.leadership.p')}
        </Reveal>

        <div className="bento">
          {LEADERSHIP.map((c, i) => (
            <Reveal key={c} as="article" className="cell w2" delay={160 + i * 55}>
              <h3>{tk(`about.leadership.${c}.title`)}</h3>
              <p>{tk(`about.leadership.${c}.description`)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section cta" id="visit">
        <div className="bay">
          <Reveal as="h2">{tk('about.cta.h2')}</Reveal>
          <Reveal as="p" className="lead" delay={70}>
            {tk('about.cta.p')}
          </Reveal>
          <Reveal className="row" delay={140}>
            <ButtonRoute variant="fill" to="/contact">
              {tk('about.cta.btn')}
            </ButtonRoute>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
