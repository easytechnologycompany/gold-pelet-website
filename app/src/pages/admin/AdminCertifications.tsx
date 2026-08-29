import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { Modal } from '@/components/admin/Modal'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import type { Certification } from '@/lib/api'
import {
  certificationDraftFrom,
  emptyCertificationDraft,
  getToken,
  type CertificationDraft,
} from '@/lib/admin'
import { useAdminCertifications } from '@/lib/admin-resources'
import { useAdminLower, useAdminT } from '@/lib/admin-i18n'
import { CERT_ICON, CERT_ICON_KEYS, certIcon } from '@/lib/cert-icons'

/**
 * Certifications — the badges on the Home and About pages.
 *
 * A port of admin/certifications.html, a five-field crud.js config. Fields,
 * columns, defaults, endpoints and strings carry over unchanged;
 * lib/admin.ts is the API half and lib/admin-resources.ts the store.
 *
 * Same deliberate change as the other ported screens: the old engine toasted
 * on `res.ok`, so a write the backend accepted and dropped still read as
 * success. Every mutation here re-reads and verifies first.
 */

type Translate = (key: string, vars?: Record<string, string | number>) => string

function StatusBadge({ active, t }: { active: boolean; t: Translate }) {
  return (
    <span className={`admin-badge admin-badge--${active ? 'active' : 'hidden'}`}>
      {t(active ? 'crud.active' : 'crud.hidden')}
    </span>
  )
}

