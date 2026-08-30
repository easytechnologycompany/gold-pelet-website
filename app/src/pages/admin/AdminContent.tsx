import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { Modal } from '@/components/admin/Modal'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import type { ContentEntry } from '@/lib/api'
import { getToken } from '@/lib/admin'
import { useAdminContent } from '@/lib/admin-content-store'
import { useAdminT } from '@/lib/admin-i18n'

/**
 * Site Content — the one-off text blocks: the footer blurb, the About story,
 * the contact details.
 *
 * A port of admin/content.html, and the only screen edited in bulk. Every
 * field is on the page at once, grouped by which page it belongs to, and a
 * bar appears when something changes to save just those fields. Groups,
 * field kinds, the heading character count and the strings all carry over.
 *
 * The old page already got the important part right: a key that fails to
 * save keeps the operator's text and stays dirty, rather than the whole batch
 * rolling back or silently dropping. What it did not do is check — it moved
 * the baseline on `res.ok`, so a write the backend accepted and dropped read
 * as saved and was lost on the next reload. Here the batch is re-read once
 * and each key is confirmed against it. See lib/admin.ts.
 */

const HEADING_MAX_LEN = 140

/**
 * Which control a field gets, ported verbatim from the old fieldKind().
 * Headings are one line with a soft count, the short factual fields are one
 * line, everything else is a paragraph.
 */
function fieldKind(key: string): 'heading' | 'short' | 'paragraph' {
  if (/heading$/.test(key)) return 'heading'
  if (/(email|phone_primary|phone_secondary|phone_mobile|website)$/.test(key)) return 'short'
  return 'paragraph'
}

/**
 * Groups that map to one public page get a link to it. `global` content —
 * the footer and contact details — appears on every page, so there is no
 * single URL to send anyone to.
 *
 * The old page linked at the legacy static site on another origin. These are
 * routes in this app, so they are Links rather than external anchors.
 */
const GROUP_ROUTE: Record<string, string> = {
  home: '/',
  about: '/about',
  contact: '/contact',
}

const GROUP_TITLE: Record<string, string> = {
  global: 'content.group.global',
  home: 'content.group.home',
  about: 'content.about.title',
  contact: 'content.group.contact',
}

const GROUP_DESC: Record<string, string> = {
  about: 'content.about.desc',
}

