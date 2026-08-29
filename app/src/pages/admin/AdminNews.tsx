import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { ImageField } from '@/components/admin/ImageField'
import { Modal } from '@/components/admin/Modal'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import { mediaURL, type NewsItem } from '@/lib/api'
import { emptyNewsDraft, getToken, newsDraftFrom, uploadMedia, type NewsDraft } from '@/lib/admin'
import { useAdminNews } from '@/lib/admin-news-store'
import { useAdminT } from '@/lib/admin-i18n'

/**
 * Events & News — the cards on the public Events & News page.
 *
 * A port of admin/news.html, which drove crud.js with an eight-field config
 * including its `image` field type. Fields, columns, defaults, endpoints and
 * strings carry over unchanged; lib/admin.ts is the API half and
 * lib/admin-news-store.ts holds the state.
 *
 * Same deliberate change as the other two ported screens: the old engine
 * toasted on `res.ok`, so a write the backend accepted and dropped still read
 * as success. Every mutation here re-reads and verifies first.
 */

type Translate = (key: string, vars?: Record<string, string | number>) => string

function StatusBadge({ active, t }: { active: boolean; t: Translate }) {
  return (
    <span className={`admin-badge admin-badge--${active ? 'active' : 'hidden'}`}>
      {t(active ? 'crud.active' : 'crud.hidden')}
    </span>
  )
}

