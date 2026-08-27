import { Reveal } from '@/components/motion/Reveal'
import { Icon } from '@/components/ui/Icon'
import { useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'
import type { IconId } from '@/lib/sprite-ids'

/**
 * Certifications — the live home page's `home.certs` section.
 *
 * This replaces the designed spec table that used to sit here. That table's
 * moisture, density and shelf-life figures had no CMS counterpart and no
 * source in the business: they were written to fill a layout. The
 * certifications are real records the admin dashboard owns, and the live home
 * page shows them in this position already.
 *
 * Certification names and descriptions are English-only in the database with
 * no overrides in js/i18n.js, so they read the same in all four locales —
 * matching the live site. Only the section heading is translated.
 */

/** The CMS stores an `icon_key` per certification; anything unrecognised falls
 *  back to the generic tick rather than rendering an empty box. */
const CERT_ICON: Record<string, IconId> = {
  'shield-check': 'i-cert',
  'shield-tick': 'i-cert',
  'circle-check': 'i-check',
  'document-check': 'i-scan',
}

export function Certifications() {
  const { tk } = useOverlay()
  const certifications = useCms((s) => s.certifications)

  if (!certifications.length) return null

  return (
    <section className="section bay" id="certifications">
      <div className="center">
        <Reveal as="p" className="eyebrow">
          {tk('home.certs.eyebrow')}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {tk('home.certs.h2')}
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
  )
}
