import { Link } from 'react-router-dom'
import { useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'
import { useT } from '@/lib/i18n'
import { useProductTypes } from '@/lib/product-types'
import { copy } from '@/lib/content'
import { EasyTechCredit } from '@/components/ui/EasyTechCredit'

/**
 * The finished site's footer, rebuilt in the redesign's language.
 *
 * Every string here comes from one of two real sources: a `footer.*`/`nav.*`
 * translation key the live site already ships in four languages, or a
 * `/public/content` record the admin dashboard owns. Nothing is invented, and
 * the previous designed flavour list ("Salt", "Paprika", "Za'atar") is gone —
 * those products do not exist in the catalogue.
 */

/** Company column — the live footer reuses the nav keys here. */
const COMPANY = [
  { to: '/about', key: 'nav.about' },
  { to: '/services', key: 'nav.services' },
  { to: '/news', key: 'nav.news' },
  { to: '/contact', key: 'nav.contact' },
] as const

/* The Products column's three category links are no longer written here. They
   come from useProductTypes, the same list the header menu reads, so a line
   retired in the admin stops being advertised in the footer instead of leaving
   an anchor to a section /products has stopped rendering. The calculator is
   not a category and stays. */

export function Footer() {
  const { tk, content } = useOverlay()
  const cms = useCms((s) => s.content)
  const productTypes = useProductTypes()

  // `footer.blurb` is prose, so the overlay translates it; the contact values
  // below are facts and deliberately are not translated — an address and a
  // phone number are the same string in every language.
  const blurb = cms['footer.blurb']

  return (
    <footer>
      <div className="bay cols">
        <div>{blurb ? <p className="foot-blurb">{content('footer.blurb', blurb)}</p> : null}</div>

        <div>
          <h4>{tk('footer.heading.company')}</h4>
          <ul>
            {COMPANY.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{tk(l.key)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>{tk('footer.heading.products')}</h4>
          <ul>
            {productTypes.map((type) => (
              <li key={type.slug}>
                <Link to={type.to}>{type.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/products#load-calculator">{tk('footer.link.calculator')}</Link>
            </li>
          </ul>
        </div>

        <ContactColumn />
      </div>

      <div className="bay base">
        <span>{tk('footer.copyright')}</span>
        <FooterCredit />
      </div>
    </footer>
  )
}

/**
 * Real-world facts, all owned by the admin dashboard via `/public/content`.
 * Each line renders only when the CMS actually has that value — there are no
 * placeholder fallbacks here, because a made-up phone number is worse than a
 * missing one.
 */
function ContactColumn() {
  const { tk } = useOverlay()
  const cms = useCms((s) => s.content)

  const email = cms['contact.email']
  const phone = cms['contact.phone_primary']
  const mobile = cms['contact.phone_mobile']
  const website = cms['contact.website']
  const address = cms['contact.address']

  return (
    <div>
      <h4>{tk('footer.heading.contact')}</h4>
      <ul>
        {email && (
          <li>
            <a href={`mailto:${email}`}>{email}</a>
          </li>
        )}
        {phone && (
          <li>
            <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a>
          </li>
        )}
        {mobile && (
          <li>
            <a href={`tel:${mobile.replace(/[^+\d]/g, '')}`}>{mobile}</a>
          </li>
        )}
        {website && (
          <li>
            <a
              href={`https://${website.replace(/^https?:\/\//, '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {website}
            </a>
          </li>
        )}
        {address && (
          <li>
            <span className="foot-address">{address}</span>
          </li>
        )}
      </ul>
    </div>
  )
}

/** The credit, wearing the visitor's language. */
function FooterCredit() {
  const { t } = useT()
  return <EasyTechCredit label={t(copy.poweredBy)} />
}
