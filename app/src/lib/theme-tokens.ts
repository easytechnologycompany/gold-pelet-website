import { create } from 'zustand'
import { cmsFetch, DEFAULT_THEME_TOKENS, themeModesFrom, type SiteTheme, type ThemeTokens } from './api'

/**
 * Live theme tokens from the admin-managed API, overlaid on the designed
 * defaults — same contract as `useCms`: nothing here can leave the site
 * unstyled. If the API is unreachable or hasn't been saved to yet, `modes`
 * stays `DEFAULT_THEME_TOKENS`, which is a verbatim copy of index.css's own
 * hardcoded values, so an unreachable backend renders identically to today.
 */

type ThemeTokensState = {
  status: 'idle' | 'loading' | 'ready' | 'unavailable'
  modes: { light: ThemeTokens; dark: ThemeTokens }
  hydrate: () => Promise<void>
}

export const useSiteTheme = create<ThemeTokensState>((set, get) => ({
  status: 'idle',
  modes: DEFAULT_THEME_TOKENS,

  hydrate: async () => {
    if (get().status === 'loading') return
    set({ status: 'loading' })

    const theme = await cmsFetch<SiteTheme>('/public/theme')
    if (!theme) {
      set({ status: 'unavailable' })
      return
    }
    set({ status: 'ready', modes: themeModesFrom(theme) })
  },
}))
