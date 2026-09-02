import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { mediaURL, type ApiProduct } from '@/lib/api'
import { useCms } from '@/lib/cms'
import { useOverlay, overlayKey } from '@/lib/overlay'
import { glyphFor, toneFor } from '@/lib/asset-map'

/**
 * The catalogue as a grid, every product visible at once.
 *
 * It was a scroll-snap carousel, which showed two cards and asked for a
 * sideways drag to reach the rest. That suits a sequence — the manufacturing
 * story strip below still works that way — but a catalogue is a set the
 * reader scans, and burying most of it behind a gesture is a poor trade for
 * the vertical space it saves.
 *
 * Every card is a real `/public/products` record. The six designed flavours
 * that used to stand in when the API was unreachable are gone: they described
 * finished seasoned snacks that this company does not sell, and having two
 * competing catalogues meant the page could show a plausible fiction whenever
 * the backend hiccuped. With nothing to show, the section does not render.
 */
/** How many products the home page shows before deferring to the catalogue. */
const SHOWN = 8

/**
 * The `SHOWN` products to put on the home page, taken across the ranges rather
 * than off the top of the list.
 *
 * The store orders by category and then by each product's own order, so the
 * first eight are whatever the largest category happens to hold — with this
 * catalogue, seven wheat and one potato, and no corn at all. The section's own
 * lede says "three core lines, wheat, potato and Egyptian 3D corn", so a
 * straight slice would have the page contradicting its own copy.
 *
 * Taking one from each line in turn keeps every range represented and keeps
 * each line's own order intact. A category with fewer products simply drops
 * out of later rounds instead of holding a place.
 */
function acrossRanges(products: ApiProduct[], limit: number): ApiProduct[] {
  const byCategory = new Map<string, ApiProduct[]>()
  for (const p of products) {
    const bucket = byCategory.get(p.category_id)
    if (bucket) bucket.push(p)
    else byCategory.set(p.category_id, [p])
  }

  const queues = [...byCategory.values()]
  const picked: ApiProduct[] = []
  for (let round = 0; picked.length < limit; round++) {
    const before = picked.length
    for (const queue of queues) {
      if (picked.length >= limit) break
      if (queue[round]) picked.push(queue[round])
    }
    // Every queue is exhausted; the catalogue is smaller than the limit.
    if (picked.length === before) break
  }
  return picked
}

export function ProductRail() {
  const { tk } = useOverlay()
  const products = useCms((s) => s.products)

  if (!products.length) return null

  const shown = acrossRanges(products, SHOWN)

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
        <div className="rail rail-grid">
          {shown.map((product) => (
            <ProductCard key={product.id} product={product} />
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

function ProductCard({ product }: { product: ApiProduct }) {
  const { tk, cms } = useOverlay()
  const [shown, setShown] = useState<MediaState>('raw')
  const category = useCms((s) => s.categories[product.category_id])
  const slug = category?.slug ?? ''
  const tone = toneFor(slug)
  const glyph = glyphFor(product.slug, slug)

  // The photographs as the CMS holds them, shared with other products or not.
  const raw = mediaURL(product.raw_image_url)
  const fried = mediaURL(product.fried_image_url)
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
          {/* `.fried` sits at opacity 0 until data-shown says otherwise, so a
              product with only a fried shot would render an invisible picture.
              It takes the visible base layer in that case instead. */}
          {fried && (
            <img
              className={raw ? 'fried' : 'raw'}
              src={fried}
              alt={name}
              loading="lazy"
              decoding="async"
            />
          )}

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
