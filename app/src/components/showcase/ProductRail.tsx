import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { mediaURL, type ApiProduct } from '@/lib/api'
import { useCms } from '@/lib/cms'
import { useOverlay, overlayKey } from '@/lib/overlay'
import { glyphFor, ownPhoto, sharedProductImages, toneFor } from '@/lib/asset-map'

/**
 * Scroll-snap carousel. The next card sits deliberately half-visible at the
 * right edge — that overhang is the affordance telling you the row continues,
 * so the section needs no arrows or dots.
 *
 * Every card is a real `/public/products` record. The six designed flavours
 * that used to stand in when the API was unreachable are gone: they described
 * finished seasoned snacks that this company does not sell, and having two
 * competing catalogues meant the page could show a plausible fiction whenever
 * the backend hiccuped. With nothing to show, the section does not render.
 */
export function ProductRail() {
  const { tk } = useOverlay()
  const products = useCms((s) => s.products)
  const shared = sharedProductImages(products)

  if (!products.length) return null

  return (
    <section className="section" id="range" style={{ background: 'var(--bg-2)' }}>
      <div className="bay center">
        <Reveal as="p" className="eyebrow">
          {tk('home.products.eyebrow')}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {tk('home.products.h2')}
        </Reveal>
        <Reveal as="p" className="lead" delay={110}>
          {tk('home.products.lede')}
        </Reveal>
      </div>

      <div className="bay-wide" style={{ maxWidth: 1320, paddingInline: 0 }}>
        <div className="rail">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} shared={shared} />
          ))}
        </div>
      </div>

      <p className="rail-hint">
        <Link to="/products">{tk('home.products.viewall')}</Link>
      </p>
    </section>
  )
}

type MediaState = 'raw' | 'fried'

function ProductCard({ product, shared }: { product: ApiProduct; shared: Set<string> }) {
  const { tk, cms } = useOverlay()
  const [shown, setShown] = useState<MediaState>('raw')
  const category = useCms((s) => s.categories[product.category_id])
  const slug = category?.slug ?? ''
  const tone = toneFor(slug)
  const glyph = glyphFor(product.slug, slug)

  // Only a photograph this product does not share with another. Where the
  // catalogue reuses one shot across a whole category, the card shows the
  // product's own glyph instead of the same picture as its neighbours.
  const raw = mediaURL(ownPhoto(product.raw_image_url, shared))
  const fried = mediaURL(ownPhoto(product.fried_image_url, shared))
  const hasPhoto = Boolean(raw || fried)
  // Only offer the switch when both sides exist — the catalogue card takes the
  // same line, and a dead toggle is worse than none.
  const switchable = Boolean(raw && fried)

  const name = cms(overlayKey.productName(product.slug), product.name)
  const description = cms(overlayKey.productDescription(product.slug), product.description)

  return (
    <article className="card" style={{ '--tone': tone } as CSSProperties}>
      {hasPhoto ? (
        <div className="shot photo" data-shown={shown}>
          {/* Raw is the default state: the product sold is the pellet, and
              the fried shot shows what it becomes. */}
          {raw && <img className="raw" src={raw} alt={name} loading="lazy" decoding="async" />}
          {fried && <img className="fried" src={fried} alt={name} loading="lazy" decoding="async" />}

          {switchable && (
            /* Pointer devices cross-fade on hover. Touch has no hover, so the
               fried shot needs a control of its own — the same one the
               catalogue cards carry, so the gesture is learned once. State is
               `raw`/`fried` rather than the translated label, so it behaves
               identically under RTL. */
            <div
              className="media-toggle"
              role="group"
              aria-label={`${tk('product.raw')} / ${tk('product.fried')}`}
            >
              {(['raw', 'fried'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={shown === s ? 'is-active' : undefined}
                  aria-pressed={shown === s}
                  onClick={() => setShown(s)}
                >
                  {tk(`product.${s}`)}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="shot">
          <svg viewBox="0 0 200 200" aria-hidden="true" style={{ color: tone }}>
            <use href={`#${glyph}`} />
          </svg>
        </div>
      )}

      <div className="body">
        {category && (
          <span className="cut">{cms(overlayKey.categoryName(category.slug), category.name)}</span>
        )}
        {/* The card was one big <Link>. A button cannot live inside an anchor,
            so the link now covers the card from here instead: one link, one
            button, and the whole card still clickable. */}
        <h3>
          <Link className="card-link" to="/products">
            {name}
          </Link>
        </h3>
        <p>{description}</p>
        {product.specs.length > 0 && (
          <span className="foot">
            {product.specs.map((spec) => (
              <span key={spec.id}>{spec.label}</span>
            ))}
          </span>
        )}
      </div>
    </article>
  )
}
