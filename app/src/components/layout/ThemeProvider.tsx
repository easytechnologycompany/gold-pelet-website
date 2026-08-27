import { useEffect, type ReactNode } from 'react'
import { useTheme } from '@/lib/theme'

/**
 * Owns the `data-theme` attribute on `<html>` — and, just as importantly,
 * its absence.
 *
 * Three states: explicit light, explicit dark, and unset. Unset means the
 * attribute is *removed*, not set to some resolved value, so the
 * prefers-color-scheme branch in index.css stays in charge and a system theme
 * change is picked up live rather than frozen at load.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const choice = useTheme((s) => s.choice)
  const syncSystem = useTheme((s) => s.syncSystem)

  useEffect(() => {
    const root = document.documentElement
    if (choice) root.dataset.theme = choice
    else delete root.dataset.theme
  }, [choice])

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => syncSystem()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [syncSystem])

  return <>{children}</>
}
