import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { Modal } from '@/components/admin/Modal'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import { ENQUIRY_STATUSES, type Enquiry, type EnquiryStatus } from '@/lib/api'
import { getToken } from '@/lib/admin'
import { useAdminEnquiries } from '@/lib/admin-enquiries-store'
import { useAdminLang, useAdminLower, useAdminT } from '@/lib/admin-i18n'

/**
 * Enquiries — the RFQ and contact-form submissions.
 *
 * A port of admin/enquiries.html, and the only screen whose records the admin
 * does not author: they arrive from the public Contact page. So there is no
 * add and no edit form. What an operator does here is read one, move it
 * between statuses, and delete it once it is done with.
 *
 * The filter is server-side, part of the query, which is why it lives in the
 * store rather than as a client-side `.filter()` over a full list.
 *
 * The usual check applies to both writes, with one wrinkle worth stating: a
 * status change can legitimately move a record out of the filtered view, so
 * verification reads the unfiltered list — otherwise the record's absence
 * from the filtered one would look exactly like a write that failed.
 */

type Translate = (key: string, vars?: Record<string, string | number>) => string

function StatusBadge({ status, t }: { status: EnquiryStatus; t: Translate }) {
  return <span className={`admin-badge admin-status admin-status--${status}`}>{t(`enquiries.${status}`)}</span>
}

/** The submission's own locale is unknown, so dates follow the operator's. */
const formatDate = (iso: string, locale: string, withTime = false) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return withTime ? date.toLocaleString(locale) : date.toLocaleDateString(locale)
}

