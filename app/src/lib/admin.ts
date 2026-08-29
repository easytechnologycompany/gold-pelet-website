import { API_BASE } from './api'
import type { Category } from './api'

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
 */
export async function adminFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
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
