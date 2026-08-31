import { create } from 'zustand'

/**
 * The default depends on where you are: light on the public site, dark in the
 * admin. The OS is not consulted either way.
 *
 * This used to be three states — explicit light, explicit dark, and unset,
 * where prefers-color-scheme decided. Unset now resolves per route: a visitor
 * on a dark desktop gets the light marketing site until they ask otherwise,
 * because that is the appearance the brand is designed around, while the
 * dashboard opens dark because it is a tool someone sits in front of for an
 * afternoon rather than a page they glance at.
 *
 * `null` is still kept distinct from an explicit `'light'`. Only the second
 * survives in storage, and only the second outranks the route default — which
 * is what lets an admin who prefers a light dashboard keep one.
 */
export type ThemeChoice = 'light' | 'dark' | null

/**
 * Bumped from `gp-theme` when light became the default.
 *
 * The old key held explicit choices made while the site still followed the
 * OS, including ones made only to look at the dark palette during the
 * redesign. Those outranked the new default and kept handing dark back to the
 * people who had been testing it, which looked exactly like the default not
 * working. Renaming the key retires every one of them in a single deploy: the
 * old value is simply never read again, so everyone lands on light and the
 * toggle starts from a clean slate.
 */
const STORAGE_KEY = 'gp-theme-2'

/** Where the dashboard lives. Matched on the path rather than passed in, so
 *  the rule cannot drift between the pre-paint script and the store. */
export const isAdminPath = (pathname: string) => pathname.startsWith('/admin')

/** What an unset choice resolves to for a given route. */
export const routeDefaultIsDark = (pathname: string) => isAdminPath(pathname)

const currentPath = () => (typeof location === 'object' ? location.pathname : '/')

const readStored = (): ThemeChoice => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* private mode or blocked storage — unset is the correct fallback */
  }
  return null
}

type ThemeState = {
  choice: ThemeChoice
  /** What the viewer is actually looking at right now. */
  isDark: boolean
  toggle: () => void
  /** Re-resolves an unset choice after a client-side navigation, which is the
   *  only way the route default can change without a reload. */
  syncRoute: (pathname: string) => void
}

export const useTheme = create<ThemeState>((set, get) => ({
  choice: readStored(),
  // Unset resolves to the route's default rather than to the system.
  isDark: readStored() ? readStored() === 'dark' : routeDefaultIsDark(currentPath()),
  toggle: () => {
    // Toggling always produces an explicit choice — the viewer asked for a
    // specific appearance, so we stop deferring to the system.
    const next: ThemeChoice = get().isDark ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* the choice just won't survive a reload */
    }
    set({ choice: next, isDark: next === 'dark' })
  },
  syncRoute: (pathname) => {
    if (get().choice) return // an explicit choice outranks the route
    const next = routeDefaultIsDark(pathname)
    if (next !== get().isDark) set({ isDark: next })
  },
}))
