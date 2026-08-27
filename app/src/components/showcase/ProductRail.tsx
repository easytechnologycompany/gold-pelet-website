import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { mediaURL, type ApiProduct } from '@/lib/api'
import { useCms } from '@/lib/cms'
import { useOverlay, overlayKey } from '@/lib/overlay'
import type { GlyphId } from '@/lib/products'

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

/** Deterministic glyph per category, used when a product has no photograph
 *  so the card still shows something of the shape rather than an empty box. */
const GLYPH_BY_CATEGORY: Record<string, GlyphId> = {
  potato: 'g-classic',
  wheat: 'g-ring',
  corn: 'g-curl',
}

const TONE_BY_CATEGORY: Record<string, string> = {
  potato: '#D4A017',
  wheat: '#EA9A0B',
  corn: '#C2410C',
}

function ProductCard({ product }: { product: ApiProduct }) {
  const { cms } = useOverlay()
  const category = useCms((s) => s.categories[product.category_id])
  const slug = category?.slug ?? ''
  const tone = TONE_BY_CATEGORY[slug] ?? 'var(--gold)'
  const glyph = GLYPH_BY_CATEGORY[slug] ?? 'g-classic'

  const raw = mediaURL(product.raw_image_url)
  const fried = mediaURL(product.fried_image_url)
  const hasPhoto = Boolean(raw || fried)

  const name = cms(overlayKey.productName(product.slug), product.name)
  const description = cms(overlayKey.productDescription(product.slug), product.description)

  return (
    <Link className="card" to="/products" style={{ '--tone': tone } as CSSProperties}>
      {hasPhoto ? (
        <div className="shot photo">
          {/* Raw is the default state: the product sold is the pellet, and
              the fried shot shows what it becomes. */}
          {raw && <img className="raw" src={raw} alt={name} loading="lazy" decoding="async" />}
          {fried && <img className="fried" src={fried} alt={name} loading="lazy" decoding="async" />}
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
        <h3>{name}</h3>
        <p>{description}</p>
        {product.specs.length > 0 && (
          <span className="foot">
            {product.specs.map((spec) => (
              <span key={spec.id}>{spec.label}</span>
            ))}
          </span>
        )}
      </div>
    </Link>
  )
}
