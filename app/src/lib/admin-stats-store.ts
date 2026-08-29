import { create } from 'zustand'
import type { Stat } from './api'
import { createStat, deleteStat, listStats, updateStat, type StatDraft } from './admin'
import type { ListStatus, Outcome } from './admin-store'
import { toOutcome } from './admin-store'

/**
 * Stats admin state. Same shape and reasoning as admin-store.ts: a store
 * rather than component state, so the mount effect calls an action instead of
 * setting state synchronously.
 *
 * Every mutation delegates to lib/admin.ts, which re-reads and verifies, so
 * `ok: true` here always means verified-saved.
 */

type StatsState = {
  stats: Stat[]
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
  create: (draft: StatDraft) => Promise<Outcome>
  update: (id: string, draft: StatDraft) => Promise<Outcome>
  remove: (id: string) => Promise<Outcome>
}

export const useAdminStats = create<StatsState>((set) => ({
  stats: [],
  status: 'loading',
  error: '',
  expired: false,

  load: async (signal) => {
    try {
      const stats = await listStats(signal)
      if (signal?.aborted) return
      set({ stats, status: 'ready', error: '', expired: false })
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
    await useAdminStats.getState().load()
  },

  create: async (draft) => {
    try {
      set({ stats: await createStat(draft) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },

  update: async (id, draft) => {
    try {
      set({ stats: await updateStat(id, draft) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },

  remove: async (id) => {
    try {
      set({ stats: await deleteStat(id) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },
}))
