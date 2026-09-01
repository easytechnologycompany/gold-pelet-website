import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { mediaURL, type ApiProduct, type Category } from '@/lib/api'
import { useOverlay, overlayKey } from '@/lib/overlay'
import { Icon } from '@/components/ui/Icon'
import { glyphFor, ownPhoto, toneFor } from '@/lib/asset-map'

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
  shared,
  delay = 0,
}: {
  product: ApiProduct
  category?: Category
  shared: Set<string>
  delay?: number
}) {
  const { tk, cms } = useOverlay()
  const [state, setState] = useState<MediaState>('raw')

  // Only a photograph this product does not share with another one. Seven
  // wheat products pointing at one shot read as a repeating grid rather than
  // as seven products, so a shared shot gives way to the product's own glyph.
  const raw = mediaURL(ownPhoto(product.raw_image_url, shared))
  const fried = mediaURL(ownPhoto(product.fried_image_url, shared))
  const glyph = glyphFor(product.slug, category?.slug ?? '')

  // Only offer the switch when there is actually something on both sides of
  // it — one photo and a dead toggle is worse than no toggle.
  const switchable = Boolean(raw && fried)

  // With both sides photographed the switch decides. With only one, that one
  // shows whichever side it is: the alternative is a card that keeps its glyph
  // until both shots exist, so the first photograph of a product changes
  // nothing on screen and looks like it failed to upload. There is no toggle
  // in that state, so nothing can claim the picture is the other side.
  const shown = switchable ? (state === 'raw' ? raw : fried) : raw || fried

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