export function AdminEnquiries() {
  const navigate = useNavigate()
  const t = useAdminT()
  const lower = useAdminLower()

  const enquiries = useAdminEnquiries((s) => s.enquiries)
  const filter = useAdminEnquiries((s) => s.filter)
  const status = useAdminEnquiries((s) => s.status)
  const loadError = useAdminEnquiries((s) => s.error)
  const expired = useAdminEnquiries((s) => s.expired)
  const load = useAdminEnquiries((s) => s.load)
  const reload = useAdminEnquiries((s) => s.reload)
  const setFilter = useAdminEnquiries((s) => s.setFilter)
  const setStatus = useAdminEnquiries((s) => s.setStatus)
  const remove = useAdminEnquiries((s) => s.remove)

  const [viewing, setViewing] = useState<Enquiry | null>(null)
  const [draftStatus, setDraftStatus] = useState<EnquiryStatus>('new')
  const [saving, setSaving] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [confirming, setConfirming] = useState<Enquiry | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const resource = t('resource.enquiry')
  // The submission carries no locale of its own, and these dates are the
  // operator's to read, so they follow the admin language rather than the
  // browser's.
  const dateLocale = useAdminLang((s) => s.locale)

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

  const openDetail = (enquiry: Enquiry) => {
    setViewing(enquiry)
    setDraftStatus(enquiry.status)
    setDetailError('')
  }

  const onSaveStatus = async () => {
    if (!viewing || saving || draftStatus === viewing.status) return
    setSaving(true)
    setDetailError('')
    const result = await setStatus(viewing.id, draftStatus)
    setSaving(false)

    if (result.ok) {
      setViewing(null)
      setToast({ kind: 'success', message: t('enquiries.statusUpdated') })
      return
    }
    if (result.expired) return
    setDetailError(result.message)
  }

  const onDelete = async () => {
    if (!confirming || deleting) return
    setDeleting(true)
    const result = await remove(confirming.id)
    setDeleting(false)

    if (result.ok) {
      setConfirming(null)
      setViewing(null)
      setToast({ kind: 'success', message: t('enquiries.deleted') })
      return
    }
    if (result.expired) return
    setConfirming(null)
    setToast({ kind: 'error', message: result.message })
  }

  return (
    <AdminShell
      title={t('page.enquiries.title')}
      description={t('page.enquiries.desc')}
      actions={
        <div className="field admin-filter">
          <label htmlFor="enquiry-filter" className="admin-sr-only">
            {t('page.dashboard.status')}
          </label>
          <select
            id="enquiry-filter"
            value={filter}
            disabled={status === 'loading'}
            onChange={(e) => void setFilter(e.target.value as EnquiryStatus | '')}
          >
            <option value="">{t('enquiries.allStatuses')}</option>
            {ENQUIRY_STATUSES.map((s) => (
              <option value={s} key={s}>
                {t(`enquiries.${s}`)}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {status === 'loading' && <EnquiriesSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.failedToLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && enquiries.length === 0 && (
        <div className="admin-panel admin-state">
          <h2>{t('page.dashboard.noEnquiries')}</h2>
          <p>{t('page.enquiries.desc')}</p>
          {/* Distinguishes the two empties: with a filter on, the inbox may
              well have records that simply do not match it, so offer the way
              back rather than implying there is nothing at all. */}
          {filter && (
            <Button onClick={() => void setFilter('')}>{t('enquiries.allStatuses')}</Button>
          )}
        </div>
      )}

      {status === 'ready' && enquiries.length > 0 && (
        <div className="admin-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('page.dashboard.company')}</th>
                <th>{t('page.dashboard.contact')}</th>
                <th>{t('enquiries.country')}</th>
                <th>{t('page.dashboard.product')}</th>
                <th>{t('page.dashboard.received')}</th>
                <th>{t('page.dashboard.status')}</th>
                <th className="admin-col-actions">{t('crud.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className="admin-cell-title">{e.company_name}</span>
                  </td>
                  <td>
                    <span className="admin-cell-title">{e.contact_name}</span>
                    <span className="admin-cell-sub">{e.email}</span>
                  </td>
                  <td>{e.country}</td>
                  <td>{e.product_interest || '-'}</td>
                  <td>{formatDate(e.created_at, dateLocale)}</td>
                  <td>
                    <StatusBadge status={e.status} t={t} />
                  </td>
                  <td className="admin-col-actions">
                    <div className="admin-row-actions">
                      <Button variant="ghost" onClick={() => openDetail(e)}>
                        {t('enquiries.view')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="admin-cards">
            {enquiries.map((e) => (
              <li key={e.id} className="admin-card">
                <div className="admin-card-head">
                  <h3>{e.company_name}</h3>
                  <StatusBadge status={e.status} t={t} />
                </div>
                <p className="admin-card-desc">
                  {e.contact_name} · {e.country}
                </p>
                <dl className="admin-card-meta">
                  <div>
                    <dt>{t('page.dashboard.product')}</dt>
                    <dd>{e.product_interest || '-'}</dd>
                  </div>
                  <div>
                    <dt>{t('page.dashboard.received')}</dt>
                    <dd>{formatDate(e.created_at, dateLocale)}</dd>
                  </div>
                </dl>
                <div className="admin-row-actions">
                  <Button variant="ghost" onClick={() => openDetail(e)}>
                    {t('enquiries.view')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Never both at once. Two Modals mounted together means two elements
          carrying id="admin-modal-title", so aria-labelledby resolves to the
          wrong one, and two focus traps competing for the same Tab. The
          detail steps aside while the confirm is up and comes back if it is
          cancelled, since `viewing` is untouched. */}
      <Modal
        open={viewing !== null && confirming === null}
        title={t('enquiries.detailTitle')}
        onClose={() => !saving && setViewing(null)}
      >
        {viewing && (
          <div className="admin-form">
            <dl className="admin-detail">
              <div>
                <dt>{t('enquiries.company')}</dt>
                <dd>{viewing.company_name}</dd>
              </div>
              <div>
                <dt>{t('enquiries.contact')}</dt>
                <dd>
                  {viewing.contact_name}
                  {/* Actionable, because answering is the point of the page. */}
                  <a href={`mailto:${viewing.email}`}>{viewing.email}</a>
                  {viewing.phone && <a href={`tel:${viewing.phone}`}>{viewing.phone}</a>}
                </dd>
              </div>
              <div>
                <dt>{t('enquiries.country')}</dt>
                <dd>{viewing.country}</dd>
              </div>
              <div>
                <dt>{t('enquiries.productInterest')}</dt>
                <dd>{viewing.product_interest || '-'}</dd>
              </div>
              <div>
                <dt>{t('enquiries.estimatedVolume')}</dt>
                <dd>{viewing.estimated_volume || '-'}</dd>
              </div>
              <div>
                <dt>{t('enquiries.received')}</dt>
                <dd>{formatDate(viewing.created_at, dateLocale, true)}</dd>
              </div>
            </dl>

            {/* Someone else's words, so they keep their line breaks and are
                not squeezed into a definition row with the rest. */}
            <div className="field full">
              <label htmlFor="enquiry-message">{t('enquiries.message')}</label>
              <p className="admin-message" id="enquiry-message">
                {viewing.message}
              </p>
            </div>

            <div className="field full">
              <label htmlFor="enquiry-status">{t('page.dashboard.status')}</label>
              <select
                id="enquiry-status"
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as EnquiryStatus)}
              >
                {ENQUIRY_STATUSES.map((s) => (
                  <option value={s} key={s}>
                    {t(`enquiries.${s}`)}
                  </option>
                ))}
              </select>
            </div>

            {detailError && (
              <p className="admin-form-error" role="alert">
                {detailError}
              </p>
            )}

            <div className="admin-modal-actions admin-detail-actions">
              <Button
                variant="ghost"
                className="admin-danger"
                onClick={() => setConfirming(viewing)}
                disabled={saving}
              >
                {t('crud.delete')}
              </Button>
              <button
                type="button"
                className="btn btn-fill"
                onClick={() => void onSaveStatus()}
                disabled={saving || draftStatus === viewing.status}
              >
                {saving ? `${t('crud.save')}…` : t('enquiries.updateStatus')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(confirming)}
        title={t('crud.deleteItem', { item: resource })}
        onClose={() => !deleting && setConfirming(null)}
      >
        <div className="admin-form">
          <p className="admin-confirm-name">{confirming?.company_name}</p>
          <p className="admin-confirm-text">{t('crud.deleteConfirm', { item: lower(resource) })}</p>
          <div className="admin-modal-actions">
            <Button variant="ghost" onClick={() => setConfirming(null)} disabled={deleting}>
              {t('crud.cancel')}
            </Button>
            <button
              type="button"
              className="btn btn-fill admin-danger-fill"
              onClick={() => void onDelete()}
              disabled={deleting}
            >
              {deleting ? `${t('crud.delete')}…` : t('crud.delete')}
            </button>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  )
}

function EnquiriesSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-panel" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <div className="admin-skeleton-row" key={i}>
          <span className="admin-skeleton" style={{ width: '24%' }} />
          <span className="admin-skeleton" style={{ width: '26%' }} />
          <span className="admin-skeleton" style={{ width: '14%' }} />
          <span className="admin-skeleton" style={{ width: '12%' }} />
        </div>
      ))}
    </div>
  )
}
