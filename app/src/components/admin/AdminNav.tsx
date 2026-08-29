import { NavLink } from 'react-router-dom'
import { useAdminT } from '@/lib/admin-i18n'

/**
 * The admin navigation. One list, rendered once, used by the sidebar on a
 * desktop and by the drawer on anything narrower — the same component in both
 * places rather than two that have to be kept in step.
 *
 * The links are unchanged from when this lived in the top bar: the same
 * routes, the same labels, the same NavLink, so active state, routing and
 * hover behaviour all still come from React Router rather than from anything
 * written here.
 *
 * The grouping is not new either. The old dashboard's sidebar carried exactly
 * these headings, and their keys have been sitting translated in the
 * dictionary since. Twelve items in a horizontal bar could run unlabelled;
 * twelve in a vertical column read better in the five groups they were
 * designed in.
 */

type NavItem = { to: string; key: string }
type NavGroup = { label: string | null; items: readonly NavItem[] }

/** Ported admin pages, grouped as the old dashboard's sidebar grouped them. */
const NAV: readonly NavGroup[] = [
  { label: null, items: [{ to: '/admin/overview', key: 'nav.overview' }] },
  {
    label: 'nav.group.visuals',
    items: [
      { to: '/admin/branding', key: 'nav.branding' },
      { to: '/admin/heroes', key: 'nav.heroes' },
      { to: '/admin/images', key: 'nav.siteImages' },
    ],
  },
  {
    label: 'nav.group.content',
    items: [
      { to: '/admin/content', key: 'nav.content' },
      { to: '/admin/stats', key: 'nav.stats' },
      { to: '/admin/timeline', key: 'nav.timeline' },
      { to: '/admin/certifications', key: 'nav.certifications' },
    ],
  },
  {
    label: 'nav.group.catalog',
    items: [
      { to: '/admin/categories', key: 'nav.categories' },
      { to: '/admin/products', key: 'nav.products' },
    ],
  },
  { label: 'nav.group.news', items: [{ to: '/admin/news', key: 'nav.news' }] },
  { label: 'nav.group.leads', items: [{ to: '/admin/enquiries', key: 'nav.enquiries' }] },
]

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useAdminT()

  return (
    <nav className="admin-nav" aria-label={t('sidebar.menu')}>
      {NAV.map((group, i) => (
        <div className="admin-nav-group" key={group.label ?? `group-${i}`}>
          {group.label && <span className="admin-nav-label">{t(group.label)}</span>}
          <ul>
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                  // Only the drawer passes this, so on a desktop the sidebar
                  // link is a plain link with nothing extra attached.
                  onClick={onNavigate}
                >
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
