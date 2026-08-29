import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { Modal } from '@/components/admin/Modal'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import type { Milestone } from '@/lib/api'
import { emptyMilestoneDraft, getToken, milestoneDraftFrom, type MilestoneDraft } from '@/lib/admin'
import { useAdminTimeline } from '@/lib/admin-resources'
import { useAdminLower, useAdminT } from '@/lib/admin-i18n'

/**
 * About Timeline — the company milestones on the About page.
 *
 * A port of admin/timeline.html, a five-field crud.js config and the
 * simplest of the ported screens: no upload, no relation, no unique key.
 * Fields, columns, defaults, endpoints and strings carry over unchanged;
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

export function AdminTimeline() {
  const navigate = useNavigate()
  const t = useAdminT()
  const lower = useAdminLower()

  const milestones = useAdminTimeline((s) => s.items)
  const status = useAdminTimeline((s) => s.status)
  const loadError = useAdminTimeline((s) => s.error)
  const expired = useAdminTimeline((s) => s.expired)
  const load = useAdminTimeline((s) => s.load)
  const reload = useAdminTimeline((s) => s.reload)
  const create = useAdminTimeline((s) => s.create)
  const update = useAdminTimeline((s) => s.update)
  const remove = useAdminTimeline((s) => s.remove)

  const [toast, setToast] = useState<ToastState>(null)

  const [editing, setEditing] = useState<Milestone | null>(null)
  const [draft, setDraft] = useState<MilestoneDraft>(emptyMilestoneDraft)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [confirming, setConfirming] = useState<Milestone | null>(null)
  const [deleting, setDeleting] = useState(false)

  const resource = t('resource.milestone')
  const addLabel = t('crud.addItem', { item: resource })

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
    setDraft(emptyMilestoneDraft())
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (milestone: Milestone) => {
    setEditing(milestone)
    setDraft(milestoneDraftFrom(milestone))
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
      const title = draft.title.trim()
      setFormOpen(false)
      setToast({
        kind: 'success',
        message: t(editing ? 'crud.updated' : 'crud.created', { item: `"${title}"` }),
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
      setToast({ kind: 'success', message: t('crud.deleted', { item: `"${confirming.title}"` }) })
      setConfirming(null)
      return
    }
    if (result.expired) return
    setConfirming(null)
    setToast({ kind: 'error', message: result.message })
  }

  return (
    <AdminShell
      title={t('page.timeline.title')}
      description={t('page.timeline.desc')}
      actions={
        <Button onClick={openAdd} disabled={status === 'loading'}>
          {addLabel}
        </Button>
      }
    >
      {status === 'loading' && <TimelineSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.failedToLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && milestones.length === 0 && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.empty')}</h2>
          <p>{t('page.timeline.desc')}</p>
          <Button onClick={openAdd}>{addLabel}</Button>
        </div>
      )}

      {status === 'ready' && milestones.length > 0 && (
        <div className="admin-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('field.year')}</th>
                <th>{t('field.title')}</th>
                <th>{t('field.order')}</th>
                <th>{t('crud.status')}</th>
                <th className="admin-col-actions">{t('crud.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span className="admin-year">{m.year_label}</span>
                  </td>
                  <td>
                    <span className="admin-cell-title">{m.title}</span>
                    {m.description && <span className="admin-cell-sub">{m.description}</span>}
                  </td>
                  <td className="admin-num">{m.sort_order}</td>
                  <td>
                    <StatusBadge active={m.is_active} t={t} />
                  </td>
                  <td className="admin-col-actions">
                    <div className="admin-row-actions">
                      <Button variant="ghost" onClick={() => openEdit(m)}>
                        {t('crud.edit')}
                      </Button>
                      <Button variant="ghost" className="admin-danger" onClick={() => setConfirming(m)}>
                        {t('crud.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="admin-cards">
            {milestones.map((m) => (
              <li key={m.id} className="admin-card">
                <div className="admin-card-head">
                  <h3>
                    <span className="admin-year">{m.year_label}</span>
                  </h3>
                  <StatusBadge active={m.is_active} t={t} />
                </div>
                <p className="admin-card-title">{m.title}</p>
                {m.description && <p className="admin-card-desc">{m.description}</p>}
                <dl className="admin-card-meta">
                  <div>
                    <dt>{t('field.order')}</dt>
                    <dd>{m.sort_order}</dd>
                  </div>
                </dl>
                <div className="admin-row-actions">
                  <Button variant="ghost" onClick={() => openEdit(m)}>
                    {t('crud.edit')}
                  </Button>
                  <Button variant="ghost" className="admin-danger" onClick={() => setConfirming(m)}>
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
            <label htmlFor="milestone-year">{t('timeline.field.year')} *</label>
            <input
              id="milestone-year"
              value={draft.year_label}
              required
              onChange={(e) => setDraft({ ...draft, year_label: e.target.value })}
            />
          </div>

          <div className="field full">
            <label htmlFor="milestone-title">{t('field.title')} *</label>
            <input
              id="milestone-title"
              value={draft.title}
              required
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>

          <div className="field full">
            <label htmlFor="milestone-description">{t('field.description')}</label>
            <textarea
              id="milestone-description"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <div className="admin-form-row">
            <div className="field">
              <label htmlFor="milestone-order">{t('field.sortOrder')}</label>
              <input
                id="milestone-order"
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
              <label htmlFor="milestone-active">
                <input
                  id="milestone-active"
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
          <p className="admin-confirm-name">{confirming?.title}</p>
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

function TimelineSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-panel" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      {[0, 1, 2, 3].map((i) => (
        <div className="admin-skeleton-row" key={i}>
          <span className="admin-skeleton" style={{ width: '10%' }} />
          <span className="admin-skeleton" style={{ width: '40%' }} />
          <span className="admin-skeleton" style={{ width: '10%' }} />
        </div>
      ))}
    </div>
  )
}
