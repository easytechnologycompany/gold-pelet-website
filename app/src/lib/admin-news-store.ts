import { create } from 'zustand'
import type { NewsItem } from './api'
import { createNews, deleteNews, listNews, updateNews, type NewsDraft } from './admin'
import type { ListStatus, Outcome } from './admin-store'
import { toOutcome } from './admin-store'

/**
 * Events & News admin state. Same shape and reasoning as admin-store.ts: a
 * store rather than component state, so the mount effect calls an action
 * instead of setting state synchronously.
 *
 * Every mutation delegates to lib/admin.ts, which re-reads and verifies, so
 * `ok: true` here always means verified-saved.
 */

type NewsState = {
  news: NewsItem[]
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
  create: (draft: NewsDraft) => Promise<Outcome>
  update: (id: string, draft: NewsDraft) => Promise<Outcome>
  remove: (id: string) => Promise<Outcome>
}

export const useAdminNews = create<NewsState>((set) => ({
  news: [],
  status: 'loading',
  error: '',
  expired: false,

  load: async (signal) => {
    try {
      const news = await listNews(signal)
      if (signal?.aborted) return
      set({ news, status: 'ready', error: '', expired: false })
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
    await useAdminNews.getState().load()
  },

  create: async (draft) => {
    try {
      set({ news: await createNews(draft) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },

  update: async (id, draft) => {
    try {
      set({ news: await updateNews(id, draft) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },

  remove: async (id) => {
    try {
      set({ news: await deleteNews(id) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },
}))
