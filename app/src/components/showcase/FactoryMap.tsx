import { Reveal } from '@/components/motion/Reveal'
import { ChevronLink } from '@/components/ui/ChevronLink'
import { useCms } from '@/lib/cms'
import { useLang } from '@/lib/i18n'
import { useOverlay } from '@/lib/overlay'

/**
 * The factory on a map, under the contact details.
 *
 * Driven by the `contact.address` CMS record rather than by coordinates typed
 * in here. That is the same rule the rest of the page follows — there is no
 * second copy of the address anywhere — and it means a move, or a correction
 * to the street number, is an admin edit rather than a deploy. The cost is
 * that the pin is only as precise as the address string; for an address on a
 * numbered street in a named industrial zone that is a building, which is as
 * much precision as a visitor needs to drive there.
 *
 * No API key, deliberately. Google's keyed Embed API would put a Cloud
 * project, a billing account and a referrer-restricted key between the client
 * and their own contact page, and the first thing to break on the day the key
 * lapses is the map. The keyless `output=embed` form has served the same
 * markup for years and needs none of that.
 */
export function FactoryMap() {
  const { tk } = useOverlay()
  const address = useCms((s) => s.content['contact.address'])
  const locale = useLang((s) => s.locale)

  // Same contract as every other CMS-fed block: without the record there is
  // nothing truthful to draw, so the section simply is not there. Never a
  // pin on an empty map, or a frame around a Google error page.
  if (!address) return null

  const query = encodeURIComponent(address)

  return (
    <div className="map">
      <Reveal className="map-frame" delay={165}>
        <iframe
          // `hl` puts the map's own labels in the page's language. Google
          // ignores a code it does not carry, which is the right outcome for
          // ku — the map falls back to its default rather than erroring.
          src={`https://www.google.com/maps?q=${query}&z=15&hl=${locale}&output=embed`}
          title={tk('contact.map.title')}
          // Lazy so the embed costs nothing — no request to Google, no script,
          // no cookie — until a visitor actually scrolls the map into view.
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </Reveal>

      {/* The embed cannot route anyone anywhere: it is a view, and its own
          links open inside the frame. This is the one that hands the address
          to whatever maps app the visitor actually uses — `api=1` is the
          documented form, and it opens the native app on a phone rather than
          a browser tab on top of it. */}
      <ChevronLink
        className="map-directions"
        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        label={tk('contact.map.directions')}
      />
    </div>
  )
}
