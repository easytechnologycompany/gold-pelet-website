import { ADMIN_LOCALES, useAdminLang, type AdminLocale } from '@/lib/admin-i18n'

const LABEL: Record<AdminLocale, string> = { en: 'EN', tr: 'TR' }
const NAME: Record<AdminLocale, string> = { en: 'English', tr: 'Türkçe' }

/**
 * EN / TR toggle, ported from mountLangSwitcher() in admin/js/i18n.js.
 *
 * Two differences from the original, both consequences of being in React.
 *
 * It does not reload. The old one called window.location.reload() because
 * every CRUD page built its DOM from JS at load time using the active
 * language, so a live swap would have meant re-running each page's render by
 * hand. Here the strings are props of a render that already re-runs on state
 * change, so switching is instant and, more importantly, non-destructive: a
 * half-filled Add dialog survives it.
 *
 * And it is a radio group, not two buttons. Two independent buttons where
 * exactly one is active is what `role="radiogroup"` describes, and it gets
 * arrow-key navigation for free. The public site's language menu makes the
 * same choice with aria-selected.
 */
export function LangSwitch() {
  const locale = useAdminLang((s) => s.locale)
  const setLocale = useAdminLang((s) => s.setLocale)

  return (
    <div className="admin-lang" role="radiogroup" aria-label="Language">
      {ADMIN_LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          role="radio"
          aria-checked={code === locale}
          // Only the active option is in the tab order; the arrow keys move
          // between them, which is the radiogroup contract.
          tabIndex={code === locale ? 0 : -1}
          className={code === locale ? 'is-active' : undefined}
          lang={code}
          title={NAME[code]}
          onClick={() => setLocale(code)}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
            e.preventDefault()
            const i = ADMIN_LOCALES.indexOf(locale)
            const next =
              ADMIN_LOCALES[
                (i + (e.key === 'ArrowRight' ? 1 : ADMIN_LOCALES.length - 1)) % ADMIN_LOCALES.length
              ]
            setLocale(next)
          }}
        >
          <span aria-hidden="true">{LABEL[code]}</span>
          <span className="admin-sr-only">{NAME[code]}</span>
        </button>
      ))}
    </div>
  )
}
