import { create } from 'zustand'
import { getOverview, type Overview } from './admin'
import type { ListStatus } from './admin-store'
import { toOutcome } from './admin-store'

/**
 * Overview state. Read-only: the dashboard writes nothing, so there is no
 * mutation here and nothing to verify persisting.
 *
 * `status` is 'error' only when everything failed. A partial result still
 * renders — `failed` names which numbers are missing so the tiles can say so
 * rather than show a confident zero.
 */

/** The old page's five. */
export const RECENT_LIMIT = 5

type OverviewState = {
  overview: Partial<Overview>
  failed: string[]
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
}

export const useAdminOverview = create<OverviewState>((set, get) => ({
  overview: {},
  failed: [],
  status: 'loading',
  error: '',
  expired: false,

  load: async (signal) => {
    try {
      const { overview, failed } = await getOverview(RECENT_LIMIT, signal)
      if (signal?.aborted) return
      set({ overview, failed, status: 'ready', error: '', expired: false })
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
}))
