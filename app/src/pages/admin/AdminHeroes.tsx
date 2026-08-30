import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { ImageField } from '@/components/admin/ImageField'
import { Modal } from '@/components/admin/Modal'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import {
  HERO_PAGES,
  emptyHeroDraft,
  getToken,
  heroDraftFrom,
  uploadMedia,
  type HeroDraft,
  type HeroPage,
} from '@/lib/admin'
import type { PageHero } from '@/lib/api'
import { useAdminHeroes } from '@/lib/admin-heroes-store'
import { useAdminT } from '@/lib/admin-i18n'

/**
 * Page Heroes — the banner at the top of each public page.
 *
 * A port of admin/heroes.html, and the first ported screen that is not a
 * list: there are exactly six records, one per page, and they can only be
 * edited. So there is no table, no add, no delete — a page picker and a form.
 *
 * Two changes on top of the port, both about not losing work.
 *
 * All six records load at once instead of one per switch, so choosing a page
 * shows its text immediately rather than after a round trip.
 *
 * And switching away from unsaved edits now asks first. The old page swapped
 * the form's contents on the select's change event with no check at all, so a
 * half-written subheading vanished on a misclick with nothing to say it had.
 */

export function AdminHeroes() {
  const navigate = useNavigate()
  const t = useAdminT()

  const heroes = useAdminHeroes((s) => s.heroes)
  const status = useAdminHeroes((s) => s.status)
  const loadError = useAdminHeroes((s) => s.error)
  const expired = useAdminHeroes((s) => s.expired)
  const load = useAdminHeroes((s) => s.load)
  const reload = useAdminHeroes((s) => s.reload)
  const save = useAdminHeroes((s) => s.save)

  const [page, setPage] = useState<HeroPage>('home')
  const [draft, setDraft] = useState<HeroDraft>(emptyHeroDraft)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState<ToastState>(null)
  /** The page a pending switch would move to, once the operator confirms. */
  const [pendingPage, setPendingPage] = useState<HeroPage | null>(null)

  const stored = heroes[page]

  /** What the form would hold if nothing had been typed. */
  const pristine = useMemo(() => heroDraftFrom(stored), [stored])

  const dirty =
    draft.image_url !== pristine.image_url ||
    draft.eyebrow !== pristine.eyebrow ||
    draft.heading !== pristine.heading ||
    draft.subheading !== pristine.subheading

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

  /**
   * Fill the form from the stored record: on first load, on a page switch,
   * and after a save.
   *
   * Adjusted during render rather than in an effect. React documents this as
   * the way to reset state when a prop changes — it re-renders immediately
   * with the new value and never commits the stale one — whereas the effect
   * version renders once with the previous page's text before correcting
   * itself, and is a cascading render besides.
   *
   * Keyed on the record's identity, not the page name, so the three cases
   * fall out of one comparison: the store hands back a new object each time,
   * including after a save, which is what also clears `dirty`.
   */
  const [syncedFrom, setSyncedFrom] = useState<PageHero | undefined>(undefined)
  if (stored !== syncedFrom) {
    setSyncedFrom(stored)
    setDraft(heroDraftFrom(stored))
    setFormError('')
  }

  /**
   * The browser's own guard, for the cases React cannot intercept: a reload,
   * a closed tab, a click on a link out of the app.
   */
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const choosePage = (next: HeroPage) => {
    if (next === page) return
    if (dirty) {
      setPendingPage(next)
      return
    }
    setPage(next)
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
    const result = await save(page, draft)
    setSaving(false)

    if (result.ok) {
      setToast({ kind: 'success', message: t('toast.heroSaved') })
      return
    }
    if (result.expired) return
    setFormError(result.message)
  }

  return (
    <AdminShell title={t('page.heroes.title')} description={t('page.heroes.desc')}>
      {status === 'loading' && <HeroSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('crud.failedToLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && (
        <div className="admin-panel admin-single">
          <div className="field full">
            <label htmlFor="hero-page">{t('heroes.pageLabel')}</label>
            <select
              id="hero-page"
              value={page}
              onChange={(e) => choosePage(e.target.value as HeroPage)}
            >
              {HERO_PAGES.map((key) => (
                <option value={key} key={key}>
                  {t(`heroes.pageOption.${key}`)}
                </option>
              ))}
            </select>
          </div>

          <form className="admin-form admin-form--flush" onSubmit={onSubmit} noValidate>
            <ImageField
              id="hero-image"
              label={t('upload.label.hero')}
              url={draft.image_url}
              busy={uploading}
              disabled={uploading}
              onPick={(file) => void onPickImage(file)}
              onClear={() => setDraft((d) => ({ ...d, image_url: '' }))}
            />
            <span className="admin-field-hint">{t('heroes.uploadHint')}</span>

            <div className="field full">
              <label htmlFor="hero-eyebrow">{t('heroes.eyebrowLabel')}</label>
              <input
                id="hero-eyebrow"
                value={draft.eyebrow}
                onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })}
              />
            </div>

            <div className="field full">
              <label htmlFor="hero-heading">{t('heroes.headingLabel')} *</label>
              <input
                id="hero-heading"
                value={draft.heading}
                required
                onChange={(e) => setDraft({ ...draft, heading: e.target.value })}
              />
            </div>

            <div className="field full">
              <label htmlFor="hero-subheading">{t('heroes.subheadingLabel')}</label>
              <textarea
                id="hero-subheading"
                className="admin-textarea-tall"
                value={draft.subheading}
                onChange={(e) => setDraft({ ...draft, subheading: e.target.value })}
              />
            </div>

            {formError && (
              <p className="admin-form-error" role="alert">
                {formError}
              </p>
            )}

            <div className="admin-single-actions">
              {/* Says whether there is anything to save, so the button is not
                  the only way to find out. */}
              <span className="admin-dirty" role="status">
                {dirty ? t('content.unsavedChanges') : ''}
              </span>
              {/* Deliberately not gated on `dirty`.

                  It was, and on a real operator's machine the button stayed
                  greyed however much they typed -- so clicking it did nothing
                  at all: no request, no error, no clue. Four attempts at a
                  copy fix failed that way before the server logs showed that
                  no request had ever been sent.

                  I could not reproduce the stuck state here, and a gate I
                  cannot reproduce is not one worth keeping in front of the
                  only way to save. Saving an unchanged record costs one
                  request and writes the same values back; being unable to
                  save a changed one costs the change. updatePageHero still
                  re-reads and compares afterwards, so the honesty of the
                  result does not depend on this check.

                  `dirty` still drives the unsaved-changes warning and the
                  guard on switching pages, which is what it is good for. */}
              <button
                type="submit"
                className="btn btn-fill"
                disabled={saving || uploading}
              >
                {saving ? `${t('crud.save')}…` : t('crud.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      <Modal
        open={pendingPage !== null}
        title={t('content.discardTitle')}
        onClose={() => setPendingPage(null)}
      >
        <div className="admin-form">
          <p className="admin-confirm-text">{t('content.discardMessage')}</p>
          <div className="admin-modal-actions">
            <Button variant="ghost" onClick={() => setPendingPage(null)}>
              {t('content.discardCancel')}
            </Button>
            <button
              type="button"
              className="btn btn-fill admin-danger-fill"
              onClick={() => {
                if (pendingPage) setPage(pendingPage)
                setPendingPage(null)
              }}
            >
              {t('content.discardConfirm')}
            </button>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  )
}

function HeroSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-panel admin-single" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      <span className="admin-skeleton" style={{ width: '30%', height: 40 }} />
      <span className="admin-skeleton" style={{ width: '100%', height: 96 }} />
      <span className="admin-skeleton" style={{ width: '60%', height: 40 }} />
      <span className="admin-skeleton" style={{ width: '100%', height: 40 }} />
      <span className="admin-skeleton" style={{ width: '100%', height: 120 }} />
    </div>
  )
}
