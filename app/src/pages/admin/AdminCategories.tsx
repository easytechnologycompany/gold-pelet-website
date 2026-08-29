import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { Modal } from '@/components/admin/Modal'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import type { Category } from '@/lib/api'
import { draftFrom, emptyDraft, getToken, type CategoryDraft } from '@/lib/admin'
import { useAdminCategories } from '@/lib/admin-store'
import { useAdminT } from '@/lib/admin-i18n'

/**
 * Product categories — the Products page's groupings (Potato Pellets, Wheat
 * Pellets, Corn & 3D Pellets).
 *
 * A port of admin/categories.html, which drove the generic engine in
 * admin/js/crud.js with a five-field config. The fields, the columns, the
 * defaults, the endpoints, the payload shape and the strings are all carried
 * over unchanged; only the presentation is new. lib/admin.ts is the API half,
 * lib/admin-store.ts holds the state, lib/admin-i18n.ts the dictionary.
 *
 * The one behavioural change is deliberate and required: the old engine
 * toasted on `res.ok` and then reloaded, so a write the backend accepted but
 * silently dropped still reported success. Here every mutation re-reads the
 * list and verifies the record before anything is called a success.
 */

type Translate = (key: string, vars?: Record<string, string | number>) => string

/** Mirrors the old table's `is_active` column renderer. */
function StatusBadge({ active, t }: { active: boolean; t: Translate }) {
  return (
    <span className={`admin-badge admin-badge--${active ? 'active' : 'hidden'}`}>
      {t(active ? 'crud.active' : 'crud.hidden')}
    </span>
  )
}

export function AdminCategories() {
  const navigate = useNavigate()
  const t = useAdminT()

  const categories = useAdminCategories((s) => s.categories)
  const status = useAdminCategories((s) => s.status)
  const loadError = useAdminCategories((s) => s.error)
  const expired = useAdminCategories((s) => s.expired)
  const load = useAdminCategories((s) => s.load)
  const reload = useAdminCategories((s) => s.reload)
  const create = useAdminCategories((s) => s.create)
  const update = useAdminCategories((s) => s.update)
  const remove = useAdminCategories((s) => s.remove)

  const [toast, setToast] = useState<ToastState>(null)

  const [editing, setEditing] = useState<Category | null>(null)
  const [draft, setDraft] = useState<CategoryDraft>(emptyDraft)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [confirming, setConfirming] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Whole templates, not verb + noun glued together at the call site. The old
  // crud.js built these as `${t('crud.add')} ${titleSingular}`, which is fine
  // in English and wrong in Turkish, where the object precedes the verb:
  // that produced "+ Ekle Kategori" instead of "+ Kategori Ekle".
  const resource = t('resource.category')
  const addLabel = t('crud.addItem', { item: resource })
  const addTitle = addLabel.replace('+', '').trim()

  // The backend enforces slug uniqueness too, but catching it here turns a
  // failed round trip into an inline message beside the field that caused it.
  const slugTaken = categories.some((c) => c.slug === draft.slug.trim() && c.id !== editing?.id)

  useEffect(() => {
    if (!getToken()) {
      navigate('/admin/login', { replace: true })
      return
    }
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load, navigate])

  // A session that expired mid-use, from the initial load or any mutation.
  useEffect(() => {
    if (expired) navigate('/admin/login', { replace: true })
  }, [expired, navigate])

  const openAdd = () => {
    setEditing(null)
    setDraft(emptyDraft())
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setDraft(draftFrom(category))
    setFormError('')
    setFormOpen(true)
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (saving || slugTaken) return

    setSaving(true)
    setFormError('')

    // Both re-fetch and verify before resolving ok, so the toast below cannot
    // fire on a change the backend did not actually keep.
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
    if (result.expired) return // the effect above routes to sign-in
    // Kept inside the dialog, beside the fields, so the operator's input is
    // still on screen to correct. That is why the dialog stays open.
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
      title={t('page.categories.title')}
      description={t('page.categories.desc')}
      actions={
        <Button onClick={openAdd} disabled={status === 'loading'}>
          {addLabel}
        </Button>
      }
    >
      {status === 'loading' && <CategoriesSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.failedToLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && categories.length === 0 && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.empty')}</h2>
          <p>{t('page.categories.desc')}</p>
          <Button onClick={openAdd}>{addLabel}</Button>
        </div>
      )}

      {status === 'ready' && categories.length > 0 && (
        <div className="admin-panel">
          {/* One source list, two presentations: a table from 900px up, and
              stacked cards below it, where four columns plus two buttons
              cannot fit without a horizontal scroll. */}
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('field.name')}</th>
                <th>{t('field.slug')}</th>
                <th>{t('field.order')}</th>
                <th>{t('crud.status')}</th>
                <th className="admin-col-actions">{t('crud.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="admin-cell-title">{c.name}</span>
                    {c.description && <span className="admin-cell-sub">{c.description}</span>}
                  </td>
                  <td>
                    <code className="admin-slug">{c.slug}</code>
                  </td>
                  <td>{c.sort_order}</td>
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
            {categories.map((c) => (
              <li key={c.id} className="admin-card">
                <div className="admin-card-head">
                  <h3>{c.name}</h3>
                  <StatusBadge active={c.is_active} t={t} />
                </div>
                {c.description && <p className="admin-card-desc">{c.description}</p>}
                <dl className="admin-card-meta">
                  <div>
                    <dt>{t('field.slug')}</dt>
                    <dd>
                      <code className="admin-slug">{c.slug}</code>
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
        title={editing ? t('crud.editItem', { item: resource }) : addTitle}
        onClose={() => !saving && setFormOpen(false)}
      >
        <form className="admin-form" onSubmit={onSubmit} noValidate>
          <div className="field full">
            <label htmlFor="cat-name">{t('field.name')} *</label>
            <input
              id="cat-name"
              value={draft.name}
              required
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>

          <div className="field full">
            <label htmlFor="cat-slug">{t('categories.field.slugHint')} *</label>
            <input
              id="cat-slug"
              value={draft.slug}
              required
              aria-invalid={slugTaken || undefined}
              aria-describedby={slugTaken ? 'cat-slug-error' : undefined}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            />
            {slugTaken && (
              <span className="field-error" id="cat-slug-error">
                {t('categories.slugTaken')}
              </span>
            )}
          </div>

          <div className="field full">
            <label htmlFor="cat-description">{t('field.description')}</label>
            <textarea
              id="cat-description"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="cat-order">{t('field.sortOrder')}</label>
            <input
              id="cat-order"
              type="number"
              value={draft.sort_order}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  // An emptied number input reads "", which would post NaN.
                  sort_order: e.target.value === '' ? 0 : Number(e.target.value),
                })
              }
            />
          </div>

          <div className="field admin-check">
            <label htmlFor="cat-active">
              <input
                id="cat-active"
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
            <button type="submit" className="btn btn-fill" disabled={saving || slugTaken}>
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
          {/* The dictionary sentence is "Delete this {item}?", and the old
              page filled {item} with the resource type, not the record name,
              so it reads as a sentence in both languages. The name goes above
              it instead, where it is also easier to scan. */}
          <p className="admin-confirm-name">{confirming?.name}</p>
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

/** Shape-of-the-content placeholder, so the layout does not jump on load. */
function CategoriesSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-panel" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <div className="admin-skeleton-row" key={i}>
          <span className="admin-skeleton" style={{ width: '38%' }} />
          <span className="admin-skeleton" style={{ width: '18%' }} />
          <span className="admin-skeleton" style={{ width: '12%' }} />
        </div>
      ))}
    </div>
  )
}
