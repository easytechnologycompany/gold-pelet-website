import { create } from 'zustand'

/**
 * Light is the default, and the OS is not consulted.
 *
 * This used to be three states — explicit light, explicit dark, and unset,
 * where prefers-color-scheme decided. Unset now means light: a visitor on a
 * dark desktop gets the light site until they ask for otherwise, which is the
 * appearance the brand is designed around. `null` is still kept distinct from
 * an explicit `'light'` so that "never chose" and "chose light" stay
 * different things — only the second survives in storage, and only the second
 * would need honouring if the default ever moved again.
 */
export type ThemeChoice = 'light' | 'dark' | null

const STORAGE_KEY = 'gp-theme'

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
}

export const useTheme = create<ThemeState>((set, get) => ({
  choice: readStored(),
  // Unset resolves to light rather than to the system preference.
  isDark: readStored() === 'dark',
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
}))
