import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { Modal } from '@/components/admin/Modal'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import type { Stat } from '@/lib/api'
import { emptyStatDraft, getToken, statDraftFrom, type StatDraft } from '@/lib/admin'
import { useAdminStats } from '@/lib/admin-resources'
import { useAdminLower, useAdminT } from '@/lib/admin-i18n'

/**
 * Stats — the animated figures on the home page.
 *
 * A port of admin/stats.html, a six-field crud.js config. Fields, columns,
 * defaults, endpoints and strings carry over unchanged; lib/admin.ts is the
 * API half and lib/admin-stats-store.ts holds the state.
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

export function AdminStats() {
  const navigate = useNavigate()
  const t = useAdminT()
  const lower = useAdminLower()

  const stats = useAdminStats((s) => s.items)
  const status = useAdminStats((s) => s.status)
  const loadError = useAdminStats((s) => s.error)
  const expired = useAdminStats((s) => s.expired)
  const load = useAdminStats((s) => s.load)
  const reload = useAdminStats((s) => s.reload)
  const create = useAdminStats((s) => s.create)
  const update = useAdminStats((s) => s.update)
  const remove = useAdminStats((s) => s.remove)

  const [toast, setToast] = useState<ToastState>(null)

  const [editing, setEditing] = useState<Stat | null>(null)
  const [draft, setDraft] = useState<StatDraft>(emptyStatDraft)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [confirming, setConfirming] = useState<Stat | null>(null)
  const [deleting, setDeleting] = useState(false)

  const resource = t('resource.stat')
  const addLabel = t('crud.addItem', { item: resource })

  const keyTaken = stats.some((s) => s.stat_key === draft.stat_key.trim() && s.id !== editing?.id)

  /**
   * The overlay derives a translation key from `stat_key`
   * (`stats.<stat_key>.label`, see lib/overlay.ts), so renaming one silently
   * drops that stat's ar/ku/tr label on the public site until translations.ts
   * is updated to match. The old page's hint did not say so.
   */
  const keyChanged = Boolean(editing) && draft.stat_key.trim() !== editing?.stat_key

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
    setDraft(emptyStatDraft())
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (stat: Stat) => {
    setEditing(stat)
    setDraft(statDraftFrom(stat))
    setFormError('')
    setFormOpen(true)
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (saving || keyTaken) return

    setSaving(true)
    setFormError('')
    const result = editing ? await update(editing.id, draft) : await create(draft)
    setSaving(false)

    if (result.ok) {
      const label = draft.label.trim()
      setFormOpen(false)
      setToast({
        kind: 'success',
        message: t(editing ? 'crud.updated' : 'crud.created', { item: `"${label}"` }),
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
      setToast({ kind: 'success', message: t('crud.deleted', { item: `"${confirming.label}"` }) })
      setConfirming(null)
      return
    }
    if (result.expired) return
    setConfirming(null)
    setToast({ kind: 'error', message: result.message })
  }

  return (
    <AdminShell
      title={t('page.stats.title')}
      description={t('page.stats.desc')}
      actions={
        <Button onClick={openAdd} disabled={status === 'loading'}>
          {addLabel}
        </Button>
      }
    >
      {status === 'loading' && <StatsSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.failedToLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && stats.length === 0 && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.empty')}</h2>
          <p>{t('page.stats.desc')}</p>
          <Button onClick={openAdd}>{addLabel}</Button>
        </div>
      )}

      {status === 'ready' && stats.length > 0 && (
        <div className="admin-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('field.label')}</th>
                <th>{t('field.value')}</th>
                <th>{t('field.unit')}</th>
                <th>{t('field.order')}</th>
                <th>{t('crud.status')}</th>
                <th className="admin-col-actions">{t('crud.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="admin-cell-title">{s.label}</span>
                  </td>
                  {/* Tabular figures so a column of numbers lines up. */}
                  <td className="admin-num">{s.value_number}</td>
                  <td>{s.unit_suffix}</td>
                  <td className="admin-num">{s.sort_order}</td>
                  <td>
                    <StatusBadge active={s.is_active} t={t} />
                  </td>
                  <td className="admin-col-actions">
                    <div className="admin-row-actions">
                      <Button variant="ghost" onClick={() => openEdit(s)}>
                        {t('crud.edit')}
                      </Button>
                      <Button variant="ghost" className="admin-danger" onClick={() => setConfirming(s)}>
                        {t('crud.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="admin-cards">
            {stats.map((s) => (
              <li key={s.id} className="admin-card">
                <div className="admin-card-head">
                  <h3>
                    <span className="admin-num">{s.value_number}</span>
                    {s.unit_suffix && <span className="admin-stat-unit">{s.unit_suffix}</span>}
                  </h3>
                  <StatusBadge active={s.is_active} t={t} />
                </div>
                <p className="admin-card-desc">{s.label}</p>
                <dl className="admin-card-meta">
                  <div>
                    <dt>{t('field.order')}</dt>
                    <dd>{s.sort_order}</dd>
                  </div>
                </dl>
                <div className="admin-row-actions">
                  <Button variant="ghost" onClick={() => openEdit(s)}>
                    {t('crud.edit')}
                  </Button>
                  <Button variant="ghost" className="admin-danger" onClick={() => setConfirming(s)}>
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
            <label htmlFor="stat-key">{t('stats.field.key')} *</label>
            <input
              id="stat-key"
              value={draft.stat_key}
              required
              aria-invalid={keyTaken || undefined}
              aria-describedby={keyTaken ? 'stat-key-error' : 'stat-key-hint'}
              onChange={(e) => setDraft({ ...draft, stat_key: e.target.value })}
            />
            {keyTaken ? (
              <span className="field-error" id="stat-key-error">
                {t('crud.keyTaken', { item: lower(resource) })}
              </span>
            ) : (
              <span className="admin-field-hint" id="stat-key-hint">
                {t('stats.field.keyHint')}
              </span>
            )}
            {keyChanged && !keyTaken && (
              <span className="admin-field-warning" role="status">
                {t('stats.field.keyChanged')}
              </span>
            )}
          </div>

          <div className="field full">
            <label htmlFor="stat-label">{t('stats.field.label')} *</label>
            <input
              id="stat-label"
              value={draft.label}
              required
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
          </div>

          <div className="admin-form-row">
            <div className="field">
              <label htmlFor="stat-value">{t('field.value')} *</label>
              <input
                id="stat-value"
                type="number"
                step="0.01"
                value={draft.value_number}
                required
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    value_number: e.target.value === '' ? 0 : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="stat-unit">{t('stats.field.unitSuffix')}</label>
              <input
                id="stat-unit"
                value={draft.unit_suffix}
                onChange={(e) => setDraft({ ...draft, unit_suffix: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="field">
              <label htmlFor="stat-order">{t('field.sortOrder')}</label>
              <input
                id="stat-order"
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
              <label htmlFor="stat-active">
                <input
                  id="stat-active"
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
            <button type="submit" className="btn btn-fill" disabled={saving || keyTaken}>
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
          <p className="admin-confirm-name">{confirming?.label}</p>
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

function StatsSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-panel" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <div className="admin-skeleton-row" key={i}>
          <span className="admin-skeleton" style={{ width: '34%' }} />
          <span className="admin-skeleton" style={{ width: '12%' }} />
          <span className="admin-skeleton" style={{ width: '12%' }} />
        </div>
      ))}
    </div>
  )
}