export function AdminContent() {
  const navigate = useNavigate()
  const t = useAdminT()

  const entries = useAdminContent((s) => s.entries)
  const baseline = useAdminContent((s) => s.baseline)
  const status = useAdminContent((s) => s.status)
  const loadError = useAdminContent((s) => s.error)
  const expired = useAdminContent((s) => s.expired)
  const load = useAdminContent((s) => s.load)
  const reload = useAdminContent((s) => s.reload)
  const save = useAdminContent((s) => s.save)

  /** content_key -> the value in the field right now. */
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [failedKeys, setFailedKeys] = useState<Record<string, string>>({})
  const [justSaved, setJustSaved] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [discarding, setDiscarding] = useState(false)

  // Sync from the baseline on load and after a save. Adjusted during render,
  // not in an effect: the store hands back a new baseline object each time,
  // so one identity comparison covers both cases without a cascading render.
  //
  // This deliberately does not try to preserve failed fields. It cannot: the
  // store sets the new baseline inside `save()`, so this runs before the
  // handler has had a chance to record which keys failed, and reading
  // `failedKeys` here would see the previous save's set. onSave restores them
  // straight after instead, where the answer is actually known.
  const [syncedFrom, setSyncedFrom] = useState<Record<string, string> | null>(null)
  if (baseline !== syncedFrom) {
    setSyncedFrom(baseline)
    setValues({ ...baseline })
  }

  const dirtyKeys = useMemo(
    () => Object.keys(values).filter((key) => values[key] !== baseline[key]),
    [values, baseline],
  )

  const groups = useMemo(() => {
    const byPage = new Map<string, ContentEntry[]>()
    for (const entry of entries) {
      const list = byPage.get(entry.page) ?? []
      list.push(entry)
      byPage.set(entry.page, list)
    }
    return [...byPage.entries()]
  }, [entries])

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

  useEffect(() => {
    if (!dirtyKeys.length) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirtyKeys.length])

  const onSave = async () => {
    if (saving) return
    setSaving(true)
    setJustSaved(false)

    /* Falls back to every field when nothing reads as changed.
       The gate used to be `!dirtyKeys.length`, which returned before sending
       anything -- so on a machine where the change detection did not fire,
       Save was inert and silent. Writing a field back unchanged costs one
       request and stores the value it already had; refusing to write a
       changed one loses the edit. The save reports per key either way. */
    const keys = dirtyKeys.length ? dirtyKeys : Object.keys(values)
    const edits = Object.fromEntries(keys.map((key) => [key, values[key]]))
    const result = await save(edits)
    setSaving(false)

    // Narrowed: expired only exists on the failure branch of Outcome.
    if (!result.ok && result.expired) return

    const failed = result.report?.failed ?? []
    setFailedKeys(Object.fromEntries(failed.map((f) => [f.key, f.message])))

    // Put back what was typed into the fields that did not save. The baseline
    // sync above has just reset every field to the server's value, which is
    // right for the keys that saved and wrong for these: losing the
    // operator's words because the server rejected them is the one outcome
    // this screen must never produce. They stay dirty, so the save bar stays
    // up and a retry sends them again.
    if (failed.length) {
      setValues((current) => {
        const next = { ...current }
        for (const { key } of failed) next[key] = edits[key]
        return next
      })
    }

    if (result.ok) {
      setJustSaved(true)
      setToast({ kind: 'success', message: t('content.savedToast') })
      // The bar keeps its "saved" note briefly, then goes away — the old
      // page's 2.2s, kept because it is the only confirmation once the toast
      // has gone.
      setTimeout(() => setJustSaved(false), 2200)
      return
    }
    setToast({ kind: 'error', message: t('content.saveErrorToast') })
  }

  const onDiscard = () => {
    setValues({ ...baseline })
    setFailedKeys({})
    setDiscarding(false)
  }

  const barState = saving ? 'saving' : dirtyKeys.length ? 'dirty' : justSaved ? 'saved' : 'clean'

  return (
    <AdminShell title={t('page.content.title')} description={t('page.content.desc')}>
      {status === 'loading' && <ContentSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('toast.contentFailedLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && (
        <div className="admin-groups">
          {groups.map(([page, items]) => (
            <section className="admin-panel admin-group" key={page}>
              <header className="admin-group-head">
                <div>
                  <h2>{GROUP_TITLE[page] ? t(GROUP_TITLE[page]) : page}</h2>
                  {GROUP_DESC[page] && <p>{t(GROUP_DESC[page])}</p>}
                </div>
                {GROUP_ROUTE[page] && (
                  <Link className="btn btn-ghost admin-view-page" to={GROUP_ROUTE[page]}>
                    {t('content.viewPage')}
                  </Link>
                )}
              </header>

              {items.map((entry) => {
                const key = entry.content_key
                const kind = fieldKind(key)
                const value = values[key] ?? ''
                const isDirty = value !== baseline[key]
                const failure = failedKeys[key]
                return (
                  <div className={`field full admin-content-field${isDirty ? ' is-dirty' : ''}`} key={key}>
                    <div className="admin-content-label-row">
                      <label htmlFor={`cf-${key}`}>{entry.label}</label>
                      {kind === 'heading' && (
                        <span
                          className={`admin-char-count${value.length > HEADING_MAX_LEN ? ' is-over' : ''}`}
                        >
                          {value.length} / {HEADING_MAX_LEN}
                        </span>
                      )}
                    </div>
                    {kind === 'paragraph' ? (
                      <textarea
                        id={`cf-${key}`}
                        value={value}
                        aria-invalid={failure ? true : undefined}
                        onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                      />
                    ) : (
                      <input
                        id={`cf-${key}`}
                        value={value}
                        aria-invalid={failure ? true : undefined}
                        onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                      />
                    )}
                    {failure && <span className="field-error">{failure}</span>}
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      )}

      {/* Appears only when there is something to do with it. */}
      {status === 'ready' && barState !== 'clean' && (
        <div className={`admin-save-bar admin-save-bar--${barState}`} role="status" aria-live="polite">
          <span className="admin-save-bar-status">
            {barState === 'saving' && t('content.saving')}
            {barState === 'dirty' && t('content.unsavedChanges')}
            {barState === 'saved' && t('content.changesSaved')}
          </span>
          <div className="admin-save-bar-actions">
            <Button variant="ghost" onClick={() => setDiscarding(true)} disabled={saving || !dirtyKeys.length}>
              {t('content.discardBtn')}
            </Button>
            <button
              type="button"
              className="btn btn-fill"
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving ? t('content.saving') : t('content.saveBtn')}
            </button>
          </div>
        </div>
      )}

      <Modal
        open={discarding}
        title={t('content.discardTitle')}
        onClose={() => setDiscarding(false)}
      >
        <div className="admin-form">
          <p className="admin-confirm-text">{t('content.discardMessage')}</p>
          <div className="admin-modal-actions">
            <Button variant="ghost" onClick={() => setDiscarding(false)}>
              {t('content.discardCancel')}
            </Button>
            <button type="button" className="btn btn-fill admin-danger-fill" onClick={onDiscard}>
              {t('content.discardConfirm')}
            </button>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  )
}

function ContentSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-groups" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      {[0, 1].map((card) => (
        <div className="admin-panel admin-group" key={card}>
          <span className="admin-skeleton" style={{ width: '32%', height: 22 }} />
          <span className="admin-skeleton" style={{ width: '20%', height: 12 }} />
          <span className="admin-skeleton" style={{ width: '100%', height: 44 }} />
          <span className="admin-skeleton" style={{ width: '20%', height: 12 }} />
          <span className="admin-skeleton" style={{ width: '100%', height: 44 }} />
        </div>
      ))}
    </div>
  )
}