export function AdminCertifications() {
  const navigate = useNavigate()
  const t = useAdminT()
  const lower = useAdminLower()

  const certifications = useAdminCertifications((s) => s.items)
  const status = useAdminCertifications((s) => s.status)
  const loadError = useAdminCertifications((s) => s.error)
  const expired = useAdminCertifications((s) => s.expired)
  const load = useAdminCertifications((s) => s.load)
  const reload = useAdminCertifications((s) => s.reload)
  const create = useAdminCertifications((s) => s.create)
  const update = useAdminCertifications((s) => s.update)
  const remove = useAdminCertifications((s) => s.remove)

  const [toast, setToast] = useState<ToastState>(null)

  const [editing, setEditing] = useState<Certification | null>(null)
  const [draft, setDraft] = useState<CertificationDraft>(emptyCertificationDraft)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [confirming, setConfirming] = useState<Certification | null>(null)
  const [deleting, setDeleting] = useState(false)

  const resource = t('resource.certification')
  const addLabel = t('crud.addItem', { item: resource })

  /**
   * The site draws a generic tick for any key it does not recognise (see
   * lib/cert-icons.ts), which is a sensible fallback and a silent one — a
   * typo looks like a design choice. The field stays free text, because the
   * fallback is deliberate and new keys may be added, but the form now shows
   * which icon will actually render and says when it is the fallback.
   */
  const iconKey = draft.icon_key.trim()
  const iconRecognised = iconKey in CERT_ICON

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

  const openAdd = () => {
    setEditing(null)
    setDraft(emptyCertificationDraft())
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (certification: Certification) => {
    setEditing(certification)
    setDraft(certificationDraftFrom(certification))
    setFormError('')
    setFormOpen(true)
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    setFormError('')
    const result = editing ? await update(editing.id, draft) : await create(draft)
    setSaving(false)

    if (result.ok) {
      const name = draft.name.trim()
      setFormOpen(false)
      setToast({
        kind: 'success',
        message: t(editing ? 'crud.updated' : 'crud.created', { item: `"${name}"` }),
      })
      return
    }
    if (result.expired) return
    setFormError(result.message)
  }

  const onDelete = async () => {
    if (!confirming || deleting) return
    setDeleting(true)
    const result = await remove(confirming.id)
    setDeleting(false)

    if (result.ok) {
      setToast({ kind: 'success', message: t('crud.deleted', { item: `"${confirming.name}"` }) })
      setConfirming(null)
      return
    }
    if (result.expired) return
    setConfirming(null)
    setToast({ kind: 'error', message: result.message })
  }

  return (
    <AdminShell
      title={t('page.certifications.title')}
      description={t('page.certifications.desc')}
      actions={
        <Button onClick={openAdd} disabled={status === 'loading'}>
          {addLabel}
        </Button>
      }
    >
      {status === 'loading' && <CertificationsSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.failedToLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && certifications.length === 0 && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.empty')}</h2>
          <p>{t('page.certifications.desc')}</p>
          <Button onClick={openAdd}>{addLabel}</Button>
        </div>
      )}

      {status === 'ready' && certifications.length > 0 && (
        <div className="admin-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('field.name')}</th>
                <th>{t('field.description')}</th>
                <th>{t('field.order')}</th>
                <th>{t('crud.status')}</th>
                <th className="admin-col-actions">{t('crud.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {certifications.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="admin-product-cell">
                      {/* The icon the public page will draw for this key. */}
                      <span className="admin-cert-icon" aria-hidden="true">
                        <Icon id={certIcon(c.icon_key)} />
                      </span>
                      <span>
                        <span className="admin-cell-title">{c.name}</span>
                        <span className="admin-cell-sub">
                          <code className="admin-slug">{c.icon_key}</code>
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>{c.description}</td>
                  <td className="admin-num">{c.sort_order}</td>
                  <td>
                    <StatusBadge active={c.is_active} t={t} />
                  </td>
                  <td className="admin-col-actions">
                    <div className="admin-row-actions">
                      <Button variant="ghost" onClick={() => openEdit(c)}>
                        {t('crud.edit')}
                      </Button>
                      <Button variant="ghost" className="admin-danger" onClick={() => setConfirming(c)}>
                        {t('crud.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="admin-cards">
            {certifications.map((c) => (
              <li key={c.id} className="admin-card">
                <div className="admin-card-head">
                  <div className="admin-product-cell">
                    <span className="admin-cert-icon" aria-hidden="true">
                      <Icon id={certIcon(c.icon_key)} />
                    </span>
                    <h3>{c.name}</h3>
                  </div>
                  <StatusBadge active={c.is_active} t={t} />
                </div>
                <p className="admin-card-desc">{c.description}</p>
                <dl className="admin-card-meta">
                  <div>
                    <dt>{t('field.iconKey')}</dt>
                    <dd>
                      <code className="admin-slug">{c.icon_key}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>{t('field.order')}</dt>
                    <dd>{c.sort_order}</dd>
                  </div>
                </dl>
                <div className="admin-row-actions">
                  <Button variant="ghost" onClick={() => openEdit(c)}>
                    {t('crud.edit')}
                  </Button>
                  <Button variant="ghost" className="admin-danger" onClick={() => setConfirming(c)}>
                    {t('crud.delete')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={formOpen}
        title={editing ? t('crud.editItem', { item: resource }) : addLabel.replace('+', '').trim()}
        onClose={() => !saving && setFormOpen(false)}
      >
        <form className="admin-form" onSubmit={onSubmit} noValidate>
          <div className="field full">
            <label htmlFor="cert-name">{t('certifications.field.name')} *</label>
            <input
              id="cert-name"
              value={draft.name}
              required
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>

          <div className="field full">
            <label htmlFor="cert-description">{t('certifications.field.description')} *</label>
            <input
              id="cert-description"
              value={draft.description}
              required
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <div className="field full">
            <label htmlFor="cert-icon">{t('field.iconKey')}</label>
            <div className="admin-icon-field">
              <span
                className={`admin-cert-icon${iconRecognised ? '' : ' admin-cert-icon--fallback'}`}
                aria-hidden="true"
              >
                <Icon id={certIcon(iconKey)} />
              </span>
              <input
                id="cert-icon"
                value={draft.icon_key}
                list="cert-icon-keys"
                aria-describedby="cert-icon-hint"
                onChange={(e) => setDraft({ ...draft, icon_key: e.target.value })}
              />
              {/* Suggestions, not a restriction: the site falls back on
                  purpose, and new keys may be added to cert-icons.ts later. */}
              <datalist id="cert-icon-keys">
                {CERT_ICON_KEYS.map((key) => (
                  <option value={key} key={key} />
                ))}
              </datalist>
            </div>
            <span className="admin-field-hint" id="cert-icon-hint">
              {t('certifications.field.iconHint')}
            </span>
            {!iconRecognised && (
              <span className="admin-field-warning" role="status">
                {t('certifications.field.iconFallback')}
              </span>
            )}
          </div>

          <div className="admin-form-row">
            <div className="field">
              <label htmlFor="cert-order">{t('field.sortOrder')}</label>
              <input
                id="cert-order"
                type="number"
                value={draft.sort_order}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    sort_order: e.target.value === '' ? 0 : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="field admin-check">
              <label htmlFor="cert-active">
                <input
                  id="cert-active"
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                />
                <span>{t('field.visibleOnSite')}</span>
              </label>
            </div>
          </div>

          {formError && (
            <p className="admin-form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="admin-modal-actions">
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              {t('crud.cancel')}
            </Button>
            <button type="submit" className="btn btn-fill" disabled={saving}>
              {saving ? `${t('crud.save')}…` : t('crud.save')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirming)}
        title={t('crud.deleteItem', { item: resource })}
        onClose={() => !deleting && setConfirming(null)}
      >
        <div className="admin-form">
          <p className="admin-confirm-name">{confirming?.name}</p>
          <p className="admin-confirm-text">
            {t('crud.deleteConfirm', { item: lower(resource) })}
          </p>
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

function CertificationsSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-panel" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      {[0, 1, 2, 3].map((i) => (
        <div className="admin-skeleton-row" key={i}>
          <span className="admin-skeleton admin-skeleton--thumb" />
          <span className="admin-skeleton" style={{ width: '24%' }} />
          <span className="admin-skeleton" style={{ width: '30%' }} />
        </div>
      ))}
    </div>
  )
}
