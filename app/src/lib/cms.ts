import { create } from 'zustand'
import { cmsList, type Certification, type Stat } from './api'
import type { Locale } from './i18n'

/**
 * Live content from the admin-managed API, overlaid on top of the designed
 * static content.
 *
 * The direction matters: the design is the baseline and the CMS is the
 * enhancement, never the other way round. Nothing here can blank a section —
 * if the API is unreachable the store simply stays empty and every consumer
 * falls back to the string it was designed with. That is what makes the page
 * safe to ship before the backend's CORS headers are in place.
 *
 * Scope is deliberately narrow: only the endpoints whose data actually
 * corresponds to something in the approved design. See app/README.md for
 * what is intentionally *not* consumed and why.
 */

export type CmsStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

type CmsState = {
  status: CmsStatus
  /** Keyed by `stat_key` for direct lookup from a bento cell. */
  stats: Record<string, Stat>
  certifications: Certification[]
  hydrate: () => Promise<void>
}

const bySortOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order

export const useCms = create<CmsState>((set, get) => ({
  status: 'idle',
  stats: {},
  certifications: [],

  hydrate: async () => {
    if (get().status === 'loading') return
    set({ status: 'loading' })

    const [stats, certifications] = await Promise.all([
      cmsList<Stat>('/public/stats'),
      cmsList<Certification>('/public/certifications'),
    ])

    // Both empty means the API gave us nothing usable — reachable but bare,
    // or blocked. Either way the designed content stands.
    if (!stats.length && !certifications.length) {
      set({ status: 'unavailable' })
      return
    }

    set({
      status: 'ready',
      stats: Object.fromEntries(
        stats.filter((s) => s.is_active).map((s) => [s.stat_key, s]),
      ),
      certifications: certifications.filter((c) => c.is_active).sort(bySortOrder),
    })
  },
}))

/**
 * Renders a live stat as display text: localized digits plus the unit as the
 * CMS stores it, e.g. `50+ t/day` in English and `٥٠+ t/day` in Arabic.
 *
 * Digits are localized because the designed Arabic copy sets Arabic-Indic
 * numerals throughout and a Latin numeral beside them reads as a mistake.
 * The unit suffix is *not* translated — the API has no translation column
 * for it, so `t/day` stays as authored. Worth revisiting if the CMS ever
 * grows localized units.
 */
export const formatStat = (stat: Stat, locale: Locale): string => {
  const digitLocale = locale === 'ar' || locale === 'ku' ? 'ar-EG' : locale
  return `${new Intl.NumberFormat(digitLocale).format(stat.value_number)}${stat.unit_suffix}`
}
