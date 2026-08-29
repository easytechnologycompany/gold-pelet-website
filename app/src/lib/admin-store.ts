import { create } from 'zustand'
import type { Category } from './api'
import {
  UnauthorizedError,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type CategoryDraft,
} from './admin'

/**
 * Categories admin state.
 *
 * A store rather than component state, for the same reason useCms is one: the
 * mount effect has to kick off a fetch, and calling a setState-bearing
 * function straight from an effect is a cascading render (and what
 * react-hooks/set-state-in-effect flags). App.tsx already does `void
 * hydrate()` against a store for exactly this; this follows that pattern.
 *
 * Every mutation delegates to lib/admin.ts, which re-reads the list from the
 * API and throws unless the change actually persisted. So `status: 'saved'`
 * here always means verified-saved, never merely accepted.
 */

export type ListStatus = 'loading' | 'ready' | 'error'

/** Distinguishes "the session went away" so the UI can route to sign-in. */
export type Outcome = { ok: true } | { ok: false; message: string; expired: boolean }

const outcome = (err: unknown): Outcome => ({
  ok: false,
  message: err instanceof Error ? err.message : 'Something went wrong.',
  expired: err instanceof UnauthorizedError,
})

type CategoriesState = {
  categories: Category[]
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
  create: (draft: CategoryDraft) => Promise<Outcome>
  update: (id: string, draft: CategoryDraft) => Promise<Outcome>
  remove: (id: string) => Promise<Outcome>
}

export const useAdminCategories = create<CategoriesState>((set) => ({
  categories: [],
  status: 'loading',
  error: '',
  expired: false,

  load: async (signal) => {
    try {
      const categories = await listCategories(signal)
      // An aborted fetch belongs to a component that is already gone.
      if (signal?.aborted) return
      set({ categories, status: 'ready', error: '', expired: false })
    } catch (err) {
      if (signal?.aborted) return
      const result = outcome(err)
      set({ status: 'error', error: result.ok ? '' : result.message, expired: !result.ok && result.expired })
    }
  },

  reload: async () => {
    set({ status: 'loading' })
    await useAdminCategories.getState().load()
  },

  create: async (draft) => {
    try {
      set({ categories: await createCategory(draft) })
      return { ok: true }
    } catch (err) {
      return outcome(err)
    }
  },

  update: async (id, draft) => {
    try {
      set({ categories: await updateCategory(id, draft) })
      return { ok: true }
    } catch (err) {
      return outcome(err)
    }
  },

  remove: async (id) => {
    try {
      set({ categories: await deleteCategory(id) })
      return { ok: true }
    } catch (err) {
      return outcome(err)
    }
  },
}))
