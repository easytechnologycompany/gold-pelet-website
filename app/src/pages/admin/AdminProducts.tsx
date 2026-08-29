import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { Modal } from '@/components/admin/Modal'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import { mediaURL, type ApiProduct } from '@/lib/api'
import {
  emptyProductDraft,
  getToken,
  productDraftFrom,
  uploadMedia,
  type ProductDraft,
} from '@/lib/admin'
import { useAdminProducts } from '@/lib/admin-products-store'
import { useAdminT } from '@/lib/admin-i18n'

/**
 * The product catalogue — every item on the Products page, with its category,
 * spec chips and the raw/fried photo pair the public card toggles between.
 *
 * A port of admin/products.html, which had its own page script rather than
 * using crud.js (it needs a category select, two uploads and a chip editor).
 * The payload, the endpoints, the table columns and the strings all carry
 * over unchanged; lib/admin.ts is the API half and
 * lib/admin-products-store.ts holds the state.
 *
 * Same deliberate change as the Categories page: the old script toasted on
 * `res.ok`, so a write the backend accepted and dropped still read as
 * success. Every mutation here re-reads and verifies first.
 */

type Translate = (key: string, vars?: Record<string, string | number>) => string

/** Which of the two photos an upload is for. */
type ImageSide = 'raw' | 'fried'

function StatusBadge({ active, t }: { active: boolean; t: Translate }) {
  return (
    <span className={`admin-badge admin-badge--${active ? 'active' : 'hidden'}`}>
      {t(active ? 'crud.active' : 'crud.hidden')}
    </span>
  )
}

