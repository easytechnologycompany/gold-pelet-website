import { create } from 'zustand'
import type { SiteTheme } from './api'
import { getThemeTokens, updateThemeTokens, type ThemeDraft } from './admin'
import type { ListStatus, Outcome } from './admin-store'
import { toOutcome } from './admin-store'

/**
 * Theme admin state: one record, so no list and no factory — same shape as
 * `admin-branding-store.ts`.
 */

type ThemeState = {
  theme: SiteTheme | null
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
  save: (draft: ThemeDraft) => Promise<Outcome>
}

export const useAdminTheme = create<ThemeState>((set, get) => ({
  theme: null,
  status: 'loading',
  error: '',
  expired: false,

  load: async (signal) => {
    try {
      const theme = await getThemeTokens(signal)
      if (signal?.aborted) return
      set({ theme, status: 'ready', error: '', expired: false })
    } catch (err) {
      if (signal?.aborted) return
      const result = toOutcome(err)
      set({
        status: 'error',
        error: result.ok ? '' : result.message,
        expired: !result.ok && result.expired,
      })
    }
  },

  reload: async () => {
    set({ status: 'loading' })
    await get().load()
  },

  save: async (draft) => {
    try {
      set({ theme: await updateThemeTokens(draft) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },
}))
