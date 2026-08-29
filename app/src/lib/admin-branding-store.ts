import { create } from 'zustand'
import type { Branding } from './api'
import { getBranding, updateBranding, uploadMedia, type BrandingDraft } from './admin'
import type { ListStatus, Outcome } from './admin-store'
import { toOutcome } from './admin-store'

/**
 * Branding admin state: one record, so no list and no factory.
 *
 * Two save paths, kept from the old page because they answer different
 * questions. `saveColours` is an explicit submit. `replaceLogo` fires on pick
 * and persists straight away, so a new logo is not lost by someone who
 * uploads it and then leaves without touching the colour form.
 */

type BrandingState = {
  branding: Branding | null
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
  saveColours: (draft: BrandingDraft) => Promise<Outcome>
  replaceLogo: (file: File, draft: BrandingDraft) => Promise<Outcome>
}

export const useAdminBranding = create<BrandingState>((set, get) => ({
  branding: null,
  status: 'loading',
  error: '',
  expired: false,

  load: async (signal) => {
    try {
      const branding = await getBranding(signal)
      if (signal?.aborted) return
      set({ branding, status: 'ready', error: '', expired: false })
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

  saveColours: async (draft) => {
    try {
      set({ branding: await updateBranding(draft) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },

  replaceLogo: async (file, draft) => {
    try {
      const logo_url = await uploadMedia(file)
      // Sent with the colours currently in the form, so an unsaved colour
      // edit is not silently reverted by the logo save.
      set({ branding: await updateBranding({ ...draft, logo_url }) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },
}))
