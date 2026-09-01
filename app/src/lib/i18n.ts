import { create } from 'zustand'

export type Locale = 'en' | 'ar' | 'tr'

export const LOCALES: readonly Locale[] = ['en', 'ar', 'tr']

/** Arabic script locales. RTL, with the connected-script rules in index.css —
 *  `tr` is Latin and stays LTR. Kurdish was the other member until it was
 *  withdrawn; the set is kept as a set because it is a property of the script,
 *  not a count of how many locales happen to have it. */
export const RTL: ReadonlySet<Locale> = new Set<Locale>(['ar'])

export const LOCALE_CODE: Record<Locale, string> = { en: 'EN', ar: 'ع', tr: 'TR' }
export const LOCALE_NAME: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  tr: 'Türkçe',
}

/**
 * A translatable string. Only `en` is required: a locale with no string for a
 * node falls back to English rather than rendering empty, which is the rule
 * the static page shipped with and the reason a locale could land
 * incrementally without blanking the page.
 */
export type Str = { en: string; ar?: string; tr?: string }

export const pick = (s: Str, locale: Locale): string => s[locale] ?? s.en

const STORAGE_KEY = 'gp-lang'

const readStored = (): Locale => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && (LOCALES as readonly string[]).includes(v)) return v as Locale
  } catch {
    /* private mode or blocked storage — English is a fine default */
  }
  return 'en'
}

type LangState = {
  locale: Locale
  setLocale: (l: Locale) => void
}

export const useLang = create<LangState>((set) => ({
  locale: readStored(),
  setLocale: (locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* nothing to do — the choice just won't survive a reload */
    }
    set({ locale })
  },
}))

/** Resolves `Str` values against the active locale. */
export const useT = () => {
  const locale = useLang((s) => s.locale)
  return {
    locale,
    rtl: RTL.has(locale),
    t: (s: Str) => pick(s, locale),
  }
}
