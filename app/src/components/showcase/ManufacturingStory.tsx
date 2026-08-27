import { Reveal } from '@/components/motion/Reveal'
import { copy } from '@/lib/content'
import { useT, type Str } from '@/lib/i18n'
import { mediaURL } from '@/lib/api'
import { useCms } from '@/lib/cms'

/**
 * The process, in the CMS's own photography.
 *
 * Not part of the approved design — added so the `site-images` the admin
 * already manages have somewhere to live. It is built from the existing rail
 * (same scroll-snap, radius and hairline) rather than as a new component, so
 * it reads as part of the system.
 *
 * Renders nothing at all when the API is unreachable: an empty strip of
 * placeholder frames would be worse than the section simply not being there.
 */

/** Ordered walk through production. The CMS labels these
 *  "Manufacturing Story - Drying" and so on, but those strings are English
 *  only, so the step names are kept here where all four locales exist. */
const STEPS: { key: string; label: Str }[] = [
  { key: 'story.raw', label: copy.stepRaw },
  { key: 'story.formulation', label: copy.stepFormulation },
  { key: 'story.extrusion', label: copy.stepExtrusion },
  { key: 'story.drying', label: copy.stepDrying },
  { key: 'story.frying_fried', label: copy.stepFrying },
  { key: 'story.ready', label: copy.stepReady },
]

export function ManufacturingStory() {
  const { t, locale } = useT()
  const images = useCms((s) => s.images)

  const steps = STEPS.map((step) => ({ ...step, image: images[step.key] })).filter(
    (step) => step.image,
  )

  if (!steps.length) return null

  const digits = locale === 'ar' || locale === 'ku' ? 'ar-EG' : locale

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="bay center">
        <Reveal as="p" className="eyebrow">
          {t(copy.storyEyebrow)}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {t(copy.storyHeading)}
        </Reveal>
      </div>

      <div className="bay-wide" style={{ maxWidth: 1320, paddingInline: 0 }}>
        <div className="rail">
          {steps.map((step, i) => (
            <article className="story-card" key={step.key}>
              <div className="frame">
                <img
                  src={mediaURL(step.image!.image_url)}
                  alt={step.image!.label}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="label">
                <span className="step">
                  {new Intl.NumberFormat(digits).format(i + 1)}
                </span>
                <h3>{t(step.label)}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>

      <p className="rail-hint">{t(copy.railHint)}</p>
    </section>
  )
}
