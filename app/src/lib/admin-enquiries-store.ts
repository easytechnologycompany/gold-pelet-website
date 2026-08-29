import { create } from 'zustand'
import type { Enquiry, EnquiryStatus } from './api'
import { deleteEnquiry, listEnquiries, updateEnquiryStatus } from './admin'
import type { ListStatus, Outcome } from './admin-store'
import { toOutcome } from './admin-store'

/**
 * Enquiries admin state.
 *
 * Not built on createAdminListStore: these records are created by the public
 * Contact form, never here, so there is no create and no draft. And the list
 * is filtered server-side, which the factory has no notion of — the filter is
 * part of the query, so it lives in the store beside the records it selects.
 */

type EnquiriesState = {
  enquiries: Enquiry[]
  filter: EnquiryStatus | ''
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
  setFilter: (filter: EnquiryStatus | '') => Promise<void>
  setStatus: (id: string, status: EnquiryStatus) => Promise<Outcome>
  remove: (id: string) => Promise<Outcome>
}

export const useAdminEnquiries = create<EnquiriesState>((set, get) => ({
  enquiries: [],
  filter: '',
  status: 'loading',
  error: '',
  expired: false,

  load: async (signal) => {
    try {
      const enquiries = await listEnquiries(get().filter, signal)
      if (signal?.aborted) return
      set({ enquiries, status: 'ready', error: '', expired: false })
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

  setFilter: async (filter) => {
    set({ filter, status: 'loading' })
    await get().load()
  },

  setStatus: async (id, status) => {
    try {
      set({ enquiries: await updateEnquiryStatus(id, status, get().filter) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },

  remove: async (id) => {
    try {
      set({ enquiries: await deleteEnquiry(id, get().filter) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },
}))
