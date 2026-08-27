import { create } from 'zustand'
import {
  cmsList,
  cmsFetch,
  type ApiProduct,
  type Branding,
  type Category,
  type Certification,
  type ContentEntry,
  type Milestone,
  type NewsItem,
  type PageHero,
  type SiteImage,
  type Stat,
} from './api'
import type { Locale } from './i18n'

/**
 * Live content from the admin-managed API, overlaid on top of the designed
 * static content.
 *
 * The direction matters: the design is the baseline and the CMS is the
 * enhancement, never the other way round. Nothing here can blank a section —
 * if the API is unreachable the store simply stays empty and every consumer
 * falls back to the string or artwork it was designed with. That is what
 * makes the page safe to ship before the backend's CORS headers are in place.
 */

export type CmsStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

type CmsState = {
  status: CmsStatus
  /** Keyed by `stat_key` for direct lookup from a bento cell. */
  stats: Record<string, Stat>
  certifications: Certification[]
  /** About-page milestones, in order. */
  milestones: Milestone[]
  /** Events & News: featured first, then each item's own order. */
  news: NewsItem[]
  /** Active products, ordered by category then the product's own order. */
  products: ApiProduct[]
  categories: Record<string, Category>
  /** Keyed by `page_key`: the admin-managed hero for each of the six pages. */
  heroes: Record<string, PageHero>
  /** Keyed by `image_key`, e.g. `story.extrusion`. */
  images: Record<string, SiteImage>
  /** Keyed by `content_key`, e.g. `contact.email`. */
  content: Record<string, string>
  branding: Branding | null
  hydrate: () => Promise<void>
}

/** The six pages the site publishes, matching the header nav and `page_key`. */
const PAGE_KEYS = ['home', 'products', 'services', 'about', 'news', 'contact'] as const

const bySortOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order

export const useCms = create<CmsState>((set, get) => ({
  status: 'idle',
  stats: {},
  certifications: [],
  milestones: [],
  news: [],
  products: [],
  categories: {},
  heroes: {},
  images: {},
  content: {},
  branding: null,

  hydrate: async () => {
    if (get().status === 'loading') return
    set({ status: 'loading' })

    const [
      stats,
      certifications,
      products,
      categories,
      images,
      content,
      branding,
      milestones,
      news,
      heroes,
    ] = await Promise.all([
      cmsList<Stat>('/public/stats'),
      cmsList<Certification>('/public/certifications'),
      cmsList<ApiProduct>('/public/products'),
      cmsList<Category>('/public/categories'),
      cmsList<SiteImage>('/public/site-images'),
      cmsList<ContentEntry>('/public/content'),
      cmsFetch<Branding>('/public/branding'),
      cmsList<Milestone>('/public/timeline'),
      cmsList<NewsItem>('/public/news'),
      // One endpoint per page rather than a collection, so this fans out and
      // drops whichever pages the API does not answer for.
      Promise.all(
        PAGE_KEYS.map((page) => cmsFetch<PageHero>(`/public/page-heroes/${page}`)),
      ).then((list) => list.filter((h): h is PageHero => Boolean(h))),
    ])

    // Nothing usable came back — reachable but bare, or blocked. Either way
    // the designed content stands.
    if (!stats.length && !certifications.length && !products.length && !content.length) {
      set({ status: 'unavailable' })
      return
    }

    const categoriesById = Object.fromEntries(
      categories.filter((c) => c.is_active).map((c) => [c.id, c]),
    )

    // `sort_order` restarts per category, so it only orders products *within*
    // one category — the category's own order has to come first or the rail
    // interleaves the three ranges.
    const activeProducts = products
      .filter((p) => p.is_active)
      .sort((a, b) => {
        const ca = categoriesById[a.category_id]?.sort_order ?? Number.MAX_SAFE_INTEGER
        const cb = categoriesById[b.category_id]?.sort_order ?? Number.MAX_SAFE_INTEGER
        return ca - cb || a.sort_order - b.sort_order
      })
      .map((p) => ({ ...p, specs: [...p.specs].sort(bySortOrder) }))

    set({
      status: 'ready',
      stats: Object.fromEntries(stats.filter((s) => s.is_active).map((s) => [s.stat_key, s])),
      certifications: certifications.filter((c) => c.is_active).sort(bySortOrder),
      milestones: milestones.filter((m) => m.is_active).sort(bySortOrder),
      // Featured first, because the news page leads with that item and the
      // rest follow in their own order — the same shape the live site uses.
      news: news
        .filter((n) => n.is_active)
        .sort(
          (a, b) => Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order,
        ),
      products: activeProducts,
      categories: categoriesById,
      heroes: Object.fromEntries(heroes.map((h) => [h.page_key, h])),
      images: Object.fromEntries(images.map((i) => [i.image_key, i])),
      content: Object.fromEntries(content.map((c) => [c.content_key, c.content_value])),
      // Stored for its logo only. The colour fields describe the *old* brand
      // (green #446931 / navy #0B4363) and applying them would overwrite the
      // approved black-and-gold token system, so nothing reads them.
      branding,
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
 * for it, so `t/day` stays as authored.
 */
export const formatStat = (stat: Stat, locale: Locale): string => {
  const digitLocale = locale === 'ar' || locale === 'ku' ? 'ar-EG' : locale
  return `${new Intl.NumberFormat(digitLocale).format(stat.value_number)}${stat.unit_suffix}`
}