export function AdminNews() {
  const navigate = useNavigate()
  const t = useAdminT()

  const news = useAdminNews((s) => s.news)
  const status = useAdminNews((s) => s.status)
  const loadError = useAdminNews((s) => s.error)
  const expired = useAdminNews((s) => s.expired)
  const load = useAdminNews((s) => s.load)
  const reload = useAdminNews((s) => s.reload)
  const create = useAdminNews((s) => s.create)
  const update = useAdminNews((s) => s.update)
  const remove = useAdminNews((s) => s.remove)

  const [toast, setToast] = useState<ToastState>(null)

  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [draft, setDraft] = useState<NewsDraft>(emptyNewsDraft)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [uploading, setUploading] = useState(false)

  const [confirming, setConfirming] = useState<NewsItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const resource = t('resource.newsItem')
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
    setDraft(emptyNewsDraft())
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (item: NewsItem) => {
    setEditing(item)
    setDraft(newsDraftFrom(item))
    setFormError('')
    setFormOpen(true)
  }

  const onPickImage = async (file: File) => {
    setUploading(true)
    setFormError('')
    try {
      const url = await uploadMedia(file)
      setDraft((d) => ({ ...d, image_url: url }))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'The upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (saving || uploading) return

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
      title={t('page.news.title')}
      description={t('page.news.desc')}
      actions={
        <Button onClick={openAdd} disabled={status === 'loading'}>
          {addLabel}
        </Button>
      }
    >
      {status === 'loading' && <NewsSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.failedToLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && news.length === 0 && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.empty')}</h2>
          <p>{t('page.news.desc')}</p>
          <Button onClick={openAdd}>{addLabel}</Button>
        </div>
      )}

      {status === 'ready' && news.length > 0 && (
        <div className="admin-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('news.field.photo')}</th>
                <th>{t('field.title')}</th>
                <th>{t('field.date')}</th>
                <th>{t('crud.featured')}</th>
                <th>{t('field.order')}</th>
                <th>{t('crud.status')}</th>
                <th className="admin-col-actions">{t('crud.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {news.map((n) => (
                <tr key={n.id}>
                  <td>
                    <NewsThumb item={n} />
                  </td>
                  <td>
                    <span className="admin-cell-title">{n.title}</span>
                    {n.description && <span className="admin-cell-sub">{n.description}</span>}
                  </td>
                  <td>{n.date_label}</td>
                  <td>{n.is_featured ? t('crud.yes') : ''}</td>
                  <td>{n.sort_order}</td>
                  <td>
                    <StatusBadge active={n.is_active} t={t} />
                  </td>
                  <td className="admin-col-actions">
                    <div className="admin-row-actions">
                      <Button variant="ghost" onClick={() => openEdit(n)}>
                        {t('crud.edit')}
                      </Button>
                      <Button variant="ghost" className="admin-danger" onClick={() => setConfirming(n)}>
                        {t('crud.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="admin-cards">
            {news.map((n) => (
              <li key={n.id} className="admin-card">
                <div className="admin-card-head">
                  <div className="admin-product-cell">
                    <NewsThumb item={n} />
                    <h3>{n.title}</h3>
                  </div>
                  <StatusBadge active={n.is_active} t={t} />
                </div>
                {n.description && <p className="admin-card-desc">{n.description}</p>}
                <dl className="admin-card-meta">
                  <div>
                    <dt>{t('field.date')}</dt>
                    <dd>{n.date_label}</dd>
                  </div>
                  <div>
                    <dt>{t('field.order')}</dt>
                    <dd>{n.sort_order}</dd>
                  </div>
                  {n.is_featured && (
                    <div>
                      <dt>{t('crud.featured')}</dt>
                      <dd>{t('crud.yes')}</dd>
                    </div>
                  )}
                </dl>
                <div className="admin-row-actions">
                  <Button variant="ghost" onClick={() => openEdit(n)}>
                    {t('crud.edit')}
                  </Button>
                  <Button variant="ghost" className="admin-danger" onClick={() => setConfirming(n)}>
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
          <ImageField
            id="news-image"
            label={t('news.field.photoHint')}
            url={draft.image_url}
            busy={uploading}
            disabled={uploading}
            onPick={(file) => void onPickImage(file)}
            onClear={() => setDraft((d) => ({ ...d, image_url: '' }))}
          />

          <div className="field full">
            <label htmlFor="news-title">{t('field.title')} *</label>
            <input
              id="news-title"
              value={draft.title}
              required
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>

          <div className="field full">
            <label htmlFor="news-description">{t('field.description')}</label>
            <textarea
              id="news-description"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <div className="field full">
            <label htmlFor="news-date">{t('news.field.dateLabel')} *</label>
            <input
              id="news-date"
              value={draft.date_label}
              required
              onChange={(e) => setDraft({ ...draft, date_label: e.target.value })}
            />
          </div>

          <div className="admin-form-row">
            <div className="field">
              <label htmlFor="news-icon">{t('field.iconKey')}</label>
              <input
                id="news-icon"
                value={draft.icon_key}
                onChange={(e) => setDraft({ ...draft, icon_key: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="news-order">{t('field.sortOrder')}</label>
              <input
                id="news-order"
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
          </div>

          <div className="field admin-check">
            <label htmlFor="news-featured">
              <input
                id="news-featured"
                type="checkbox"
                checked={draft.is_featured}
                onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })}
              />
              <span>{t('news.field.featuredCheckbox')}</span>
            </label>
          </div>

          <div className="field admin-check">
            <label htmlFor="news-active">
              <input
                id="news-active"
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
              />
              <span>{t('field.visibleOnSite')}</span>
            </label>
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
            <button type="submit" className="btn btn-fill" disabled={saving || uploading}>
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
            {t('crud.deleteConfirm', { item: resource.toLocaleLowerCase() })}
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

/** The card photo if set, else a plate — the public page falls back to a
 *  decorative pattern, so a missing photo is normal, not an error. */
function NewsThumb({ item }: { item: NewsItem }) {
  if (!item.image_url) return <span className="admin-thumb admin-thumb--empty" aria-hidden="true" />
  return <img className="admin-thumb" src={mediaURL(item.image_url)} alt="" loading="lazy" />
}

function NewsSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-panel" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      {[0, 1, 2, 3].map((i) => (
        <div className="admin-skeleton-row" key={i}>
          <span className="admin-skeleton admin-skeleton--thumb" />
          <span className="admin-skeleton" style={{ width: '34%' }} />
          <span className="admin-skeleton" style={{ width: '18%' }} />
          <span className="admin-skeleton" style={{ width: '10%' }} />
        </div>
      ))}
    </div>
  )
}
