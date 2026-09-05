import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminShell } from '@/components/admin/AdminShell'
import { Toast, type ToastState } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import { DEFAULT_THEME_TOKENS, tokensToCSSVars, type ThemeTokenKey } from '@/lib/api'
import { THEME_TOKEN_GROUPS, getToken, themeDraftFrom, type ThemeDraft } from '@/lib/admin'
import { useAdminTheme } from '@/lib/admin-theme-store'
import { useAdminT } from '@/lib/admin-i18n'
import { THEME_PRESETS } from '@/lib/theme-presets'

/**
 * Theme & Colours — every colour token the public site's CSS custom-property
 * layer reads (see index.css), light and dark, in one editor.
 *
 * Unlike Branding, this record actually reaches the live pages: `App.tsx`
 * wraps the public layout in a div carrying these as inline `--token: value`
 * custom properties, so every consuming CSS rule picks up whatever is saved
 * here. The admin dashboard's own chrome deliberately does not read this
 * record (see App.tsx's `LiveTheme`) — this page can safely be edited badly
 * without locking the editor itself out.
 *
 * Both modes are held in state together (`ThemeDraft = {light, dark}`) so
 * switching the light/dark toggle never drops an unsaved edit to the other
 * mode; Save always PUTs the whole record, same as Branding.
 */