export function AdminProducts() {
  const navigate = useNavigate()
  const t = useAdminT()

  const products = useAdminProducts((s) => s.products)
  const categories = useAdminProducts((s) => s.categories)
  const status = useAdminProducts((s) => s.status)
  const loadError = useAdminProducts((s) => s.error)
  const expired = useAdminProducts((s) => s.expired)
  const load = useAdminProducts((s) => s.load)
  const reload = useAdminProducts((s) => s.reload)
  const create = useAdminProducts((s) => s.create)
  const update = useAdminProducts((s) => s.update)
  const remove = useAdminProducts((s) => s.remove)

  const [toast, setToast] = useState<ToastState>(null)

  const [editing, setEditing] = useState<ApiProduct | null>(null)
  const [draft, setDraft] = useState<ProductDraft>(emptyProductDraft)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [specInput, setSpecInput] = useState('')
  const [uploading, setUploading] = useState<ImageSide | null>(null)

  const [confirming, setConfirming] = useState<ApiProduct | null>(null)
  const [deleting, setDeleting] = useState(false)

  const resource = t('resource.product')
  const addLabel = t('crud.addItem', { item: resource })

  const slugTaken = products.some((p) => p.slug === draft.slug.trim() && p.id !== editing?.id)

  /** The product record carries only `category_id`; the table shows the name. */
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—'

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
    // The old page defaulted the select to the first category; a product with
    // no category is not a valid record, so the form should never open on one.
    setDraft(emptyProductDraft(categories[0]?.id ?? ''))
    setSpecInput('')
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (product: ApiProduct) => {
    setEditing(product)
    setDraft(productDraftFrom(product))
    setSpecInput('')
    setFormError('')
    setFormOpen(true)
  }

  const addSpec = () => {
    const value = specInput.trim()
    if (!value) return
    setDraft((d) => ({ ...d, specs: [...d.specs, value] }))
    setSpecInput('')
  }

  const onSpecKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter adds the chip rather than submitting the form around it.
    if (e.key !== 'Enter') return
    e.preventDefault()
    addSpec()
  }

  const onPickImage = async (side: ImageSide, file: File | undefined) => {
    if (!file) return
    setUploading(side)
    setFormError('')
    try {
      const url = await uploadMedia(file)
      setDraft((d) => ({ ...d, [side === 'raw' ? 'raw_image_url' : 'fried_image_url']: url }))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'The upload failed.')
    } finally {
      setUploading(null)
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (saving || slugTaken || !draft.category_id) return

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

  /** Shared by both upload fields, which differ only in side and label. */
  const imageField = (side: ImageSide) => {
    const url = side === 'raw' ? draft.raw_image_url : draft.fried_image_url
    const id = `product-${side}-image`
    return (
      <div className="field">
        <label htmlFor={id}>{t(side === 'raw' ? 'products.field.rawImage' : 'products.field.friedImage')}</label>
        <div className="admin-upload">
          {url ? (
            <img className="admin-upload-preview" src={mediaURL(url)} alt="" />
          ) : (
            <span className="admin-upload-preview admin-upload-empty" aria-hidden="true" />
          )}
          <div className="admin-upload-controls">
            <input
              id={id}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              disabled={uploading !== null}
              onChange={(e) => void onPickImage(side, e.target.files?.[0])}
            />
            {uploading === side && <span className="admin-upload-status">{t('crud.loading')}</span>}
            {url && uploading !== side && (
              <button
                type="button"
                className="admin-link-btn"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    [side === 'raw' ? 'raw_image_url' : 'fried_image_url']: '',
                  }))
                }
              >
                {t('crud.delete')}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminShell
      title={t('page.products.title')}
      description={t('page.products.desc')}
      actions={
        <Button onClick={openAdd} disabled={status === 'loading' || categories.length === 0}>
          {addLabel}
        </Button>
      }
    >
      {status === 'loading' && <ProductsSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.failedToLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {/* A product must belong to a category, so with none defined the Add
          button has nothing valid to open. Say why, and point at the fix. */}
      {status === 'ready' && categories.length === 0 && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.empty')}</h2>
          <p>{t('page.categories.desc')}</p>
          <Button onClick={() => navigate('/admin/categories')}>{t('nav.categories')}</Button>
        </div>
      )}

      {status === 'ready' && categories.length > 0 && products.length === 0 && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.empty')}</h2>
          <p>{t('page.products.desc')}</p>
          <Button onClick={openAdd}>{addLabel}</Button>
        </div>
      )}

      {status === 'ready' && products.length > 0 && (
        <div className="admin-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('page.products.colProduct')}</th>
                <th>{t('resource.category')}</th>
                <th>{t('page.products.colFeatured')}</th>
                <th>{t('page.products.colOrder')}</th>
                <th>{t('page.dashboard.status')}</th>
                <th className="admin-col-actions">{t('crud.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-product-cell">
                      <ProductThumb product={p} />
                      <span>
                        <span className="admin-cell-title">{p.name}</span>
                        <span className="admin-cell-sub">
                          <code className="admin-slug">{p.slug}</code>
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>{categoryName(p.category_id)}</td>
                  <td>{p.is_featured ? t('crud.yes') : ''}</td>
                  <td>{p.sort_order}</td>
                  <td>
                    <StatusBadge active={p.is_active} t={t} />
                  </td>
                  <td className="admin-col-actions">
                    <div className="admin-row-actions">
                      <Button variant="ghost" onClick={() => openEdit(p)}>
                        {t('crud.edit')}
                      </Button>
                      <Button variant="ghost" className="admin-danger" onClick={() => setConfirming(p)}>
                        {t('crud.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="admin-cards">
            {products.map((p) => (
              <li key={p.id} className="admin-card">
                <div className="admin-card-head">
                  <div className="admin-product-cell">
                    <ProductThumb product={p} />
                    <h3>{p.name}</h3>
                  </div>
                  <StatusBadge active={p.is_active} t={t} />
                </div>
                <dl className="admin-card-meta">
                  <div>
                    <dt>{t('resource.category')}</dt>
                    <dd>{categoryName(p.category_id)}</dd>
                  </div>
                  <div>
                    <dt>{t('page.products.colOrder')}</dt>
                    <dd>{p.sort_order}</dd>
                  </div>
                  {p.is_featured && (
                    <div>
                      <dt>{t('page.products.colFeatured')}</dt>
                      <dd>{t('crud.yes')}</dd>
                    </div>
                  )}
                </dl>
                <div className="admin-row-actions">
                  <Button variant="ghost" onClick={() => openEdit(p)}>
                    {t('crud.edit')}
                  </Button>
                  <Button variant="ghost" className="admin-danger" onClick={() => setConfirming(p)}>
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
        title={editing ? t('page.products.editTitle') : t('page.products.addTitle')}
        onClose={() => !saving && setFormOpen(false)}
      >
        <form className="admin-form" onSubmit={onSubmit} noValidate>
          <div className="field full">
            <label htmlFor="product-category">{t('products.field.category')}</label>
            <select
              id="product-category"
              value={draft.category_id}
              required
              onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-form-row">
            <div className="field">
              <label htmlFor="product-name">{t('field.nameRequired')}</label>
              <input
                id="product-name"
                value={draft.name}
                required
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="product-slug">{t('field.slugRequired')}</label>
              <input
                id="product-slug"
                value={draft.slug}
                required
                aria-invalid={slugTaken || undefined}
                aria-describedby={slugTaken ? 'product-slug-error' : undefined}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
              {slugTaken && (
                <span className="field-error" id="product-slug-error">
                  {t('categories.slugTaken')}
                </span>
              )}
            </div>
          </div>

          <div className="field full">
            <label htmlFor="product-description">{t('field.description')}</label>
            <textarea
              id="product-description"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <div className="admin-form-row">
            {imageField('raw')}
            {imageField('fried')}
          </div>
          <p className="admin-field-hint">{t('products.field.imageHint')}</p>

          <div className="field full">
            <label htmlFor="product-spec">{t('products.field.specChips')}</label>
            <div className="admin-spec-entry">
              <input
                id="product-spec"
                value={specInput}
                placeholder={t('products.field.specPlaceholder')}
                onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={onSpecKeyDown}
              />
              <Button variant="ghost" onClick={addSpec} disabled={!specInput.trim()}>
                {t('products.field.specAdd')}
              </Button>
            </div>
            {draft.specs.length > 0 && (
              <ul className="admin-chips">
                {draft.specs.map((spec, i) => (
                  <li key={`${spec}-${i}`} className="admin-chip">
                    <span>{spec}</span>
                    <button
                      type="button"
                      aria-label={`${t('crud.delete')} ${spec}`}
                      onClick={() =>
                        setDraft((d) => ({ ...d, specs: d.specs.filter((_, j) => j !== i) }))
                      }
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-form-row">
            <div className="field">
              <label htmlFor="product-order">{t('field.sortOrder')}</label>
              <input
                id="product-order"
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
              <label htmlFor="product-featured">
                <input
                  id="product-featured"
                  type="checkbox"
                  checked={draft.is_featured}
                  onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })}
                />
                <span>{t('products.field.featuredCheckbox')}</span>
              </label>
            </div>
          </div>

          <div className="field admin-check">
            <label htmlFor="product-active">
              <input
                id="product-active"
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
            <button
              type="submit"
              className="btn btn-fill"
              disabled={saving || slugTaken || uploading !== null}
            >
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

/** The raw photo if there is one, else a neutral plate — never a broken img. */
function ProductThumb({ product }: { product: ApiProduct }) {
  const src = product.raw_image_url || product.fried_image_url
  if (!src) return <span className="admin-thumb admin-thumb--empty" aria-hidden="true" />
  return <img className="admin-thumb" src={mediaURL(src)} alt="" loading="lazy" />
}

function ProductsSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-panel" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      {[0, 1, 2, 3].map((i) => (
        <div className="admin-skeleton-row" key={i}>
          <span className="admin-skeleton admin-skeleton--thumb" />
          <span className="admin-skeleton" style={{ width: '30%' }} />
          <span className="admin-skeleton" style={{ width: '16%' }} />
          <span className="admin-skeleton" style={{ width: '10%' }} />
        </div>
      ))}
    </div>
  )
}
