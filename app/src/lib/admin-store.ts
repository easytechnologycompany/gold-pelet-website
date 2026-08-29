import { create } from 'zustand'
import { UnauthorizedError } from './admin'

/**
 * The admin list store, and the factory that builds one per resource.
 *
 * A store rather than component state, for the same reason useCms is one: the
 * mount effect has to kick off a fetch, and calling a setState-bearing
 * function straight from an effect is a cascading render (and what
 * react-hooks/set-state-in-effect flags). App.tsx already does `void
 * hydrate()` against a store for exactly this.
 *
 * Categories, News, Stats and Timeline differ only in which endpoints they
 * call, so they are one factory and four one-line instances. Products keeps
 * its own store because it loads a second resource — it needs the category
 * list for the row labels and the form's select — and folding that in would
 * mean a generic extra-slice parameter that only one caller ever uses.
 *
 * Every mutation delegates to lib/admin.ts, which re-reads the list from the
 * API and throws unless the change actually persisted. So `ok: true` here
 * always means verified-saved, never merely accepted.
 */

export type ListStatus = 'loading' | 'ready' | 'error'

/** Distinguishes "the session went away" so the UI can route to sign-in. */
export type Outcome = { ok: true } | { ok: false; message: string; expired: boolean }

/** Shared so every store classifies errors alike. */
export const toOutcome = (err: unknown): Outcome => ({
  ok: false,
  message: err instanceof Error ? err.message : 'Something went wrong.',
  expired: err instanceof UnauthorizedError,
})

export type AdminListState<T, D> = {
  items: T[]
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
  create: (draft: D) => Promise<Outcome>
  update: (id: string, draft: D) => Promise<Outcome>
  remove: (id: string) => Promise<Outcome>
}

/** The four calls a resource needs; each mutation returns the verified list. */
export type AdminListApi<T, D> = {
  list: (signal?: AbortSignal) => Promise<T[]>
  create: (draft: D) => Promise<T[]>
  update: (id: string, draft: D) => Promise<T[]>
  remove: (id: string) => Promise<T[]>
}

export function createAdminListStore<T, D>(api: AdminListApi<T, D>) {
  return create<AdminListState<T, D>>((set, get) => ({
    items: [],
    status: 'loading',
    error: '',
    expired: false,

    /**
     * Never flips to 'loading' itself — that would be a synchronous setState
     * in the caller's mount effect. The initial status is already 'loading',
     * and reload() sets it before calling in.
     */
    load: async (signal) => {
      try {
        const items = await api.list(signal)
        // An aborted fetch belongs to a component that is already gone.
        if (signal?.aborted) return
        set({ items, status: 'ready', error: '', expired: false })
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

    create: async (draft) => {
      try {
        set({ items: await api.create(draft) })
        return { ok: true }
      } catch (err) {
        return toOutcome(err)
      }
    },

    update: async (id, draft) => {
      try {
        set({ items: await api.update(id, draft) })
        return { ok: true }
      } catch (err) {
        return toOutcome(err)
      }
    },

    remove: async (id) => {
      try {
        set({ items: await api.remove(id) })
        return { ok: true }
      } catch (err) {
        return toOutcome(err)
      }
    },
  }))
}
