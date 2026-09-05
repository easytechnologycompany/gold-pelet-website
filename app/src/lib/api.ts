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

// ---- theme tokens ----

/**
 * The closed set of colour tokens the site's CSS custom-property layer
 * reads (see index.css). One value per token per mode — this is the base
 * name; the stored/wire record below suffixes each with `_light`/`_dark`.
 */
export const THEME_TOKEN_KEYS = [
  'bg',
  'bg_2',
  'surface',
  'header_bg',
  'footer_bg',
  'heading_color',
  'body_text_color',
  'secondary_text_color',
  'muted_text_color',
  'link_color',
  'icon_color',
  'btn_fill_bg',
  'btn_fill_bg_hover',
  'btn_fill_bg_active',
  'btn_fill_text',
  'btn_fill_border',
  'btn_ghost_text',
  'btn_ghost_border',
  'btn_ghost_border_hover',
  'btn_disabled_bg',
  'btn_disabled_text',
  'btn_disabled_border',
  'state_success',
  'state_warning',
  'state_danger',
  'state_info',
] as const

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number]

/** One mode's worth of tokens, keyed by base name. */
export type ThemeTokens = Record<ThemeTokenKey, string>

/** The wire/DB shape: one `_light` and one `_dark` column per token. */
export type SiteTheme = { id: number; updated_at: string } & {
  [K in ThemeTokenKey as `${K}_light`]: string
} & { [K in ThemeTokenKey as `${K}_dark`]: string }

/** Splits the flat wire record into the two per-mode token maps components read. */
export function themeModesFrom(theme: SiteTheme): { light: ThemeTokens; dark: ThemeTokens } {
  const light = {} as ThemeTokens
  const dark = {} as ThemeTokens
  for (const key of THEME_TOKEN_KEYS) {
    light[key] = theme[`${key}_light`]
    dark[key] = theme[`${key}_dark`]
  }
  return { light, dark }
}

/** Recombines two per-mode token maps into the flat shape the API expects. */
export function themeModesTo(modes: { light: ThemeTokens; dark: ThemeTokens }): Omit<
  SiteTheme,
  'id' | 'updated_at'
> {
  const out = {} as Omit<SiteTheme, 'id' | 'updated_at'>
  for (const key of THEME_TOKEN_KEYS) {
    ;(out as Record<string, string>)[`${key}_light`] = modes.light[key]
    ;(out as Record<string, string>)[`${key}_dark`] = modes.dark[key]
  }
  return out
}

/**
 * A verbatim transcription of index.css's hardcoded values — the baseline
 * every visitor sees until an admin edits a colour, and what "Reset to
 * defaults" restores in the editor.
 *
 * The dark values are this repo's own brand-blue dark palette (hue 202,
 * sampled from the logo mark), not a neutral near-black — kept distinct
 * from the sibling gold-pelet-website-v2 codebase, whose dark mode never
 * shipped that redesign.
 */
export const DEFAULT_THEME_TOKENS: { light: ThemeTokens; dark: ThemeTokens } = {
  light: {
    bg: '#FAFAF9',
    bg_2: '#F5F5F7',
    surface: '#FFFFFF',
    header_bg: '#FAFAF9',
    footer_bg: '#FAFAF9',
    heading_color: '#0C0A09',
    body_text_color: '#0C0A09',
    secondary_text_color: '#44403C',
    muted_text_color: '#78716C',
    link_color: '#A16207',
    icon_color: '#A16207',
    btn_fill_bg: '#A16207',
    btn_fill_bg_hover: '#854D0E',
    btn_fill_bg_active: '#7A480D',
    btn_fill_text: '#FFFFFF',
    btn_fill_border: '#A16207',
    btn_ghost_text: '#0C0A09',
    btn_ghost_border: '#D6D3D1',
    btn_ghost_border_hover: '#78716C',
    btn_disabled_bg: '#E7E5E4',
    btn_disabled_text: '#78716C',
    btn_disabled_border: '#E7E5E4',
    state_success: '#15803D',
    state_warning: '#B45309',
    state_danger: '#DC2626',
    state_info: '#0B4363',
  },
  dark: {
    bg: '#050F15',
    bg_2: '#09161E',
    surface: '#0C1C25',
    header_bg: '#050F15',
    footer_bg: '#050F15',
    heading_color: '#F3F5F7',
    body_text_color: '#F3F5F7',
    secondary_text_color: '#97A5AE',
    muted_text_color: '#73838C',
    link_color: '#E3A008',
    icon_color: '#E3A008',
    btn_fill_bg: '#E3A008',
    btn_fill_bg_hover: '#FBBF24',
    btn_fill_bg_active: '#EDB512',
    btn_fill_text: '#0B171D',
    btn_fill_border: '#E3A008',
    btn_ghost_text: '#F3F5F7',
    btn_ghost_border: '#223D4C',
    btn_ghost_border_hover: '#73838C',
    btn_disabled_bg: '#162B36',
    btn_disabled_text: '#73838C',
    btn_disabled_border: '#162B36',
    state_success: '#22C55E',
    state_warning: '#F59E0B',
    state_danger: '#F87171',
    state_info: '#38BDF8',
  },
}

/** `{ bg: '#FAFAF9', ... }` -> `{ '--bg': '#FAFAF9', ... }` for inline style. */
export function tokensToCSSVars(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const key of THEME_TOKEN_KEYS) {
    vars[`--${key.replace(/_/g, '-')}`] = tokens[key]
  }
  return vars
}
