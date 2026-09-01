/**
 * Client for the existing Go API backend — the same service the current
 * static site and the admin dashboard already talk to. Read-only, public
 * endpoints only; nothing here authenticates.
 *
 * CORS, and why dev and production resolve differently
 * ----------------------------------------------------
 * The backend reflects `Access-Control-Allow-Origin` for the origins named in
 * its `CORS_ORIGINS` variable, and for nothing else. Production is on that
 * list, so the direct cross-origin call works and the deployed app reads live
 * data. A *new* deployment origin is not on it until someone adds it — see
 * app/README.md, "Backend connection".
 *
 * Dev is a different mechanism, not a workaround for a broken one: it asks
 * for a *relative* path so Vite proxies it, making the request same-origin.
 * That is what lets `VITE_BACKEND_ORIGIN` repoint local development at a
 * backend running on localhost without touching an allowlist.
 *
 * Either way the failure is survivable by design: every fetch here resolves
 * to null rather than throwing, so an unreachable API — or an origin nobody
 * allowlisted — leaves the UI on the content it shipped with. Same
 * progressive-enhancement contract as the existing js/cms.js.
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

/**
 * A page's hero block. `/public/page-heroes/{page_key}` — one record per page,
 * admin-editable. English only, like every other table; the translation
 * overlay supplies the other three locales.
 */
export type PageHero = {
  id: string
  page_key: string
  image_url: string | null
  eyebrow: string
  heading: string
  subheading: string
}

/** An About-page milestone. `/public/timeline`, ordered by sort_order. */
export type Milestone = {
  id: string
  year_label: string
  title: string
  description: string
  sort_order: number
  is_active: boolean
}

/** An Events & News entry. `/public/news`; `is_featured` marks the lead item. */
export type NewsItem = {
  id: string
  title: string
  description: string
  date_label: string
  icon_key: string
  image_url: string | null
  is_featured: boolean
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

export type SiteImage = {
  id: string
  image_key: string
  image_url: string
  label: string
}

export type ContentEntry = {
  id: string
  content_key: string
  page: string
  label: string
  content_value: string
}

/** Note: the colour fields are read but deliberately never applied — see
 *  the note in cms.ts. Only `logo_url` is usable here. */
/**
 * An RFQ or contact-form submission. Written by the public Contact page (see
 * pages/Contact.tsx, which posts these exact field names to
 * `/public/enquiries`) and read back only by the admin — there is no public
 * endpoint that lists them, which is why this type arrives with the admin
 * screen rather than with the rest of the CMS shapes.
 */
export type Enquiry = {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  country: string
  product_interest: string
  estimated_volume: string
  message: string
  status: EnquiryStatus
  created_at: string
}

/** The four states the admin can move an enquiry between. */
export type EnquiryStatus = 'new' | 'contacted' | 'won' | 'lost'

export const ENQUIRY_STATUSES: readonly EnquiryStatus[] = ['new', 'contacted', 'won', 'lost']

export type Branding = {
  id: number
  primary_hex: string
  primary_dark_hex: string
  primary_light_hex: string
  accent_navy_hex: string
  logo_url: string
}
