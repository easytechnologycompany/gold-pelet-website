import { create } from 'zustand'
import type { PageHero } from './api'
import { listPageHeroes, updatePageHero, type HeroDraft, type HeroPage } from './admin'
import type { ListStatus, Outcome } from './admin-store'
import { toOutcome } from './admin-store'

/**
 * Page heroes admin state.
 *
 * Not built on createAdminListStore: heroes are not a list. There are exactly
 * six, one per public page, keyed by `page_key`; they cannot be created or
 * deleted, only edited. The factory's create/remove would be dead weight and
 * its `items` array the wrong shape, so this keeps a record keyed by page
 * instead — the same shape useCms stores them in.
 *
 * The save still re-reads and verifies through lib/admin.ts, so `ok: true`
 * here means verified-saved, exactly as it does for the list resources.
 */

type HeroesState = {
  heroes: Record<string, PageHero>
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
  save: (page: HeroPage, draft: HeroDraft) => Promise<Outcome>
}

export const useAdminHeroes = create<HeroesState>((set, get) => ({
  heroes: {},
  status: 'loading',
  error: '',
  expired: false,

  load: async (signal) => {
    try {
      const heroes = await listPageHeroes(signal)
      if (signal?.aborted) return
      set({ heroes, status: 'ready', error: '', expired: false })
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

  save: async (page, draft) => {
    try {
      const stored = await updatePageHero(page, draft)
      // Replace only the record that changed; the other five are untouched.
      set({ heroes: { ...get().heroes, [page]: stored } })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },
}))
