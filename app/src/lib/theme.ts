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
