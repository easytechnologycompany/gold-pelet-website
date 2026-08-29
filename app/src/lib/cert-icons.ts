import type { IconId } from './sprite-ids'

/**
 * The `icon_key` values the site recognises, and the sprite symbol each one
 * draws. Anything unrecognised falls back to the generic tick rather than
 * rendering an empty box.
 *
 * Lives here rather than in components/showcase/Certifications.tsx so the
 * admin's Certifications screen can offer the same four keys without keeping
 * a second copy that could drift — the public renderer and the admin's
 * suggestions are now the same list. Same reasoning as button-variants.ts:
 * a non-component export in a component file also costs Fast Refresh.
 */
export const CERT_ICON: Record<string, IconId> = {
  'shield-check': 'i-cert',
  'shield-tick': 'i-cert',
  'circle-check': 'i-check',
  'document-check': 'i-scan',
}

export const CERT_ICON_KEYS = Object.keys(CERT_ICON)

/** The fallback the public page draws for an unrecognised key. */
export const CERT_ICON_FALLBACK: IconId = 'i-check'

export const certIcon = (key: string): IconId => CERT_ICON[key] ?? CERT_ICON_FALLBACK
