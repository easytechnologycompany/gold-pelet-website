import { useEffect, type ReactNode } from 'react'
import { RTL, useLang } from '@/lib/i18n'

/**
 * Keeps `<html lang>` and `<html dir>` in step with the active locale.
 *
 * Both matter to the stylesheet, not just to assistive tech: `lang` selects
 * the Arabic-script font stack and the per-locale leading overrides, and
 * `dir` drives every logical property in the layout. Setting one without the
 * other gives you Arabic glyphs in a left-to-right grid.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useLang((s) => s.locale)

  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = RTL.has(locale) ? 'rtl' : 'ltr'
  }, [locale])

  return <>{children}</>
}
