import { copy } from '@/lib/content'
import { useT } from '@/lib/i18n'
import type { Str } from '@/lib/i18n'

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
  {
    heading: copy.footContact,
    links: [
      { label: copy.footPhone, href: '#trade' },
      { label: copy.footEmail, href: '#trade' },
      { label: copy.footCity, href: '#trade' },
    ],
  },
]

export function Footer() {
  const { t } = useT()

  return (
    <footer>
      <div className="bay cols">
        {COLUMNS.map((col) => (
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
      </div>

      <div className="bay base">
        <span>{t(copy.footCopyright)}</span>
        {/* Every figure on this site is an illustrative placeholder. This line
            stays until real data lands — see CLAUDE.md §4 in the design repo. */}
        <span>{t(copy.footDisclaimer)}</span>
      </div>
    </footer>
  )
}
