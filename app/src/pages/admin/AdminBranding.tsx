import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import { mediaURL, type Branding } from '@/lib/api'
import {
  BRANDING_COLOURS,
  brandingDraftFrom,
  getToken,
  type BrandingDraft,
} from '@/lib/admin'
import { useAdminBranding } from '@/lib/admin-branding-store'
import { useAdminT } from '@/lib/admin-i18n'

/**
 * Branding & Logo — the single record holding the brand colours and the logo.
 *
 * A port of admin/branding.html. One record, so no list; two save paths,
 * because they answer different questions. The logo persists on pick, so a
 * new one is not lost by someone who uploads it and then leaves without
 * touching the colour form. The colours have an explicit submit.
 *
 * The colour fields are edited faithfully but they no longer reach these
 * pages: the redesign has its own token palette and reads only `logo_url`
 * from this record (see components/layout/Chrome and lib/cms). The legacy
 * site still applies them, in js/cms.js. That is a real gap between what the
 * form implies and what an operator would see, so the card says so rather
 * than leaving someone to discover it by changing a colour and finding
 * nothing moved.
 */

const COLOUR_LABEL: Record<(typeof BRANDING_COLOURS)[number], string> = {
  primary_hex: 'branding.primary',
  primary_dark_hex: 'branding.primaryDark',
  primary_light_hex: 'branding.primaryLight',
  accent_navy_hex: 'branding.accentNavy',
}

export function AdminBranding() {
  const navigate = useNavigate()
  const t = useAdminT()

  const branding = useAdminBranding((s) => s.branding)
  const status = useAdminBranding((s) => s.status)
  const loadError = useAdminBranding((s) => s.error)
  const expired = useAdminBranding((s) => s.expired)
  const load = useAdminBranding((s) => s.load)
  const reload = useAdminBranding((s) => s.reload)
  const saveColours = useAdminBranding((s) => s.saveColours)
  const replaceLogo = useAdminBranding((s) => s.replaceLogo)

  const [draft, setDraft] = useState<BrandingDraft>(() => brandingDraftFrom(null))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [colourError, setColourError] = useState('')
  const [logoError, setLogoError] = useState('')
  const [toast, setToast] = useState<ToastState>(null)

  // Sync from the record during render, keyed on its identity — same pattern
  // as Page Heroes. Covers the initial load and both saves in one comparison.
  const [syncedFrom, setSyncedFrom] = useState<Branding | null | undefined>(undefined)
  if (branding !== syncedFrom) {
    setSyncedFrom(branding)
    setDraft(brandingDraftFrom(branding))
  }

  const coloursDirty = BRANDING_COLOURS.some(
    (key) => draft[key] !== brandingDraftFrom(branding)[key],
  )

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

  const onPickLogo = async (file: File) => {
    setUploading(true)
    setLogoError('')
    // The colours in the form go with it, so an unsaved colour edit is not
    // reverted by the logo save writing the record back.
    const result = await replaceLogo(file, draft)
    setUploading(false)

    if (result.ok) {
      setToast({ kind: 'success', message: t('toast.logoUpdated') })
      return
    }
    if (result.expired) return
    setLogoError(result.message)
    setToast({ kind: 'error', message: t('toast.logoSaveFailed') })
  }

  const onSaveColours = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (saving || uploading || !coloursDirty) return

    setSaving(true)
    setColourError('')
    const result = await saveColours(draft)
    setSaving(false)

    if (result.ok) {
      setToast({ kind: 'success', message: t('toast.brandingSaved') })
      return
    }
    if (result.expired) return
    setColourError(result.message)
  }

  return (
    <AdminShell title={t('page.branding.title')} description={t('page.branding.desc')}>
      {status === 'loading' && <BrandingSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('toast.brandingFailedLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && (
        <div className="admin-groups">
          <section className="admin-panel admin-group">
            <header className="admin-group-head">
              <div>
                <h2>{t('branding.logoTitle')}</h2>
                <p>{t('branding.logoShownHint')}</p>
              </div>
            </header>

            <div className="admin-upload">
              {draft.logo_url ? (
                <img className="admin-logo-preview" src={mediaURL(draft.logo_url)} alt="" />
              ) : (
                <span className="admin-logo-preview admin-upload-empty" aria-hidden="true" />
              )}
              <div className="admin-upload-controls">
                <label htmlFor="branding-logo" className="admin-sr-only">
                  {t('upload.label.logo')}
                </label>
                <input
                  id="branding-logo"
                  type="file"
                  // SVG too, unlike the other uploads on the site.
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                  disabled={uploading || saving}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void onPickLogo(file)
                    e.target.value = ''
                  }}
                />
                {uploading && <span className="admin-upload-status">{t('crud.loading')}</span>}
              </div>
            </div>
            <span className="admin-field-hint">{t('branding.logoUploadHint')}</span>
            {logoError && (
              <p className="admin-form-error" role="alert">
                {logoError}
              </p>
            )}
          </section>

          <section className="admin-panel admin-group">
            <header className="admin-group-head">
              <div>
                <h2>{t('branding.colorsTitle')}</h2>
              </div>
            </header>

            {/* Said plainly, because the form otherwise implies an effect it
                does not have on these pages. */}
            <p className="admin-field-warning" role="note">
              {t('branding.colorsScopeNote')}
            </p>

            <form className="admin-form admin-form--flush" onSubmit={onSaveColours} noValidate>
              <div className="admin-form-row">
                {BRANDING_COLOURS.map((key) => (
                  <div className="field" key={key}>
                    <label htmlFor={`branding-${key}`}>{t(COLOUR_LABEL[key])}</label>
                    <div className="admin-colour-field">
                      <input
                        id={`branding-${key}`}
                        type="color"
                        value={draft[key]}
                        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                      />
                      {/* The value in the form designers actually use. */}
                      <code className="admin-slug">{draft[key].toUpperCase()}</code>
                    </div>
                  </div>
                ))}
              </div>

              {colourError && (
                <p className="admin-form-error" role="alert">
                  {colourError}
                </p>
              )}

              <div className="admin-single-actions">
                <span className="admin-dirty" role="status">
                  {coloursDirty ? t('content.unsavedChanges') : ''}
                </span>
                <button
                  type="submit"
                  className="btn btn-fill"
                  disabled={saving || uploading || !coloursDirty}
                >
                  {saving ? `${t('crud.save')}…` : t('branding.saveColors')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  )
}

function BrandingSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-groups" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      {[0, 1].map((card) => (
        <div className="admin-panel admin-group" key={card}>
          <span className="admin-skeleton" style={{ width: '26%', height: 22 }} />
          <span className="admin-skeleton" style={{ width: '100%', height: 72 }} />
          <span className="admin-skeleton" style={{ width: '48%', height: 40 }} />
        </div>
      ))}
    </div>
  )
}
