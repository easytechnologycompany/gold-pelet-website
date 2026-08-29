import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { clearToken } from '@/lib/admin'
import { useAdminT } from '@/lib/admin-i18n'
import { LangSwitch } from './LangSwitch'
import { useAdminHead } from './useAdminHead'

/**
 * Chrome for the admin screens.
 *
 * The public site's header (components/layout/Chrome) is deliberately not
 * reused: it carries the marketing nav, the visitor's language switcher and
 * the quote CTA, none of which belong over a data table, and it is
 * fixed-position with a blur that would sit on top of the modal. This is the
 * same visual language — same tokens, same button skin — with only what an
 * operator needs.
 *
 * The nav lists only the pages that exist. The old dashboard's sidebar has
 * twelve items; reproducing it while ten of those pages are unported would
 * be ten dead links, so entries appear here as they are built. The language
 * switcher and Sign Out, which lived in that sidebar's footer, move up into
 * the bar.
 */

/** Ported admin pages, in the old sidebar's Catalog order. */
const NAV = [
  { to: '/admin/branding', key: 'nav.branding' },
  { to: '/admin/heroes', key: 'nav.heroes' },
  { to: '/admin/content', key: 'nav.content' },
  { to: '/admin/images', key: 'nav.siteImages' },
  { to: '/admin/categories', key: 'nav.categories' },
  { to: '/admin/products', key: 'nav.products' },
  { to: '/admin/news', key: 'nav.news' },
  { to: '/admin/stats', key: 'nav.stats' },
  { to: '/admin/timeline', key: 'nav.timeline' },
  { to: '/admin/certifications', key: 'nav.certifications' },
] as const
export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  const navigate = useNavigate()
  const t = useAdminT()
  useAdminHead(title)

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="admin-bar-inner">
          <span className="admin-brand">
            <span className="admin-brand-mark" aria-hidden="true">
              GP
            </span>
            <span className="admin-brand-text">
              Gold Pelet <span>{t('sidebar.admin')}</span>
            </span>
          </span>
          <nav className="admin-nav" aria-label={t('nav.group.catalog')}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="admin-bar-actions">
            <LangSwitch />
            <Button
              variant="ghost"
              className="admin-signout"
              onClick={() => {
                clearToken()
                navigate('/admin/login', { replace: true })
              }}
            >
              {t('sidebar.signOut')}
            </Button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-head">
          <div className="admin-head-text">
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="admin-head-actions">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}
