import { useEffect, type ReactNode } from 'react'
import { useTheme } from '@/lib/theme'

/**
 * Owns the `data-theme` attribute on `<html>`.
 *
 * Removing the attribute is still what "no explicit choice" looks like, and
 * that now resolves to light: index.css carries the light tokens on bare
 * `:root` and reaches for the dark ones only under `[data-theme="dark"]`.
 *
 * There is deliberately no prefers-color-scheme listener here any more. The
 * OS no longer has a say, so watching it would only produce a state change
 * that renders identically.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const choice = useTheme((s) => s.choice)

  useEffect(() => {
    const root = document.documentElement
    if (choice) root.dataset.theme = choice
    else delete root.dataset.theme
  }, [choice])

  return <>{children}</>
}
