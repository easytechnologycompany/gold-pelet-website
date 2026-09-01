import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { mediaURL, type ApiProduct, type Category } from '@/lib/api'
import { useOverlay, overlayKey } from '@/lib/overlay'
import { Icon } from '@/components/ui/Icon'
import { glyphFor, toneFor } from '@/lib/asset-map'

/**
 * A catalogue card: the real product record, its two photographs, and its
 * spec chips.
 *
 * Name and description are CMS values passed through the overlay, so English
 * is whatever the admin dashboard holds and the other three locales come from
 * the `products.<slug>.*` keys the live site already ships.
 */

type MediaState = 'raw' | 'fried'

export function ProductCard({
  product,
  category,
  delay = 0,
}: {
  product: ApiProduct
  category?: Category
  delay?: number
}) {
  const { tk, cms } = useOverlay()
  const [state, setState] = useState<MediaState>('raw')

  // The product's photographs as the CMS holds them. A shot shared with
  // another product is still this product's shot: the catalogue is the
  // client's to curate, and a card that hides the picture the admin set on it
  // is answering a question nobody asked it.
  const raw = mediaURL(product.raw_image_url)
  const fried = mediaURL(product.fried_image_url)
  const glyph = glyphFor(product.slug, category?.slug ?? '')

  // Only offer the switch when there is actually something on both sides of
  // it — one photo and a dead toggle is worse than no toggle.
  const switchable = Boolean(raw && fried)

  // The toggle picks the side; nothing else gets a say.
  const shown = state === 'raw' ? raw : fried

  const name = cms(overlayKey.productName(product.slug), product.name)
  const description = cms(overlayKey.productDescription(product.slug), product.description)

  return (
    <Reveal as="article" className="pcard" delay={delay}>
      <div className="pcard-media">
        {product.is_featured && <span className="tag">{tk('product.bestSeller')}</span>}

        {shown ? (
          <img src={shown} alt={name} loading="lazy" decoding="async" />
        ) : (
          /* The glyph rather than the "photo coming" line: it names the shape
             the product actually is, so the card still says something while
             the photography is outstanding. */
          <span
            className="pcard-glyph"
            role="img"
            aria-label={name}
            style={{ color: toneFor(category?.slug ?? '') }}
          >
            <Icon id={glyph} size={200} />
          </span>
        )}

        {switchable && (
          /**
           * The state is `raw`/`fried` — never the translated label — so the
           * control behaves identically in Arabic and Kurdish. There is no
           * measured sliding pill either: the active button carries its own
           * background, which needs no coordinates and so cannot be placed on
           * the wrong side under RTL.
           */
          <div className="media-toggle" role="group" aria-label={`${tk('product.raw')} / ${tk('product.fried')}`}>
            {(['raw', 'fried'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={state === s ? 'is-active' : undefined}
                aria-pressed={state === s}
                onClick={() => setState(s)}
              >
                {tk(`product.${s}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pcard-body">
        {category && <span className="cap">{cms(overlayKey.categoryName(category.slug), category.name)}</span>}
        <h3>{name}</h3>
        {description && <p>{description}</p>}

        {product.specs.length > 0 && (
          <ul className="chips">
            {product.specs.map((spec) => (
              <li key={spec.id}>{spec.label}</li>
            ))}
          </ul>
        )}

        {/* Carries the product through to the enquiry form, the same way the
            live site's "Request Sample Kit" link does. */}
        <Link
          className="pcard-cta"
          to={`/contact?product=${encodeURIComponent(product.name)}#quote`}
        >
          {tk('product.requestSample')}
        </Link>
      </div>
    </Reveal>
  )
}
