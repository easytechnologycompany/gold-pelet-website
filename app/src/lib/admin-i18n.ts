import { create } from 'zustand'
import { ADMIN_LOCALES, ADMIN_TRANSLATIONS, type AdminLocale } from './admin-translations'

export type { AdminLocale }
export { ADMIN_LOCALES }

/**
 * Admin language. English and Turkish, ported from admin/js/i18n.js.
 *
 * Separate from lib/i18n.ts on purpose. That store is the *visitor's*
 * language and drives what the public site renders; this one is the
 * *operator's*, and the two are not the same choice — a Turkish operator may
 * well be previewing the English site. They also differ in range: the public
 * site ships four locales, the admin two.
 *
 * The storage key is the old dashboard's `gp_admin_lang`, so an operator who
 * picked Turkish there arrives here already in Turkish.
 */

const STORAGE_KEY = 'gp_admin_lang'

const isLocale = (v: string | null): v is AdminLocale =>
  Boolean(v) && (ADMIN_LOCALES as readonly string[]).includes(v as string)

const readStored = (): AdminLocale => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    /* private mode or blocked storage — English is a fine default */
  }
  return 'en'
}

type AdminLangState = {
  locale: AdminLocale
  setLocale: (locale: AdminLocale) => void
}

export const useAdminLang = create<AdminLangState>((set) => ({
  locale: readStored(),
  setLocale: (locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* the choice still applies to this session */
    }
    set({ locale })
  },
}))

/** Replaces `{name}` placeholders, matching the old t(key, vars). */
function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  let out = str
  for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v))
  return out
}

/**
 * Looks `key` up in the active locale, falling back to English and then to
 * the key itself — the same three-step the old `t()` used, so a missing
 * string is visible rather than blank.
 */
export function translateAdmin(
  locale: AdminLocale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const value = ADMIN_TRANSLATIONS[locale]?.[key] ?? ADMIN_TRANSLATIONS.en[key] ?? key
  return interpolate(value, vars)
}

/** The hook every admin screen uses: `const t = useAdminT()`. */
export function useAdminT() {
  const locale = useAdminLang((s) => s.locale)
  return (key: string, vars?: Record<string, string | number>) =>
    translateAdmin(locale, key, vars)
}
