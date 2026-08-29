import { create } from 'zustand'
import type { ContentEntry } from './api'
import { listContent, saveContent, type ContentSaveReport } from './admin'
import type { ListStatus, Outcome } from './admin-store'
import { toOutcome } from './admin-store'

/**
 * Site content admin state.
 *
 * Not built on createAdminListStore, for the same reason as heroes: these
 * records cannot be created or deleted, only edited. And unlike every other
 * screen they are edited *in bulk* — one form holding every field, saving
 * only what changed — so the store carries a baseline of last-saved values
 * alongside the records themselves.
 *
 * The baseline is what makes per-field dirty tracking possible, and it moves
 * only for keys a re-read confirmed. A key whose write was accepted but not
 * stored stays dirty, with the operator's text still in the field.
 */

type ContentState = {
  entries: ContentEntry[]
  /** content_key -> last value confirmed stored. The dirty-tracking baseline. */
  baseline: Record<string, string>
  status: ListStatus
  error: string
  expired: boolean
  load: (signal?: AbortSignal) => Promise<void>
  reload: () => Promise<void>
  save: (edits: Record<string, string>) => Promise<Outcome & { report?: ContentSaveReport }>
}

const baselineOf = (entries: ContentEntry[]): Record<string, string> =>
  Object.fromEntries(entries.map((e) => [e.content_key, e.content_value ?? '']))

export const useAdminContent = create<ContentState>((set, get) => ({
  entries: [],
  baseline: {},
  status: 'loading',
  error: '',
  expired: false,

  load: async (signal) => {
    try {
      const entries = await listContent(signal)
      if (signal?.aborted) return
      set({ entries, baseline: baselineOf(entries), status: 'ready', error: '', expired: false })
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

  save: async (edits) => {
    try {
      const { list, report } = await saveContent(edits)
      // The baseline follows the re-read, so it advances for confirmed keys
      // and stays put for the rest without any special casing here.
      set({ entries: list, baseline: baselineOf(list) })
      return report.failed.length
        ? { ok: false, message: report.failed[0].message, expired: false, report }
        : { ok: true, report }
    } catch (err) {
      return toOutcome(err)
    }
  },
}))