export function AdminTheme() {
  const navigate = useNavigate()
  const t = useAdminT()

  const theme = useAdminTheme((s) => s.theme)
  const status = useAdminTheme((s) => s.status)
  const loadError = useAdminTheme((s) => s.error)
  const expired = useAdminTheme((s) => s.expired)
  const load = useAdminTheme((s) => s.load)
  const reload = useAdminTheme((s) => s.reload)
  const save = useAdminTheme((s) => s.save)

  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [draft, setDraft] = useState<ThemeDraft>(() => themeDraftFrom(null))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [toast, setToast] = useState<ToastState>(null)

  // Same sync-during-render pattern as AdminBranding: covers the initial
  // load and every successful save in one comparison.
  const [syncedFrom, setSyncedFrom] = useState<typeof theme | undefined>(undefined)
  if (theme !== syncedFrom) {
    setSyncedFrom(theme)
    setDraft(themeDraftFrom(theme))
  }

  const savedDraft = themeDraftFrom(theme)
  const dirty =
    THEME_TOKEN_GROUPS.some((group) =>
      group.keys.some((key) => draft.light[key] !== savedDraft.light[key]),
    ) ||
    THEME_TOKEN_GROUPS.some((group) =>
      group.keys.some((key) => draft.dark[key] !== savedDraft.dark[key]),
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

  const setToken_ = (key: ThemeTokenKey, value: string) =>
    setDraft((d) => ({ ...d, [mode]: { ...d[mode], [key]: value } }))

  const onReset = () => setDraft((d) => ({ ...d, [mode]: DEFAULT_THEME_TOKENS[mode] }))

  // A preset fills both modes at once — it's a full palette, not a single
  // swatch — but only the draft: it still has to be saved like any manual
  // edit, same as every other change on this page.
  const onApplyPreset = (light: ThemeDraft['light'], dark: ThemeDraft['dark']) =>
    setDraft({ light, dark })

  const onSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (saving || !dirty) return

    setSaving(true)
    setSaveError('')
    const result = await save(draft)
    setSaving(false)

    if (result.ok) {
      setToast({ kind: 'success', message: t('toast.themeSaved') })
      return
    }
    if (result.expired) return
    setSaveError(result.message)
    setToast({ kind: 'error', message: t('toast.themeSaveFailed') })
  }

  return (
    <AdminShell title={t('page.theme.title')} description={t('page.theme.desc')}>
      {status === 'loading' && <ThemeSkeleton label={t('crud.loading')} />}

      {status === 'error' && (
        <div className="admin-panel admin-state">
          <h2>{t('toast.themeFailedLoad')}</h2>
          <p>{loadError}</p>
          <Button onClick={() => void reload()}>{t('crud.retry')}</Button>
        </div>
      )}

      {status === 'ready' && (
        <form onSubmit={onSave} noValidate>
          <section className="admin-panel admin-group admin-theme-presets-panel">
            <header className="admin-group-head">
              <div>
                <h2>{t('theme.presetsTitle')}</h2>
                <p>{t('theme.presetsDesc')}</p>
              </div>
            </header>
            <div className="admin-theme-presets">
              {THEME_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.key}
                  className="admin-theme-preset-card"
                  onClick={() => onApplyPreset(preset.light, preset.dark)}
                >
                  <span className="admin-theme-preset-swatch" aria-hidden="true">
                    <span style={{ background: preset.light.bg }}>
                      <span style={{ background: preset.light.heading_color }} />
                      <span style={{ background: preset.light.btn_fill_bg }} />
                    </span>
                    <span style={{ background: preset.dark.bg }}>
                      <span style={{ background: preset.dark.heading_color }} />
                      <span style={{ background: preset.dark.btn_fill_bg }} />
                    </span>
                  </span>
                  <span className="admin-theme-preset-label">{t(preset.labelKey)}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="admin-theme-mode" role="tablist" aria-label={t('page.theme.title')}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'light'}
              className={mode === 'light' ? 'is-active' : undefined}
              onClick={() => setMode('light')}
            >
              {t('theme.modeLight')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'dark'}
              className={mode === 'dark' ? 'is-active' : undefined}
              onClick={() => setMode('dark')}
            >
              {t('theme.modeDark')}
            </button>
          </div>

          <ThemePreview tokens={draft[mode]} label={t('theme.livePreview')} t={t} />

          <div className="admin-groups">
            {THEME_TOKEN_GROUPS.map((group) => (
              <section className="admin-panel admin-group" key={group.label}>
                <header className="admin-group-head">
                  <h2>{t(group.label)}</h2>
                </header>
                <div className="admin-form-row">
                  {group.keys.map((key) => (
                    <div className="field" key={key}>
                      <label htmlFor={`theme-${mode}-${key}`}>{t(`theme.token.${key}`)}</label>
                      <div className="admin-colour-field">
                        <input
                          id={`theme-${mode}-${key}`}
                          type="color"
                          value={draft[mode][key]}
                          onChange={(e) => setToken_(key, e.target.value)}
                        />
                        <code className="admin-slug">{draft[mode][key].toUpperCase()}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {saveError && (
            <p className="admin-form-error" role="alert">
              {saveError}
            </p>
          )}

          <div className="admin-single-actions">
            <Button type="button" variant="ghost" onClick={onReset}>
              {t('theme.resetDefaults')}
            </Button>
            <span className="admin-dirty" role="status">
              {dirty ? t('content.unsavedChanges') : ''}
            </span>
            <button type="submit" className="btn btn-fill" disabled={saving || !dirty}>
              {saving ? `${t('crud.save')}…` : t('theme.save')}
            </button>
          </div>
        </form>
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  )
}

/**
 * A small mock of a real page — header, a section band, a card, and a
 * footer — rendered inside a div carrying the *draft* (unsaved) tokens as
 * inline CSS custom properties. Every picker above therefore updates this
 * instantly, before Save, the same mechanism `App.tsx` uses for the live
 * site.
 *
 * Every one of the 26 tokens gets a distinct visible element here on
 * purpose. Earlier this preview only showed `bg` as a thin margin around
 * the card and had nothing at all for `bg_2`, `header_bg`, `footer_bg`,
 * `muted_text_color` or `icon_color` — so editing any of those looked like
 * it did nothing. `btn_fill_bg_hover`/`_active` and `btn_ghost_border_hover`
 * still have no static swatch here: they're real `:hover`/`:active` CSS on
 * real buttons, so hovering or pressing the preview buttons shows them
 * live, the same as the actual site.
 */
function ThemePreview({
  tokens,
  label,
  t,
}: {
  tokens: ThemeDraft['light']
  label: string
  t: (key: string) => string
}) {
  const vars = tokensToCSSVars(tokens)
  return (
    <section className="admin-panel admin-theme-preview" style={vars as CSSProperties}>
      <span className="admin-field-hint">{label}</span>
      <div className="admin-theme-preview-mock" style={{ background: 'var(--bg)' }}>
        <div className="admin-theme-preview-header" style={{ background: 'var(--header-bg)' }}>
          <svg
            className="admin-theme-preview-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ color: 'var(--icon-color)' }}
          >
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span style={{ color: 'var(--heading-color)' }}>{t('theme.preview.heading')}</span>
        </div>

        <div className="admin-theme-preview-section" style={{ background: 'var(--bg-2)' }}>
          <span className="admin-theme-preview-eyebrow" style={{ color: 'var(--muted-text-color)' }}>
            {t('theme.preview.sectionLabel')}
          </span>

          <div className="admin-theme-preview-surface" style={{ background: 'var(--surface)' }}>
            <h3 style={{ color: 'var(--heading-color)' }}>{t('theme.preview.heading')}</h3>
            <p style={{ color: 'var(--body-text-color)' }}>{t('theme.preview.body')}</p>
            <p style={{ color: 'var(--secondary-text-color)' }}>{t('theme.preview.secondary')}</p>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--link-color)' }}>
              {t('theme.preview.link')}
            </a>
            <div className="admin-theme-preview-row">
              <button type="button" className="btn btn-fill">
                {t('theme.preview.btnFill')}
              </button>
              <button type="button" className="btn btn-ghost">
                {t('theme.preview.btnGhost')}
              </button>
              <button type="button" className="btn btn-fill" disabled>
                {t('theme.preview.btnDisabled')}
              </button>
            </div>
            <div className="admin-theme-preview-row">
              {(
                [
                  ['state_success', 'theme.preview.badgeSuccess'],
                  ['state_warning', 'theme.preview.badgeWarning'],
                  ['state_danger', 'theme.preview.badgeDanger'],
                  ['state_info', 'theme.preview.badgeInfo'],
                ] as const
              ).map(([key, labelKey]) => (
                <span
                  key={key}
                  className="admin-theme-preview-badge"
                  style={{
                    color: tokens[key],
                    borderColor: tokens[key],
                    background: `color-mix(in srgb, ${tokens[key]} 14%, transparent)`,
                  }}
                >
                  {t(labelKey)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-theme-preview-footer" style={{ background: 'var(--footer-bg)' }}>
          <span style={{ color: 'var(--muted-text-color)' }}>{t('theme.preview.footerText')}</span>
        </div>
      </div>
    </section>
  )
}

function ThemeSkeleton({ label }: { label: string }) {
  return (
    <div className="admin-groups" aria-busy="true" aria-live="polite">
      <span className="admin-sr-only">{label}</span>
      {[0, 1, 2].map((card) => (
        <div className="admin-panel admin-group" key={card}>
          <span className="admin-skeleton" style={{ width: '26%', height: 22 }} />
          <span className="admin-skeleton" style={{ width: '100%', height: 72 }} />
          <span className="admin-skeleton" style={{ width: '48%', height: 40 }} />
        </div>
      ))}
    </div>
  )
}
