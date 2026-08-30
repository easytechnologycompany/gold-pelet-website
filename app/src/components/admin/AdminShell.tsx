import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { clearToken } from '@/lib/admin'
import { useAdminT } from '@/lib/admin-i18n'
import { AdminNav } from './AdminNav'
import { LangSwitch } from './LangSwitch'
import { useAdminHead } from './useAdminHead'

/**
 * Chrome for the admin screens: a sidebar on the left and the page beside it.
 *
 * The public site's header (components/layout/Chrome) is deliberately not
 * reused: it carries the marketing nav, the visitor's language switcher and
 * the quote CTA, none of which belong over a data table, and it is
 * fixed-position with a blur that would sit on top of the modal. This is the
 * same visual language — same tokens, same button skin — with only what an
 * operator needs.
 *
 * The navigation itself moved out to AdminNav and did not otherwise change:
 * the same routes, the same labels, the same NavLink, so active state,
 * routing and hover all still come from React Router. This file only decides
 * where that nav sits.
 *
 * Below 1024px the sidebar becomes an off-canvas drawer behind a toggle,
 * which is the pattern the old dashboard used for the same twelve links
 * (initMobileSidebar in admin/js/api.js): a bar carrying the brand and a
 * button, a backdrop, Escape to close, and the page behind it locked while it
 * is open. A fixed column of twelve items would otherwise eat a phone's
 * width.
 */

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

  const [drawerOpen, setDrawerOpen] = useState(false)

  /**
   * Escape closes, and the page behind cannot scroll while it is open.
   *
   * Only while open, so on a desktop — where the drawer is never opened —
   * this adds no listener and never touches the body.
   */
  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [drawerOpen])

  const brand = (
    <span className="admin-brand">
      <span className="admin-brand-mark" aria-hidden="true">
        GP
      </span>
      <span className="admin-brand-text">
        Gold Pelet <span>{t('sidebar.admin')}</span>
      </span>
    </span>
  )

  return (
    <div className={`admin${drawerOpen ? ' is-drawer-open' : ''}`}>
      {/* Narrow screens only: the brand plus the control that opens the
          drawer. The sidebar carries its own brand on a desktop. */}
      <header className="admin-topbar">
        <button
          type="button"
          className="admin-burger"
          aria-expanded={drawerOpen}
          aria-controls="admin-sidebar"
          aria-label={t('sidebar.menu')}
          onClick={() => setDrawerOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        {brand}
      </header>

      <aside className="admin-sidebar" id="admin-sidebar">
        <div className="admin-sidebar-head">{brand}</div>

        {/* One nav component in both layouts. `onNavigate` closes the drawer
            on a tap; on a desktop the drawer is never open, so it is a no-op
            rather than a second code path. */}
        <AdminNav onNavigate={() => setDrawerOpen(false)} />

        <div className="admin-sidebar-foot">
          {/* Language and appearance sit on one row: both are operator
              preferences rather than actions, and neither needs a label. */}
          <div className="admin-sidebar-prefs">
            <LangSwitch />
            <ThemeToggle className="admin-theme" label={t('sidebar.appearance')} />
          </div>
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
      </aside>

      {/* Rendered only while open, so it cannot intercept a click otherwise. */}
      {drawerOpen && (
        <button
          type="button"
          className="admin-backdrop-nav"
          aria-label={t('crud.cancel')}
          onClick={() => setDrawerOpen(false)}
        />
      )}

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
