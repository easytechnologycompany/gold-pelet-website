import { API_BASE } from './api'
import type {
  ApiProduct,
  Branding,
  Category,
  Certification,
  ContentEntry,
  Enquiry,
  EnquiryStatus,
  Milestone,
  NewsItem,
  PageHero,
  SiteImage,
  Stat,
} from './api'

/**
 * Admin API client — the authenticated half of the backend, ported from
 * admin/js/api.js and admin/js/crud.js.
 *
 * Deliberately separate from lib/api.ts. That module is the public, read-only
 * client whose contract is "never throws, a null means keep what is on
 * screen": exactly right for a marketing page that must render with or
 * without the CMS. An admin screen needs the opposite contract — a failed
 * write has to be loud, and the reason has to reach the operator — so this
 * one throws AdminError and the UI renders the message.
 *
 * Same backend, same `gp_admin_token` key and same bearer scheme as the
 * existing dashboard, so a session started in either is valid in the other.
 */

const TOKEN_KEY = 'gp_admin_token'

export class AdminError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'AdminError'
    this.status = status
  }
}

/** Thrown on a 401 so callers can send the operator back to sign in. */
export class UnauthorizedError extends AdminError {
  constructor(message = 'Session expired. Please sign in again.') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

/** The backend's failure body is `{ "error": "..." }`; fall back to the status. */
async function errorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json()
    return data?.error || `Request failed (${res.status})`
  } catch {
    return `Request failed (${res.status})`
  }
}

type FetchOptions = { method?: string; body?: unknown; signal?: AbortSignal }

/**
 * Attaches the bearer token and JSON-encodes the body, mirroring apiFetch().
 * A 401 clears the stored token and throws UnauthorizedError rather than
 * navigating, so the caller decides where to go — the old client hard-set
 * window.location, which a single-page app must not do.
 *
 * FormData passes through untouched and, critically, without a Content-Type:
 * the browser has to set that header itself so it can append the multipart
 * boundary. Setting it by hand produces a body the server cannot parse.
 */
