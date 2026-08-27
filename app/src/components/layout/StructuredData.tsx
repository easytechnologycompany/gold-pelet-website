import { useEffect } from 'react'
import { useCms } from '@/lib/cms'
import { SITE_NAME, SITE_ORIGIN, absoluteMediaURL } from '@/lib/seo'

/**
 * schema.org Organization, built from the CMS's own contact record.
 *
 * Every field is a real value the admin dashboard owns — the address, phone
 * and email are the same records the footer renders. Nothing is asserted that
 * the business has not published, which is the whole point of structured data:
 * a fabricated address here is a fabricated address in Google's knowledge
 * panel.
 *
 * The block is only written once the CMS has answered. An Organization node
 * with a name and nothing else is worse than none at all.
 */
export function StructuredData() {
  const content = useCms((s) => s.content)
  const branding = useCms((s) => s.branding)

  useEffect(() => {
    const email = content['contact.email']
    const phone = content['contact.phone_primary']
    const address = content['contact.address']
    const website = content['contact.website']

    if (!email && !phone && !address) return

    const data: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_ORIGIN,
      description: content['footer.blurb'] || undefined,
    }

    const logo = absoluteMediaURL(branding?.logo_url)
    if (logo) data.logo = logo
    if (email) data.email = email
    if (phone) data.telephone = phone

    if (address) {
      // The CMS stores one free-text line, so it maps to streetAddress rather
      // than being split into parts that were never separately entered.
      data.address = { '@type': 'PostalAddress', streetAddress: address }
    }

    // `sameAs` is for profiles the organisation controls elsewhere. The public
    // website counts when it differs from the origin this copy is served from.
    if (website) {
      const normalised = `https://${website.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
      if (normalised !== SITE_ORIGIN) data.sameAs = [normalised]
    }

    const id = 'ld-organization'
    let script = document.getElementById(id) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = id
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(data)

    return () => {
      script?.remove()
    }
  }, [content, branding])

  return null
}
