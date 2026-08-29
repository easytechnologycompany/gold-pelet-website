import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import { mediaURL } from '@/lib/api'
import { getToken } from '@/lib/admin'
import { useAdminImages } from '@/lib/admin-images-store'
import { useAdminT } from '@/lib/admin-i18n'

/**
 * Site Images — the ten photo slots used by the Manufacturing Story and the
 * split-image sections.
 *
 * A port of admin/site-images.html. The slots are fixed: each has a key and a
 * label, and the only thing an operator changes is which upload it points at.
 * So there is no table, no add, no delete and no form — a grid of cards, one
 * per slot, each with its own file picker.
 *
 * Saving on pick is kept from the old page rather than added to. It is one
 * deliberate action, the page says outright that changes go live immediately,
 * and a Save button over ten independent slots would only invite the question
 * of which ones it applied to.
 *
 * What is added is the check. The old page swapped the card's photo as soon
 * as the upload returned, so a slot whose save failed looked exactly like one
 * that succeeded until somebody reloaded. Here the card only shows the new
 * photo once a re-read confirms the slot points at it, and a failure says so
 * on the card rather than only in a toast that has since gone.
 */

export function AdminImages() {
  const navigate = useNavigate()
  const t = useAdminT()

  const images = useAdminImages((s) => s.images)
  const status = useAdminImages((s) => s.status)
  const loadError = useAdminImages((s) => s.error)
  const expired = useAdminImages((s) => s.expired)
  const load = useAdminImages((s) => s.load)
  const reload = useAdminImages((s) => s.reload)
  const replace = useAdminImages((s) => s.replace)

  /** The slot currently uploading, and per-slot failures. Keyed, because ten
   *  cards can be worked in any order and a busy one must not block the rest. */
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<ToastState>(null)

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

  const onPick = async (key: string, file: File) => {
    setBusyKey(key)
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })

    const result = await replace(key, file)
    setBusyKey(null)

    if (result.ok) {
      setToast({ kind: 'success', message: t('toast.siteImageUpdated') })
      return
    }
    if (result.expired) return
    setErrors((current) => ({ ...current, [key]: result.message }))
    setToast({ kind: 'error', message: result.message })
  }

  return (
    <AdminShell title={t('page.siteImages.title')} description={t('page.siteImages.desc')}>
      {status === 'loading' && <ImagesSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('toast.siteImagesFailedLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && images.length === 0 && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.empty')}</h2>
          <p>{t('page.siteImages.desc')}</p>
        </div>
      )}

      {status === 'ready' && images.length > 0 && (
        <ul className="admin-image-grid">
          {images.map((image) => {
            const failure = errors[image.image_key]
            const busy = busyKey === image.image_key
            const inputId = `slot-${image.image_key}`
            return (
              <li
                className={`admin-panel admin-image-card${failure ? ' is-failed' : ''}`}
                key={image.image_key}
              >
                <div className="admin-image-shot">
                  {image.image_url ? (
                    <img src={mediaURL(image.image_url)} alt="" loading="lazy" />
                  ) : (
                    <span className="admin-upload-empty" aria-hidden="true" />
                  )}
                  {busy && (
                    <span className="admin-image-busy" role="status">
                      {t('crud.loading')}
                    </span>
                  )}
                </div>

                <div className="admin-image-body">
                  <span className="admin-image-label">{image.label}</span>
                  <code className="admin-slug">{image.image_key}</code>

                  <label className="admin-image-pick" htmlFor={inputId}>
                    <span className="admin-sr-only">
                      {t('upload.label.photo')}: {image.label}
                    </span>
                    <input
                      id={inputId}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      // Only this slot is disabled while it works; the other
                      // nine stay usable.
                      disabled={busy}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void onPick(image.image_key, file)
                        // Cleared so picking the same file again after a
                        // failure still fires change, and the retry works.
                        e.target.value = ''
                      }}
                    />
                  </label>

                  {failure && <span className="field-error">{failure}</span>}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  )
}

function ImagesSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-image-grid" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div className="admin-panel admin-image-card" key={i}>
          <span className="admin-skeleton admin-image-shot" />
          <div className="admin-image-body">
            <span className="admin-skeleton" style={{ width: '70%', height: 14 }} />
            <span className="admin-skeleton" style={{ width: '40%', height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  )
}