export async function adminFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const isForm = options.body instanceof FormData
  if (options.body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined
          ? undefined
          : isForm
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch {
    // Offline, DNS, or CORS. Kept distinct from an HTTP error because the
    // operator's next move differs: check the connection, not the input.
    throw new AdminError('Could not reach the server. Check your connection and try again.')
  }

  if (res.status === 401) {
    clearToken()
    throw new UnauthorizedError()
  }
  if (!res.ok) throw new AdminError(await errorMessage(res), res.status)

  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

// ---------------- auth ----------------

/** POST /admin/auth/login — same endpoint and payload as admin/login.html. */
export async function login(email: string, password: string): Promise<void> {
  const { token } = await adminFetch<{ token: string }>('/admin/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  if (!token) throw new AdminError('The server did not return a session token.')
  setToken(token)
}

// ---------------- categories ----------------

/** The editable fields: exactly the five in the old page's `fields` array. */
export type CategoryDraft = {
  name: string
  slug: string
  description: string
  sort_order: number
  is_active: boolean
}

/** Matches the old page's `defaults: { is_active: true, sort_order: 0 }`. */
export const emptyDraft = (): CategoryDraft => ({
  name: '',
  slug: '',
  description: '',
  sort_order: 0,
  is_active: true,
})

export const draftFrom = (c: Category): CategoryDraft => ({
  name: c.name,
  slug: c.slug,
  description: c.description ?? '',
  sort_order: c.sort_order,
  is_active: c.is_active,
})

export const listCategories = (signal?: AbortSignal) =>
  adminFetch<{ data: Category[] }>('/admin/categories', { signal }).then((r) => r?.data ?? [])

const payload = (draft: CategoryDraft) => ({
  name: draft.name.trim(),
  slug: draft.slug.trim(),
  description: draft.description.trim(),
  sort_order: draft.sort_order,
  is_active: draft.is_active,
})

/**
 * True when the stored record carries everything the draft asked for.
 *
 * This is the check behind "do not show a success toast unless the backend
 * truly saved the change". A 2xx only says the request was accepted; it does
 * not say the row changed. Comparing the re-fetched record against the draft
 * is what makes the toast honest, and it catches the exact failure mode this
 * project has already hit once: a write the API accepts and silently drops.
 */
function matchesDraft(stored: Category, draft: CategoryDraft): boolean {
  const want = payload(draft)
  return (
    stored.name === want.name &&
    stored.slug === want.slug &&
    (stored.description ?? '').trim() === want.description &&
    stored.sort_order === want.sort_order &&
    stored.is_active === want.is_active
  )
}

/**
 * Every mutation below re-reads the list from the API and returns it, so the
 * caller renders server truth rather than an optimistic guess, and throws
 * when the change did not persist. Callers therefore only ever report
 * success on a verified write.
 */

export async function createCategory(draft: CategoryDraft): Promise<Category[]> {
  const created = await adminFetch<Category>('/admin/categories', {
    method: 'POST',
    body: payload(draft),
  })
  const list = await listCategories()
  // Prefer the id the POST returned; fall back to the slug, which is unique.
  const stored =
    list.find((c) => c.id === created?.id) ?? list.find((c) => c.slug === payload(draft).slug)
  if (!stored) {
    throw new AdminError('The server accepted the category but it is not in the list. Nothing was saved.')
  }
  if (!matchesDraft(stored, draft)) {
    throw new AdminError('The category was created but saved with different values. Check the fields and try again.')
  }
  return list
}

export async function updateCategory(id: string, draft: CategoryDraft): Promise<Category[]> {
  await adminFetch<Category>(`/admin/categories/${id}`, { method: 'PUT', body: payload(draft) })
  const list = await listCategories()
  const stored = list.find((c) => c.id === id)
  if (!stored) throw new AdminError('The category disappeared after saving. Reload and check the list.')
  if (!matchesDraft(stored, draft)) {
    throw new AdminError('The server accepted the change but did not save it. Nothing was updated.')
  }
  return list
}

export async function deleteCategory(id: string): Promise<Category[]> {
  await adminFetch<void>(`/admin/categories/${id}`, { method: 'DELETE' })
  const list = await listCategories()
  if (list.some((c) => c.id === id)) {
    throw new AdminError('The server accepted the delete but the category is still there.')
  }
  return list
}

// ---------------- media ----------------

/**
 * POST /admin/media/upload, multipart, returns the stored path.
 *
 * The old page uploaded on file-select and kept the returned URL in a
 * variable until save, which is the behaviour kept here: an image that is
 * uploaded but never saved leaves an orphan on disk, but the alternative is
 * holding the file in memory and posting it with the record, which the API
 * has no endpoint for.
 */
export async function uploadMedia(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const asset = await adminFetch<{ url: string }>('/admin/media/upload', {
    method: 'POST',
    body: form,
  })
  if (!asset?.url) throw new AdminError('The upload succeeded but returned no URL.')
  return asset.url
}

// ---------------- products ----------------

/**
 * The editable fields of a product, matching the payload admin/products.html
 * posts. `specs` is the one place read and write shapes differ: the API
 * returns `{ id, product_id, label, sort_order }` objects and accepts a plain
 * array of labels, so the draft holds labels and order carries the meaning.
 */
export type ProductDraft = {
  category_id: string
  name: string
  slug: string
  description: string
  raw_image_url: string
  fried_image_url: string
  is_featured: boolean
  sort_order: number
  is_active: boolean
  specs: string[]
}

/** The old page defaulted the select to the first category and is_active on. */
export const emptyProductDraft = (categoryId = ''): ProductDraft => ({
  category_id: categoryId,
  name: '',
  slug: '',
  description: '',
  raw_image_url: '',
  fried_image_url: '',
  is_featured: false,
  sort_order: 0,
  is_active: true,
  specs: [],
})

export const productDraftFrom = (p: ApiProduct): ProductDraft => ({
  category_id: p.category_id,
  name: p.name,
  slug: p.slug,
  description: p.description ?? '',
  raw_image_url: p.raw_image_url ?? '',
  fried_image_url: p.fried_image_url ?? '',
  is_featured: p.is_featured,
  sort_order: p.sort_order,
  is_active: p.is_active,
  specs: (p.specs ?? []).map((s) => s.label),
})

export const listProducts = (signal?: AbortSignal) =>
  adminFetch<{ data: ApiProduct[] }>('/admin/products', { signal }).then((r) => r?.data ?? [])

const productPayload = (draft: ProductDraft) => ({
  category_id: draft.category_id,
  name: draft.name.trim(),
  slug: draft.slug.trim(),
  description: draft.description.trim(),
  raw_image_url: draft.raw_image_url,
  fried_image_url: draft.fried_image_url,
  is_featured: draft.is_featured,
  sort_order: draft.sort_order,
  is_active: draft.is_active,
  specs: draft.specs.map((s) => s.trim()).filter(Boolean),
})

/**
 * The products equivalent of matchesDraft, and the reason both exist: a 2xx
 * says the request was accepted, not that the row changed.
 *
 * `specs` is compared as an ordered list of labels because order is the only
 * thing carrying their sort_order — dropping or reordering a chip is a real
 * change the operator would otherwise be told had saved.
 */
function matchesProductDraft(stored: ApiProduct, draft: ProductDraft): boolean {
  const want = productPayload(draft)
  const storedSpecs = (stored.specs ?? []).map((s) => s.label)
  return (
    stored.category_id === want.category_id &&
    stored.name === want.name &&
    stored.slug === want.slug &&
    (stored.description ?? '').trim() === want.description &&
    (stored.raw_image_url ?? '') === want.raw_image_url &&
    (stored.fried_image_url ?? '') === want.fried_image_url &&
    stored.is_featured === want.is_featured &&
    stored.sort_order === want.sort_order &&
    stored.is_active === want.is_active &&
    storedSpecs.length === want.specs.length &&
    storedSpecs.every((label, i) => label === want.specs[i])
  )
}

export async function createProduct(draft: ProductDraft): Promise<ApiProduct[]> {
  const created = await adminFetch<ApiProduct>('/admin/products', {
    method: 'POST',
    body: productPayload(draft),
  })
  const list = await listProducts()
  const stored =
    list.find((p) => p.id === created?.id) ?? list.find((p) => p.slug === productPayload(draft).slug)
  if (!stored) {
    throw new AdminError('The server accepted the product but it is not in the list. Nothing was saved.')
  }
  if (!matchesProductDraft(stored, draft)) {
    throw new AdminError('The product was created but saved with different values. Check the fields and try again.')
  }
  return list
}

export async function updateProduct(id: string, draft: ProductDraft): Promise<ApiProduct[]> {
  await adminFetch<ApiProduct>(`/admin/products/${id}`, { method: 'PUT', body: productPayload(draft) })
  const list = await listProducts()
  const stored = list.find((p) => p.id === id)
  if (!stored) throw new AdminError('The product disappeared after saving. Reload and check the list.')
  if (!matchesProductDraft(stored, draft)) {
    throw new AdminError('The server accepted the change but did not save it. Nothing was updated.')
  }
  return list
}

export async function deleteProduct(id: string): Promise<ApiProduct[]> {
  await adminFetch<void>(`/admin/products/${id}`, { method: 'DELETE' })
  const list = await listProducts()
  if (list.some((p) => p.id === id)) {
    throw new AdminError('The server accepted the delete but the product is still there.')
  }
  return list
}

// ---------------- news ----------------

/** The eight fields admin/news.html configures crud.js with. */
export type NewsDraft = {
  image_url: string
  title: string
  description: string
  date_label: string
  icon_key: string
  is_featured: boolean
  sort_order: number
  is_active: boolean
}

/**
 * Matches the old page's
 * `defaults: { is_active: true, is_featured: false, sort_order: 0, icon_key: 'flag' }`.
 * `icon_key` defaulting to a value rather than empty is the reason this is a
 * function per resource rather than one generic empty-object helper.
 */
export const emptyNewsDraft = (): NewsDraft => ({
  image_url: '',
  title: '',
  description: '',
  date_label: '',
  icon_key: 'flag',
  is_featured: false,
  sort_order: 0,
  is_active: true,
})

export const newsDraftFrom = (n: NewsItem): NewsDraft => ({
  image_url: n.image_url ?? '',
  title: n.title,
  description: n.description ?? '',
  date_label: n.date_label,
  icon_key: n.icon_key ?? '',
  is_featured: n.is_featured,
  sort_order: n.sort_order,
  is_active: n.is_active,
})

export const listNews = (signal?: AbortSignal) =>
  adminFetch<{ data: NewsItem[] }>('/admin/news', { signal }).then((r) => r?.data ?? [])

const newsPayload = (draft: NewsDraft) => ({
  image_url: draft.image_url,
  title: draft.title.trim(),
  description: draft.description.trim(),
  date_label: draft.date_label.trim(),
  icon_key: draft.icon_key.trim(),
  is_featured: draft.is_featured,
  sort_order: draft.sort_order,
  is_active: draft.is_active,
})

/**
 * The news equivalent of matchesDraft. `image_url` is compared against `?? ''`
 * because the API omits the field entirely when it is null, so a record with
 * no photo comes back without the key rather than with an explicit null.
 */
function matchesNewsDraft(stored: NewsItem, draft: NewsDraft): boolean {
  const want = newsPayload(draft)
  return (
    (stored.image_url ?? '') === want.image_url &&
    stored.title === want.title &&
    (stored.description ?? '').trim() === want.description &&
    stored.date_label === want.date_label &&
    (stored.icon_key ?? '') === want.icon_key &&
    stored.is_featured === want.is_featured &&
    stored.sort_order === want.sort_order &&
    stored.is_active === want.is_active
  )
}

export async function createNews(draft: NewsDraft): Promise<NewsItem[]> {
  const created = await adminFetch<NewsItem>('/admin/news', {
    method: 'POST',
    body: newsPayload(draft),
  })
  const list = await listNews()
  // News has no slug, so there is no natural unique key to fall back on: the
  // id the POST returned is the only reliable way to find the new row, and
  // title is the tie-breaker because two items may legitimately share one.
  const stored =
    list.find((n) => n.id === created?.id) ??
    list.find((n) => n.title === newsPayload(draft).title && matchesNewsDraft(n, draft))
  if (!stored) {
    throw new AdminError('The server accepted the news item but it is not in the list. Nothing was saved.')
  }
  if (!matchesNewsDraft(stored, draft)) {
    throw new AdminError('The news item was created but saved with different values. Check the fields and try again.')
  }
  return list
}

export async function updateNews(id: string, draft: NewsDraft): Promise<NewsItem[]> {
  await adminFetch<NewsItem>(`/admin/news/${id}`, { method: 'PUT', body: newsPayload(draft) })
  const list = await listNews()
  const stored = list.find((n) => n.id === id)
  if (!stored) throw new AdminError('The news item disappeared after saving. Reload and check the list.')
  if (!matchesNewsDraft(stored, draft)) {
    throw new AdminError('The server accepted the change but did not save it. Nothing was updated.')
  }
  return list
}

export async function deleteNews(id: string): Promise<NewsItem[]> {
  await adminFetch<void>(`/admin/news/${id}`, { method: 'DELETE' })
  const list = await listNews()
  if (list.some((n) => n.id === id)) {
    throw new AdminError('The server accepted the delete but the news item is still there.')
  }
  return list
}

// ---------------- stats ----------------

/** The six fields admin/stats.html configures crud.js with. */
export type StatDraft = {
  stat_key: string
  label: string
  value_number: number
  unit_suffix: string
  sort_order: number
  is_active: boolean
}

/** Matches the old page's `defaults: { is_active: true, sort_order: 0 }`. */
export const emptyStatDraft = (): StatDraft => ({
  stat_key: '',
  label: '',
  value_number: 0,
  unit_suffix: '',
  sort_order: 0,
  is_active: true,
})

export const statDraftFrom = (s: Stat): StatDraft => ({
  stat_key: s.stat_key,
  label: s.label,
  value_number: s.value_number,
  unit_suffix: s.unit_suffix ?? '',
  sort_order: s.sort_order,
  is_active: s.is_active,
})

export const listStats = (signal?: AbortSignal) =>
  adminFetch<{ data: Stat[] }>('/admin/stats', { signal }).then((r) => r?.data ?? [])

const statPayload = (draft: StatDraft) => ({
  stat_key: draft.stat_key.trim(),
  label: draft.label.trim(),
  value_number: draft.value_number,
  unit_suffix: draft.unit_suffix.trim(),
  sort_order: draft.sort_order,
  is_active: draft.is_active,
})

/**
 * `value_number` is compared exactly rather than with a tolerance. The field
 * takes two decimals, and a backend that rounded 12.34 to 12.3 has changed
 * the number the site displays — that is precisely the case the operator
 * needs told about, not smoothed over.
 */
function matchesStatDraft(stored: Stat, draft: StatDraft): boolean {
  const want = statPayload(draft)
  return (
    stored.stat_key === want.stat_key &&
    stored.label === want.label &&
    stored.value_number === want.value_number &&
    (stored.unit_suffix ?? '') === want.unit_suffix &&
    stored.sort_order === want.sort_order &&
    stored.is_active === want.is_active
  )
}

export async function createStat(draft: StatDraft): Promise<Stat[]> {
  const created = await adminFetch<Stat>('/admin/stats', {
    method: 'POST',
    body: statPayload(draft),
  })
  const list = await listStats()
  // stat_key is the unique key here, the way slug is for categories.
  const stored =
    list.find((s) => s.id === created?.id) ?? list.find((s) => s.stat_key === statPayload(draft).stat_key)
  if (!stored) {
    throw new AdminError('The server accepted the stat but it is not in the list. Nothing was saved.')
  }
  if (!matchesStatDraft(stored, draft)) {
    throw new AdminError('The stat was created but saved with different values. Check the fields and try again.')
  }
  return list
}

export async function updateStat(id: string, draft: StatDraft): Promise<Stat[]> {
  await adminFetch<Stat>(`/admin/stats/${id}`, { method: 'PUT', body: statPayload(draft) })
  const list = await listStats()
  const stored = list.find((s) => s.id === id)
  if (!stored) throw new AdminError('The stat disappeared after saving. Reload and check the list.')
  if (!matchesStatDraft(stored, draft)) {
    throw new AdminError('The server accepted the change but did not save it. Nothing was updated.')
  }
  return list
}

export async function deleteStat(id: string): Promise<Stat[]> {
  await adminFetch<void>(`/admin/stats/${id}`, { method: 'DELETE' })
  const list = await listStats()
  if (list.some((s) => s.id === id)) {
    throw new AdminError('The server accepted the delete but the stat is still there.')
  }
  return list
}

// ---------------- timeline ----------------

/** The five fields admin/timeline.html configures crud.js with. */
export type MilestoneDraft = {
  year_label: string
  title: string
  description: string
  sort_order: number
  is_active: boolean
}

/** Matches the old page's `defaults: { is_active: true, sort_order: 0 }`. */
export const emptyMilestoneDraft = (): MilestoneDraft => ({
  year_label: '',
  title: '',
  description: '',
  sort_order: 0,
  is_active: true,
})

export const milestoneDraftFrom = (m: Milestone): MilestoneDraft => ({
  year_label: m.year_label,
  title: m.title,
  description: m.description ?? '',
  sort_order: m.sort_order,
  is_active: m.is_active,
})

export const listTimeline = (signal?: AbortSignal) =>
  adminFetch<{ data: Milestone[] }>('/admin/timeline', { signal }).then((r) => r?.data ?? [])

const milestonePayload = (draft: MilestoneDraft) => ({
  year_label: draft.year_label.trim(),
  title: draft.title.trim(),
  description: draft.description.trim(),
  sort_order: draft.sort_order,
  is_active: draft.is_active,
})

function matchesMilestoneDraft(stored: Milestone, draft: MilestoneDraft): boolean {
  const want = milestonePayload(draft)
  return (
    stored.year_label === want.year_label &&
    stored.title === want.title &&
    (stored.description ?? '').trim() === want.description &&
    stored.sort_order === want.sort_order &&
    stored.is_active === want.is_active
  )
}

export async function createMilestone(draft: MilestoneDraft): Promise<Milestone[]> {
  const created = await adminFetch<Milestone>('/admin/timeline', {
    method: 'POST',
    body: milestonePayload(draft),
  })
  const list = await listTimeline()
  // Like news, a milestone has no unique key of its own: the id the POST
  // returned is the reliable lookup, and a full field match is the fallback
  // because two milestones may share a year and a title.
  const stored =
    list.find((m) => m.id === created?.id) ?? list.find((m) => matchesMilestoneDraft(m, draft))
  if (!stored) {
    throw new AdminError('The server accepted the milestone but it is not in the list. Nothing was saved.')
  }
  if (!matchesMilestoneDraft(stored, draft)) {
    throw new AdminError('The milestone was created but saved with different values. Check the fields and try again.')
  }
  return list
}

export async function updateMilestone(id: string, draft: MilestoneDraft): Promise<Milestone[]> {
  await adminFetch<Milestone>(`/admin/timeline/${id}`, { method: 'PUT', body: milestonePayload(draft) })
  const list = await listTimeline()
  const stored = list.find((m) => m.id === id)
  if (!stored) throw new AdminError('The milestone disappeared after saving. Reload and check the list.')
  if (!matchesMilestoneDraft(stored, draft)) {
    throw new AdminError('The server accepted the change but did not save it. Nothing was updated.')
  }
  return list
}

export async function deleteMilestone(id: string): Promise<Milestone[]> {
  await adminFetch<void>(`/admin/timeline/${id}`, { method: 'DELETE' })
  const list = await listTimeline()
  if (list.some((m) => m.id === id)) {
    throw new AdminError('The server accepted the delete but the milestone is still there.')
  }
  return list
}

// ---------------- certifications ----------------

/** The five fields admin/certifications.html configures crud.js with. */
export type CertificationDraft = {
  name: string
  description: string
  icon_key: string
  sort_order: number
  is_active: boolean
}

/**
 * Matches the old page's
 * `defaults: { is_active: true, sort_order: 0, icon_key: 'shield-check' }`.
 */
export const emptyCertificationDraft = (): CertificationDraft => ({
  name: '',
  description: '',
  icon_key: 'shield-check',
  sort_order: 0,
  is_active: true,
})

export const certificationDraftFrom = (c: Certification): CertificationDraft => ({
  name: c.name,
  description: c.description ?? '',
  icon_key: c.icon_key ?? '',
  sort_order: c.sort_order,
  is_active: c.is_active,
})

export const listCertifications = (signal?: AbortSignal) =>
  adminFetch<{ data: Certification[] }>('/admin/certifications', { signal }).then((r) => r?.data ?? [])

const certificationPayload = (draft: CertificationDraft) => ({
  name: draft.name.trim(),
  description: draft.description.trim(),
  icon_key: draft.icon_key.trim(),
  sort_order: draft.sort_order,
  is_active: draft.is_active,
})

function matchesCertificationDraft(stored: Certification, draft: CertificationDraft): boolean {
  const want = certificationPayload(draft)
  return (
    stored.name === want.name &&
    (stored.description ?? '').trim() === want.description &&
    (stored.icon_key ?? '') === want.icon_key &&
    stored.sort_order === want.sort_order &&
    stored.is_active === want.is_active
  )
}

export async function createCertification(draft: CertificationDraft): Promise<Certification[]> {
  const created = await adminFetch<Certification>('/admin/certifications', {
    method: 'POST',
    body: certificationPayload(draft),
  })
  const list = await listCertifications()
  // No unique key of its own, so the id the POST returned is the lookup, with
  // a full field match as the fallback.
  const stored =
    list.find((c) => c.id === created?.id) ?? list.find((c) => matchesCertificationDraft(c, draft))
  if (!stored) {
    throw new AdminError('The server accepted the certification but it is not in the list. Nothing was saved.')
  }
  if (!matchesCertificationDraft(stored, draft)) {
    throw new AdminError('The certification was created but saved with different values. Check the fields and try again.')
  }
  return list
}

export async function updateCertification(
  id: string,
  draft: CertificationDraft,
): Promise<Certification[]> {
  await adminFetch<Certification>(`/admin/certifications/${id}`, {
    method: 'PUT',
    body: certificationPayload(draft),
  })
  const list = await listCertifications()
  const stored = list.find((c) => c.id === id)
  if (!stored) throw new AdminError('The certification disappeared after saving. Reload and check the list.')
  if (!matchesCertificationDraft(stored, draft)) {
    throw new AdminError('The server accepted the change but did not save it. Nothing was updated.')
  }
  return list
}

export async function deleteCertification(id: string): Promise<Certification[]> {
  await adminFetch<void>(`/admin/certifications/${id}`, { method: 'DELETE' })
  const list = await listCertifications()
  if (list.some((c) => c.id === id)) {
    throw new AdminError('The server accepted the delete but the certification is still there.')
  }
  return list
}

// ---------------- page heroes ----------------

/**
 * The six pages that have a hero record, in the site's own nav order. Mirrors
 * PAGE_KEYS in lib/cms.ts — the same six the public site fetches.
 */
export const HERO_PAGES = ['home', 'products', 'services', 'about', 'news', 'contact'] as const
export type HeroPage = (typeof HERO_PAGES)[number]

/** The four fields admin/heroes.html edits, plus the page it belongs to. */
export type HeroDraft = {
  image_url: string
  eyebrow: string
  heading: string
  subheading: string
}

export const heroDraftFrom = (h: PageHero | undefined): HeroDraft => ({
  image_url: h?.image_url ?? '',
  eyebrow: h?.eyebrow ?? '',
  heading: h?.heading ?? '',
  subheading: h?.subheading ?? '',
})

export const emptyHeroDraft = (): HeroDraft => heroDraftFrom(undefined)

export const getPageHero = (page: HeroPage, signal?: AbortSignal) =>
  adminFetch<PageHero>(`/admin/page-heroes/${page}`, { signal })

/**
 * All six at once rather than one per switch.
 *
 * The old page re-fetched on every change of the select, which meant a
 * network round trip between choosing a page and seeing its text. Six small
 * records cost one parallel fetch, and switching afterwards is instant — which
 * also makes the unsaved-changes guard meaningful, since there is no window
 * where the form is empty because a request is still in flight.
 */
export async function listPageHeroes(signal?: AbortSignal): Promise<Record<string, PageHero>> {
  const records = await Promise.all(HERO_PAGES.map((page) => getPageHero(page, signal)))
  return Object.fromEntries(
    records.filter((h): h is PageHero => Boolean(h)).map((h) => [h.page_key, h]),
  )
}

const heroPayload = (page: HeroPage, draft: HeroDraft) => ({
  page_key: page,
  image_url: draft.image_url,
  eyebrow: draft.eyebrow.trim(),
  heading: draft.heading.trim(),
  subheading: draft.subheading.trim(),
})

function matchesHeroDraft(stored: PageHero, page: HeroPage, draft: HeroDraft): boolean {
  const want = heroPayload(page, draft)
  return (
    (stored.image_url ?? '') === want.image_url &&
    (stored.eyebrow ?? '').trim() === want.eyebrow &&
    (stored.heading ?? '').trim() === want.heading &&
    (stored.subheading ?? '').trim() === want.subheading
  )
}

/**
 * PUT then re-read, like every other admin write here: a 2xx says the request
 * was accepted, not that the row changed. Returns the stored record so the
 * caller renders server truth.
 */
export async function updatePageHero(page: HeroPage, draft: HeroDraft): Promise<PageHero> {
  await adminFetch<PageHero>(`/admin/page-heroes/${page}`, {
    method: 'PUT',
    body: heroPayload(page, draft),
  })
  const stored = await getPageHero(page)
  if (!stored) throw new AdminError('The hero disappeared after saving. Reload and check the page.')
  if (!matchesHeroDraft(stored, page, draft)) {
    throw new AdminError('The server accepted the change but did not save it. Nothing was updated.')
  }
  return stored
}

// ---------------- site content ----------------

export const listContent = (signal?: AbortSignal) =>
  adminFetch<{ data: ContentEntry[] }>('/admin/content', { signal }).then((r) => r?.data ?? [])

/** Per-key outcome of a batch save. A key is only `saved` once re-read. */
export type ContentSaveReport = {
  saved: string[]
  failed: { key: string; message: string }[]
}

/**
 * Saves the edited keys and reports on each one separately.
 *
 * Separately, because that is what the old page got right and is worth
 * keeping: one key failing must not discard the text typed into the others.
 * Its baseline only moves for keys that succeeded, so a failure leaves that
 * field dirty with the operator's words intact.
 *
 * What it did not do is check. It moved the baseline on `res.ok`, so a write
 * the backend accepted and dropped looked saved and the edit was then lost on
 * the next reload. Here every key is compared against a re-read.
 *
 * One re-read for the whole batch, not one per key: /admin/content returns
 * every record, so a single GET verifies all of them however many were sent.
 */
export async function saveContent(
  edits: Record<string, string>,
): Promise<{ list: ContentEntry[]; report: ContentSaveReport }> {
  const keys = Object.keys(edits)

  const writes = await Promise.all(
    keys.map(async (key) => {
      try {
        await adminFetch<ContentEntry>(`/admin/content/${encodeURIComponent(key)}`, {
          method: 'PUT',
          body: { content_value: edits[key] },
        })
        return { key, error: '' }
      } catch (err) {
        // A 401 has to surface as a 401 rather than as one failed field, so
        // the caller can send the operator back to sign in.
        if (err instanceof UnauthorizedError) throw err
        return { key, error: err instanceof Error ? err.message : 'Could not save.' }
      }
    }),
  )

  const list = await listContent()
  const stored = new Map(list.map((entry) => [entry.content_key, entry.content_value ?? '']))

  const report: ContentSaveReport = { saved: [], failed: [] }
  for (const { key, error } of writes) {
    if (error) {
      report.failed.push({ key, message: error })
    } else if (stored.get(key) !== edits[key]) {
      report.failed.push({ key, message: 'The server accepted the change but did not save it.' })
    } else {
      report.saved.push(key)
    }
  }

  return { list, report }
}

// ---------------- site images ----------------

export const listSiteImages = (signal?: AbortSignal) =>
  adminFetch<{ data: SiteImage[] }>('/admin/site-images', { signal }).then((r) => r?.data ?? [])

/**
 * Points one slot at a new file and confirms it stuck.
 *
 * The slots are fixed: ten of them, each with a key and a label, and the only
 * thing an operator can change is which upload a slot points at. So there is
 * no create and no delete here, only this.
 *
 * The re-read is the same rule as everywhere else in this client, and it
 * matters more here than most: the card shows the new photo the moment the
 * upload returns, so without a check a slot that failed to save would sit
 * there looking exactly like one that had, until someone reloaded.
 */
export async function updateSiteImage(key: string, imageUrl: string): Promise<SiteImage[]> {
  await adminFetch<SiteImage>(`/admin/site-images/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: { image_url: imageUrl },
  })
  const list = await listSiteImages()
  const stored = list.find((image) => image.image_key === key)
  if (!stored) throw new AdminError('The image slot disappeared after saving. Reload and check.')
  if ((stored.image_url ?? '') !== imageUrl) {
    throw new AdminError('The server accepted the image but did not save it. The slot is unchanged.')
  }
  return list
}

// ---------------- branding ----------------

/** The single branding record: four brand colours and the logo. */
export type BrandingDraft = {
  primary_hex: string
  primary_dark_hex: string
  primary_light_hex: string
  accent_navy_hex: string
  logo_url: string
}

export const BRANDING_COLOURS = [
  'primary_hex',
  'primary_dark_hex',
  'primary_light_hex',
  'accent_navy_hex',
] as const

export const brandingDraftFrom = (b: Branding | null | undefined): BrandingDraft => ({
  // The old page fell back to #000000 for a missing colour, so the picker had
  // something valid to show rather than an empty value it would reject.
  primary_hex: b?.primary_hex || '#000000',
  primary_dark_hex: b?.primary_dark_hex || '#000000',
  primary_light_hex: b?.primary_light_hex || '#000000',
  accent_navy_hex: b?.accent_navy_hex || '#000000',
  logo_url: b?.logo_url ?? '',
})

export const getBranding = (signal?: AbortSignal) =>
  adminFetch<Branding>('/admin/branding', { signal })

/**
 * PUT the whole record, then re-read and confirm.
 *
 * Whole record because the endpoint takes one: there is a single row, and a
 * partial body would blank whatever it omitted. Both callers therefore send
 * every field — the colour form sends the logo it loaded, and the logo
 * upload sends the colours it loaded — which is also why the draft is held in
 * state rather than, as the old page did, scraped back out of the preview
 * image's `src` at submit time. A preview that had not loaded yielded an
 * empty string there, and saving colours would then clear the logo.
 */
export async function updateBranding(draft: BrandingDraft): Promise<Branding> {
  await adminFetch<Branding>('/admin/branding', { method: 'PUT', body: draft })
  const stored = await getBranding()
  if (!stored) throw new AdminError('The branding record disappeared after saving. Reload and check.')
  const mismatch =
    BRANDING_COLOURS.some((key) => (stored[key] ?? '') !== draft[key]) ||
    (stored.logo_url ?? '') !== draft.logo_url
  if (mismatch) {
    throw new AdminError('The server accepted the change but did not save it. Nothing was updated.')
  }
  return stored
}

// ---------------- enquiries ----------------

/**
 * The inbox. Unlike every other admin resource these records are created by
 * the public site, never here — so there is no draft type and no create.
 * What an operator can do is move one between statuses and delete it.
 */
export const listEnquiries = (status: EnquiryStatus | '', signal?: AbortSignal) =>
  adminFetch<{ data: Enquiry[] }>(`/admin/enquiries${status ? `?status=${status}` : ''}`, {
    signal,
  }).then((r) => r?.data ?? [])

/**
 * PATCH, not PUT: only the status moves, and the record is otherwise someone
 * else's words that the admin has no business rewriting.
 *
 * The re-read is filtered the same way the list is, so the caller gets back
 * exactly what the current filter should show. That matters here more than
 * elsewhere: moving an enquiry out of the filtered status should remove it
 * from the visible list, and only a filtered re-read shows that correctly.
 */
export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
  filter: EnquiryStatus | '',
): Promise<Enquiry[]> {
  await adminFetch<Enquiry>(`/admin/enquiries/${id}/status`, { method: 'PATCH', body: { status } })

  // Verify against the unfiltered list: the record may legitimately have left
  // the filtered view, and its absence there would otherwise look like a
  // failed write.
  const all = await listEnquiries('')
  const stored = all.find((e) => e.id === id)
  if (!stored) throw new AdminError('The enquiry disappeared after saving. Reload and check the list.')
  if (stored.status !== status) {
    throw new AdminError('The server accepted the status change but did not save it.')
  }
  return filter ? all.filter((e) => e.status === filter) : all
}

export async function deleteEnquiry(id: string, filter: EnquiryStatus | ''): Promise<Enquiry[]> {
  await adminFetch<void>(`/admin/enquiries/${id}`, { method: 'DELETE' })
  const all = await listEnquiries('')
  if (all.some((e) => e.id === id)) {
    throw new AdminError('The server accepted the delete but the enquiry is still there.')
  }
  return filter ? all.filter((e) => e.status === filter) : all
}

// ---------------- overview ----------------

export type Overview = {
  newEnquiries: number
  products: number
  news: number
  certifications: number
  /** Most recent first, capped by the caller. */
  recent: Enquiry[]
}

/**
 * Everything the dashboard shows, in one pass.
 *
 * Four requests, not the old page's five. It asked for
 * `/admin/enquiries?status=new` to count them and then fetched the full list
 * again for the recent rows; the full list already contains the new ones, so
 * the count is derived from it. That also makes the two agree: taken from two
 * separate requests, a submission arriving between them would leave the tile
 * and the table telling different stories.
 *
 * `Promise.allSettled`, because a dashboard is a summary — one endpoint being
 * down should cost that number, not the page. Each failure is reported so the
 * tile can say it is unknown rather than show a confident zero.
 */
export async function getOverview(
  recentLimit: number,
  signal?: AbortSignal,
): Promise<{ overview: Partial<Overview>; failed: string[] }> {
  const [enquiries, products, news, certifications] = await Promise.allSettled([
    listEnquiries('', signal),
    listProducts(signal),
    listNews(signal),
    listCertifications(signal),
  ])

  // A 401 anywhere means the session is gone, and that outranks any partial
  // result: the caller has to route to sign-in rather than render a page of
  // unknowns.
  for (const result of [enquiries, products, news, certifications]) {
    if (result.status === 'rejected' && result.reason instanceof UnauthorizedError) {
      throw result.reason
    }
  }

  const overview: Partial<Overview> = {}
  const failed: string[] = []

  if (enquiries.status === 'fulfilled') {
    overview.newEnquiries = enquiries.value.filter((e) => e.status === 'new').length
    overview.recent = enquiries.value.slice(0, recentLimit)
  } else {
    failed.push('enquiries')
  }

  if (products.status === 'fulfilled') overview.products = products.value.length
  else failed.push('products')

  if (news.status === 'fulfilled') overview.news = news.value.length
  else failed.push('news')

  if (certifications.status === 'fulfilled') overview.certifications = certifications.value.length
  else failed.push('certifications')

  return { overview, failed }
}
