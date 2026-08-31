import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { routeDefaultIsDark, useTheme } from '@/lib/theme'

/**
 * Owns the `data-theme` attribute on `<html>`.
 *
 * An explicit choice wins outright. Without one the route decides: the
 * dashboard is written as `dark`, and the public site has the attribute
 * removed, which is light because index.css carries the light tokens on bare
 * `:root` and reaches for the dark ones only under `[data-theme="dark"]`.
 *
 * The route half has to be re-resolved on navigation. The pre-paint script in
 * index.html gets the first page right, but a client-side move from the site
 * into the dashboard never reloads, so without this the admin would open in
 * whatever the marketing page was using.
 *
 * There is deliberately no prefers-color-scheme listener. The OS no longer has
 * a say, so watching it would only produce a state change that renders the
 * same.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const choice = useTheme((s) => s.choice)
  const syncRoute = useTheme((s) => s.syncRoute)
  const { pathname } = useLocation()

  useEffect(() => {
    syncRoute(pathname)
  }, [pathname, syncRoute])

  useEffect(() => {
    const root = document.documentElement
    if (choice) root.dataset.theme = choice
    else if (routeDefaultIsDark(pathname)) root.dataset.theme = 'dark'
    else delete root.dataset.theme
  }, [choice, pathname])

  return <>{children}</>
}
