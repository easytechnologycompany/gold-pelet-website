/**
 * Client for the existing Go API backend — the same service the current
 * static site and the admin dashboard already talk to. Read-only, public
 * endpoints only; nothing here authenticates.
 *
 * CORS, and why dev and production resolve differently
 * ----------------------------------------------------
 * The backend replies with `Access-Control-Allow-Headers` and
 * `-Allow-Methods` but never `Access-Control-Allow-Origin`, so a browser
 * blocks any cross-origin call to it. (curl doesn't enforce CORS, which is
 * why the endpoints look reachable from a shell and are not from a page.)
 *
 * In dev we therefore request a *relative* path and let Vite proxy it, which
 * makes the request same-origin and sidesteps CORS entirely. In production
 * there is no proxy, so the call goes direct and will keep failing until the
 * backend sends `Access-Control-Allow-Origin` for the site's origin.
 *
 * That failure is survivable by design: every fetch here resolves to null
 * rather than throwing, and the UI keeps the static content it shipped with.
 * Same progressive-enhancement contract as the existing js/cms.js.
 */

const PROD_BACKEND_ORIGIN = 'https://backend-production-cfda.up.railway.app'

/** Empty in dev so paths stay relative and hit the Vite proxy. */
export const BACKEND_ORIGIN = import.meta.env.DEV ? '' : PROD_BACKEND_ORIGIN

export const API_BASE = `${BACKEND_ORIGIN}/api/v1`

/** Resolves an `/uploads/...` path as stored in the DB against the backend. */
export const mediaURL = (path?: string | null): string => {
  if (!path) return ''
  return path.startsWith('http') ? path : `${BACKEND_ORIGIN}${path}`
}

type Envelope<T> = { data: T[] }

/** Never throws. A null return means "no data, keep what's on screen". */
export async function cmsFetch<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    // Offline, CORS-blocked, aborted, or malformed JSON — all the same to
    // the caller, which falls back to the designed content either way.
    return null
  }
}

/** Unwraps the `{ data: [...] }` envelope the public endpoints use. */
export async function cmsList<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const result = await cmsFetch<Envelope<T>>(path, signal)
  return result?.data ?? []
}

// ---- Shapes, as returned by the live API ----

export type Stat = {
  id: string
  stat_key: string
  label: string
  value_number: number
  unit_suffix: string
  sort_order: number
  is_active: boolean
}

export type Certification = {
  id: string
  name: string
  description: string
  icon_key: string
  sort_order: number
  is_active: boolean
}

export type ProductSpec = {
  id: string
  product_id: string
  label: string
  sort_order: number
}

export type ApiProduct = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string
  raw_image_url: string | null
  fried_image_url: string | null
  is_featured: boolean
  sort_order: number
  is_active: boolean
  specs: ProductSpec[]
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string
  sort_order: number
  is_active: boolean
}
