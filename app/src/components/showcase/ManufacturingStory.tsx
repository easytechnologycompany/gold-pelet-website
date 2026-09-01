import { Reveal } from '@/components/motion/Reveal'
import { mediaURL } from '@/lib/api'
import { useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'
import { useT } from '@/lib/i18n'
import { copy } from '@/lib/content'

/**
 * The process, in the CMS's own photography — the live site's "From Field to
 * Fryer" section, built from the existing rail (same scroll-snap, radius and
 * hairline) so it reads as part of the system.
 *
 * Each step pairs a `site-images` record the admin manages with the
 * `story.steps.*` keys, so the caption and its description are translated in
 * all four locales while the photograph stays admin-controlled.
 *
 * Renders nothing when the API is unreachable: an empty strip of placeholder
 * frames would be worse than the section simply not being there.
 */

/** Ordered walk through production. `imageKey` is the CMS slot, `stepKey` the
 *  translation stem — the two differ (`frying_fried` vs `frying`), so they are
 *  named separately rather than derived from one another. */
const STEPS = [
  { imageKey: 'story.raw', stepKey: 'raw' },
  { imageKey: 'story.formulation', stepKey: 'formulation' },
  { imageKey: 'story.extrusion', stepKey: 'extrusion' },
  { imageKey: 'story.drying', stepKey: 'drying' },
  { imageKey: 'story.frying_fried', stepKey: 'frying' },
  { imageKey: 'story.ready', stepKey: 'ready' },
] as const

export function ManufacturingStory() {
  const { tk } = useOverlay()
  const { t, locale } = useT()
  const images = useCms((s) => s.images)

  const steps = STEPS.map((step) => ({ ...step, image: images[step.imageKey] })).filter(
    (step) => step.image,
  )

  if (!steps.length) return null

  const digits = locale === 'ar' ? 'ar-EG' : locale

  return (
    <section className="section" id="story" style={{ paddingTop: 0 }}>
      <div className="bay center">
        <Reveal as="p" className="eyebrow">
          {tk('story.eyebrow')}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {tk('story.title')}
        </Reveal>
      </div>

      <div className="bay-wide" style={{ maxWidth: 1320, paddingInline: 0 }}>
        <div className="rail">
          {steps.map((step, i) => (
            <article className="story-card" key={step.imageKey}>
              <div className="frame">
                <img
                  src={mediaURL(step.image!.image_url)}
                  alt={tk(`story.steps.${step.stepKey}.title`)}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="label">
                <span className="step">{new Intl.NumberFormat(digits).format(i + 1)}</span>
                <h3>{tk(`story.steps.${step.stepKey}.title`)}</h3>
                <p>{tk(`story.steps.${step.stepKey}.description`)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <p className="rail-hint">{t(copy.railHint)}</p>
    </section>
  )
}
