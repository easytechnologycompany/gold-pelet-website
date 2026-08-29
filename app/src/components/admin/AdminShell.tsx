import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { clearToken } from '@/lib/admin'
import { useAdminHead } from './useAdminHead'

/**
 * Chrome for the admin screens.
 *
 * The public site's header (components/layout/Chrome) is deliberately not
 * reused: it carries the marketing nav, the language switcher and the quote
 * CTA, none of which belong over a data table, and it is fixed-position with
 * a blur that would sit on top of the modal. This is the same visual
 * language — same tokens, same brand plate, same button skin — with only
 * what an operator needs.
 *
 * The old dashboard's twelve-item sidebar is intentionally absent rather than
 * reproduced: eleven of those pages have not been ported, so a sidebar here
 * would be eleven dead links. Categories is the page that exists, so the
 * shell states where you are and gets out of the way.
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
              Gold Pelet <span>Admin</span>
            </span>
          </span>
          <Button
            variant="ghost"
            className="admin-signout"
            onClick={() => {
              clearToken()
              navigate('/admin/login', { replace: true })
            }}
          >
            Sign out
          </Button>
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
