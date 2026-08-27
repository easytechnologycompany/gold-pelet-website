import { create } from 'zustand'

/**
 * Three states, not two — explicit light, explicit dark, and `null` meaning
 * "unset", where the OS decides via prefers-color-scheme. The unset state has
 * to stay genuinely unset: resolving it to a concrete value on load would
 * freeze the page against a system theme that can change under it.
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

const systemPrefersDark = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches

type ThemeState = {
  choice: ThemeChoice
  /** What the viewer is actually looking at right now. */
  isDark: boolean
  toggle: () => void
  /** Called when the OS theme changes while the choice is unset. */
  syncSystem: () => void
}

export const useTheme = create<ThemeState>((set, get) => ({
  choice: readStored(),
  isDark: readStored() ? readStored() === 'dark' : systemPrefersDark(),
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
  syncSystem: () => {
    if (get().choice) return // an explicit choice outranks the system
    set({ isDark: systemPrefersDark() })
  },
}))
