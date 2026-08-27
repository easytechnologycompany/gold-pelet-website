import { copy } from '@/lib/content'
import { useT } from '@/lib/i18n'
import type { Str } from '@/lib/i18n'
import { useCms } from '@/lib/cms'

type Column = { heading: Str; links: { label: Str; href: string }[] }

const COLUMNS: Column[] = [
  {
    heading: copy.footProducts,
    links: [
      { label: copy.footSalt, href: '#range' },
      { label: copy.footPaprika, href: '#range' },
      { label: copy.footRings, href: '#range' },
      { label: copy.footZaatar, href: '#range' },
    ],
  },
  {
    heading: copy.footCompany,
    links: [
      { label: copy.footOverview, href: '#story' },
      { label: copy.footManufacturing, href: '#made' },
      { label: copy.footSpecifications, href: '#specs' },
    ],
  },
  {
    heading: copy.footTrade,
    links: [
      { label: copy.footDistributor, href: '#trade' },
      { label: copy.footPrivateLabel, href: '#trade' },
      { label: copy.footSamples, href: '#trade' },
    ],
  },
]

export function Footer() {
  const { t } = useT()
  const products = useCms((s) => s.products)
  const categories = useCms((s) => s.categories)

  // With a live catalogue the designed flavour list is fiction — swap it for
  // the real ranges. Categories rather than products: twelve product names
  // would overrun the column.
  const liveCategories = Object.values(categories).sort((a, b) => a.sort_order - b.sort_order)
  const columns: Column[] =
    products.length && liveCategories.length
      ? [
          {
            heading: copy.footProducts,
            links: liveCategories.map((c) => ({ label: { en: c.name }, href: '#range' })),
          },
          ...COLUMNS.slice(1),
        ]
      : COLUMNS

  return (
    <footer>
      <div className="bay cols">
        {columns.map((col) => (
          <div key={col.heading.en}>
            <h4>{t(col.heading)}</h4>
            <ul>
              {col.links.map((link) => (
                <li key={link.label.en}>
                  <a href={link.href}>{t(link.label)}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <ContactColumn />
      </div>

      <div className="bay base">
        <span>{t(copy.footCopyright)}</span>
        {/* Parts of this page are live CMS data now, but the spec table and
            the process figures are still invented, so the disclaimer stands
            until those are real too — see CLAUDE.md §4 in the design repo. */}
        <span>{t(copy.footDisclaimer)}</span>
      </div>
    </footer>
  )
}

/**
 * The one column where every value is a real-world fact, so it reads from
 * the CMS's `global` content keys and only falls back to the designed
 * placeholders when the API is unreachable.
 *
 * Worth knowing: the real contact data is Turkish (+90, Gaziantep). The
 * designed placeholders said Baghdad and +964, so this is a correction, not
 * just an enrichment.
 */
function ContactColumn() {
  const { t } = useT()
  const content = useCms((s) => s.content)

  const phone = content['contact.phone_primary']
  const mobile = content['contact.phone_mobile']
  const email = content['contact.email']
  const address = content['contact.address']
  const website = content['contact.website']

  const live = Boolean(phone || email || address)

  return (
    <div>
      <h4>{t(copy.footContact)}</h4>
      <ul>
        {live ? (
          <>
            {phone && (
              <li>
                <a href={`tel:${phone.replace(/\s+/g, '')}`}>{phone}</a>
              </li>
            )}
            {mobile && (
              <li>
                <a href={`tel:${mobile.replace(/\s+/g, '')}`}>{mobile}</a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            )}
            {website && (
              <li>
                <a href={`https://${website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer">
                  {website}
                </a>
              </li>
            )}
            {address && (
              <li>
                <a href="#trade">{address}</a>
              </li>
            )}
          </>
        ) : (
          <>
            <li>
              <a href="#trade">{t(copy.footPhone)}</a>
            </li>
            <li>
              <a href="#trade">{t(copy.footEmail)}</a>
            </li>
            <li>
              <a href="#trade">{t(copy.footCity)}</a>
            </li>
          </>
        )}
      </ul>
    </div>
  )
}
