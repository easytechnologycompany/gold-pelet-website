import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { Button } from '@/components/ui/Button'
import type { EnquiryStatus } from '@/lib/api'
import { getToken } from '@/lib/admin'
import { useAdminOverview, RECENT_LIMIT } from '@/lib/admin-overview-store'
import { useAdminLang, useAdminT } from '@/lib/admin-i18n'

/**
 * Overview — what is on the live site right now.
 *
 * A port of admin/dashboard.html: four counts and the five most recent
 * enquiries. The only read-only screen, so there is nothing to save and
 * nothing to verify persisting.
 *
 * Two changes, both about the numbers being trustworthy rather than merely
 * present.
 *
 * Each tile links to the screen it counts. A count is a reason to go
 * somewhere, and the old tiles were dead ends.
 *
 * And a number that could not be loaded says so. The old page left its
 * em-dash placeholder in the tile when a request failed, which is exactly
 * what it showed while still loading — so "we could not reach this" and
 * "still counting" were indistinguishable, and a stale-looking dash was the
 * only clue. One endpoint being down now costs that tile, not the page.
 */

type Translate = (key: string, vars?: Record<string, string | number>) => string

const TILES = [
  { key: 'newEnquiries', label: 'page.dashboard.newEnquiries', to: '/admin/enquiries', source: 'enquiries' },
  { key: 'products', label: 'page.dashboard.products', to: '/admin/products', source: 'products' },
  { key: 'news', label: 'page.dashboard.newsItems', to: '/admin/news', source: 'news' },
  { key: 'certifications', label: 'page.dashboard.certifications', to: '/admin/certifications', source: 'certifications' },
] as const

function StatusBadge({ status, t }: { status: EnquiryStatus; t: Translate }) {
  return (
    <span className={`admin-badge admin-status admin-status--${status}`}>
      {t(`enquiries.${status}`)}
    </span>
  )
}

export function AdminOverview() {
  const navigate = useNavigate()
  const t = useAdminT()
  const locale = useAdminLang((s) => s.locale)

  const overview = useAdminOverview((s) => s.overview)
  const failed = useAdminOverview((s) => s.failed)
  const status = useAdminOverview((s) => s.status)
  const loadError = useAdminOverview((s) => s.error)
  const expired = useAdminOverview((s) => s.expired)
  const load = useAdminOverview((s) => s.load)
  const reload = useAdminOverview((s) => s.reload)

  useEffect(() => {
    if (!getToken()) {
      navigate('/admin/login', { replace: true })
      return
    }
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load, navigate])

  useEffect(() => {
    if (expired) navigate('/admin/login', { replace: true })
  }, [expired, navigate])

  const recent = overview.recent ?? []
  const enquiriesFailed = failed.includes('enquiries')

  return (
    <AdminShell title={t('page.dashboard.title')} description={t('page.dashboard.desc')}>
      {status === 'loading' && <OverviewSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.failedToLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <ul className="admin-tiles">
            {TILES.map((tile) => {
              const value = overview[tile.key]
              const missing = failed.includes(tile.source)
              return (
                <li key={tile.key}>
                  <Link className={`admin-tile${missing ? ' is-missing' : ''}`} to={tile.to}>
                    <span className="admin-tile-num">
                      {/* A dash only ever means "not available", never
                          "loading" — the skeleton covers that. */}
                      {missing ? '—' : (value ?? 0)}
                    </span>
                    <span className="admin-tile-label">{t(tile.label)}</span>
                    {missing && (
                      <span className="admin-tile-note">{t('crud.failedToLoad')}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          <section className="admin-panel admin-group">
            <header className="admin-group-head">
              <div>
                <h2>{t('page.dashboard.recentEnquiries')}</h2>
                <p>{t('page.dashboard.recentEnquiriesDesc')}</p>
              </div>
              {recent.length > 0 && (
                <Link className="btn btn-ghost admin-view-page" to="/admin/enquiries">
                  {t('nav.enquiries')}
                </Link>
              )}
            </header>

            {enquiriesFailed && (
              <div className="admin-state">
                <p>{t('crud.failedToLoad')}</p>
                <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
              </div>
            )}

            {!enquiriesFailed && recent.length === 0 && (
              <div className="admin-state">
                <p>{t('page.dashboard.noEnquiries')}</p>
              </div>
            )}

            {!enquiriesFailed && recent.length > 0 && (
              <>
                <table className="admin-table admin-table--flush">
                  <thead>
                    <tr>
                      <th>{t('page.dashboard.company')}</th>
                      <th>{t('page.dashboard.contact')}</th>
                      <th>{t('page.dashboard.product')}</th>
                      <th>{t('page.dashboard.status')}</th>
                      <th>{t('page.dashboard.received')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <span className="admin-cell-title">{e.company_name}</span>
                        </td>
                        <td>{e.contact_name}</td>
                        <td>{e.product_interest || '-'}</td>
                        <td>
                          <StatusBadge status={e.status} t={t} />
                        </td>
                        <td>{new Date(e.created_at).toLocaleDateString(locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <ul className="admin-cards admin-cards--flush">
                  {recent.map((e) => (
                    <li key={e.id} className="admin-card">
                      <div className="admin-card-head">
                        <h3>{e.company_name}</h3>
                        <StatusBadge status={e.status} t={t} />
                      </div>
                      <p className="admin-card-desc">{e.contact_name}</p>
                      <dl className="admin-card-meta">
                        <div>
                          <dt>{t('page.dashboard.product')}</dt>
                          <dd>{e.product_interest || '-'}</dd>
                        </div>
                        <div>
                          <dt>{t('page.dashboard.received')}</dt>
                          <dd>{new Date(e.created_at).toLocaleDateString(locale)}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </AdminShell>
  )
}

function OverviewSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      <ul className="admin-tiles">
        {[0, 1, 2, 3].map((i) => (
          <li key={i}>
            <div className="admin-tile">
              <span className="admin-skeleton" style={{ width: '2.5rem', height: 34 }} />
              <span className="admin-skeleton" style={{ width: '70%', height: 12 }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="admin-panel admin-group">
        <span className="admin-skeleton" style={{ width: '30%', height: 22 }} />
        {Array.from({ length: RECENT_LIMIT }, (_, i) => (
          <span className="admin-skeleton" style={{ width: '100%', height: 18 }} key={i} />
        ))}
      </div>
    </div>
  )
}
