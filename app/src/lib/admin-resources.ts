import type { Category, Milestone, NewsItem, Stat } from './api'
import {
  createCategory,
  createMilestone,
  createNews,
  createStat,
  deleteCategory,
  deleteMilestone,
  deleteNews,
  deleteStat,
  listCategories,
  listNews,
  listStats,
  listTimeline,
  updateCategory,
  updateMilestone,
  updateNews,
  updateStat,
  type CategoryDraft,
  type MilestoneDraft,
  type NewsDraft,
  type StatDraft,
} from './admin'
import { createAdminListStore } from './admin-store'

/**
 * One store per simple list resource, each a single call to the factory in
 * admin-store.ts. They were four hand-written copies differing only in the
 * endpoints they called and the name of their items field.
 *
 * Products is not here: it loads the category list alongside its own records,
 * so it keeps a bespoke store. See admin-products-store.ts.
 */

export const useAdminCategories = createAdminListStore<Category, CategoryDraft>({
  list: listCategories,
  create: createCategory,
  update: updateCategory,
  remove: deleteCategory,
})

export const useAdminNews = createAdminListStore<NewsItem, NewsDraft>({
  list: listNews,
  create: createNews,
  update: updateNews,
  remove: deleteNews,
})

export const useAdminStats = createAdminListStore<Stat, StatDraft>({
  list: listStats,
  create: createStat,
  update: updateStat,
  remove: deleteStat,
})

export const useAdminTimeline = createAdminListStore<Milestone, MilestoneDraft>({
  list: listTimeline,
  create: createMilestone,
  update: updateMilestone,
  remove: deleteMilestone,
})
