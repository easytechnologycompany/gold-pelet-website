import { create } from 'zustand'
import type { SiteImage } from './api'
import { listSiteImages, updateSiteImage, uploadMedia } from './admin'
import type { ListStatus, Outcome } from './admin-store'
import { toOutcome } from './admin-store'

/**
 * Site images admin state.
 *
 * Not built on createAdminListStore: the ten slots are fixed, so there is no
 * create and no delete — the only action is pointing one slot at a new file.
 *
 * `replace` does both halves of that, upload then save, because they are one
 * action from the operator's side and splitting them across the component
 * would leave the page holding a URL that belongs to no slot yet.
 */

type ImagesState = {
  images: SiteImage[]
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
  replace: (key: string, file: File) => Promise<Outcome>
}

export const useAdminImages = create<ImagesState>((set, get) => ({
  images: [],
  status: 'loading',
  error: '',
  expired: false,

  load: async (signal) => {
    try {
      const images = await listSiteImages(signal)
      if (signal?.aborted) return
      set({ images, status: 'ready', error: '', expired: false })
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

  replace: async (key, file) => {
    try {
      const url = await uploadMedia(file)
      set({ images: await updateSiteImage(key, url) })
      return { ok: true }
    } catch (err) {
      return toOutcome(err)
    }
  },
}))
