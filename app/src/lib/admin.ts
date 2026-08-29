import { API_BASE } from './api'
import type { ApiProduct, Category, NewsItem } from './api'

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
