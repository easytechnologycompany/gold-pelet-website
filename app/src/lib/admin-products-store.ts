import { create } from 'zustand'
import type { ApiProduct, Category } from './api'
import {
  createProduct,
  deleteProduct,
  listCategories,
  listProducts,
  updateProduct,
  type ProductDraft,
} from './admin'
import type { ListStatus, Outcome } from './admin-store'
import { toOutcome } from './admin-store'

/**
 * Products admin state. Same shape and reasoning as admin-store.ts: a store
 * rather than component state, so the mount effect calls an action instead of
 * setting state synchronously.
 *
 * It holds categories as well as products, because the page needs both — the
 * category select in the form, and the category *name* for each table row,
 * which the product record does not carry (only `category_id`). The old page
 * did the same, loading categories before products.
 *
 * Every mutation delegates to lib/admin.ts, which re-reads and verifies, so
 * `ok: true` here always means verified-saved.
 */

type ProductsState = {
  products: ApiProduct[]
  categories: Category[]
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
  create: (draft: ProductDraft) => Promise<Outcome>
  update: (id: string, draft: ProductDraft) => Promise<Outcome>
  remove: (id: string) => Promise<Outcome>
}

export const useAdminProducts = create<ProductsState>((set) => ({
  products: [],
  categories: [],
  status: 'loading',
  error: '',
  expired: false,

  load: async (signal) => {
    try {
      // Both together: the table cannot render a row's category name without
      // the category list, so a partial load would show placeholder dashes.
      const [products, categories] = await Promise.all([
        listProducts(signal),
        listCategories(signal),
      ])
      if (signal?.aborted) return
      set({ products, categories, status: 'ready', error: '', expired: false })
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
    await useAdminProducts.getState().load()
  },

  create: async (draft) => {
    try {
      set({ products: await createProduct(draft) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },

  update: async (id, draft) => {
    try {
      set({ products: await updateProduct(id, draft) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },

  remove: async (id) => {
    try {
      set({ products: await deleteProduct(id) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },
}))
