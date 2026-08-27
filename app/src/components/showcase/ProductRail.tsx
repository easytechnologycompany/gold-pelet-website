import type { CSSProperties } from 'react'
import { Reveal } from '@/components/motion/Reveal'
import { copy } from '@/lib/content'
import { useT } from '@/lib/i18n'
import { mediaURL, type ApiProduct } from '@/lib/api'
import { useCms } from '@/lib/cms'
import { products as designedProducts, type GlyphId, type Product } from '@/lib/products'

/**
 * Scroll-snap carousel. The next card sits deliberately half-visible at the
 * right edge — that overhang is the affordance telling you the row continues,
 * so the section needs no arrows or dots.
 *
 * Content comes from the CMS catalogue when it is reachable, and falls back
 * to the six designed flavours when it is not. The two are different product
 * models — the CMS sells raw pellets B2B with photography, the design sold
 * finished snack flavours with a cut and a heat level — so each has its own
 * card renderer rather than being forced through one shape.
 */
export function ProductRail() {
  const { t } = useT()
  const cmsProducts = useCms((s) => s.products)

  const live = cmsProducts.length > 0

  return (
    <section className="section" id="range" style={{ background: 'var(--bg-2)' }}>
      <div className="bay center">
        <Reveal as="p" className="eyebrow">
          {t(copy.rangeEyebrow)}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {t(copy.rangeHeading)}
        </Reveal>
      </div>

      <div className="bay-wide" style={{ maxWidth: 1320, paddingInline: 0 }}>
        <div className="rail">
          {live
            ? cmsProducts.map((product) => <ApiProductCard key={product.id} product={product} />)
            : designedProducts.map((product) => (
                <DesignedProductCard key={product.name.en} product={product} />
              ))}
        </div>
      </div>

      <p className="rail-hint">{t(copy.railHint)}</p>
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

function ApiProductCard({ product }: { product: ApiProduct }) {
  const { t } = useT()
  const category = useCms((s) => s.categories[product.category_id])
  const slug = category?.slug ?? ''
  const tone = TONE_BY_CATEGORY[slug] ?? 'var(--gold)'
  const glyph = GLYPH_BY_CATEGORY[slug] ?? 'g-classic'

  const raw = mediaURL(product.raw_image_url)
  const fried = mediaURL(product.fried_image_url)
  const hasPhoto = Boolean(raw || fried)

  return (
    <a className="card" href="#trade" style={{ '--tone': tone } as CSSProperties}>
      {hasPhoto ? (
        <div className="shot photo">
          {/* Raw is the default state: the product sold is the pellet, and
              the fried shot shows what it becomes. */}
          {raw && (
            <img className="raw" src={raw} alt={`${product.name} — raw pellet`} loading="lazy" decoding="async" />
          )}
          {fried && (
            <img className="fried" src={fried} alt={`${product.name} — fried`} loading="lazy" decoding="async" />
          )}
          <span className="shot-state" aria-hidden="true">
            <span className="is-raw">{t(copy.stateRaw)}</span>
            <span className="is-fried">{t(copy.stateFried)}</span>
          </span>
        </div>
      ) : (
        <div className="shot">
          <svg viewBox="0 0 200 200" aria-hidden="true" style={{ color: tone }}>
            <use href={`#${glyph}`} />
          </svg>
        </div>
      )}

      <div className="body">
        {category && <span className="cut">{category.name}</span>}
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        {product.specs.length > 0 && (
          <span className="foot">
            {product.specs.map((spec) => (
              <span key={spec.id}>{spec.label}</span>
            ))}
          </span>
        )}
      </div>
    </a>
  )
}

function DesignedProductCard({ product }: { product: Product }) {
  const { t } = useT()

  return (
    <a className="card" href="#trade" style={{ '--tone': product.tone } as CSSProperties}>
      <div className="shot">
        <svg viewBox="0 0 200 200" aria-hidden="true" style={{ color: product.tone }}>
          <use href={`#${product.glyph}`} />
        </svg>
      </div>
      <div className="body">
        <span className="cut">{t(product.cut)}</span>
        <h3>{t(product.name)}</h3>
        <p>{t(product.p)}</p>
        <span className="foot">
          <span>{product.g} g</span>
          <Heat level={product.heat} />
        </span>
      </div>
    </a>
  )
}

/** Zero heat reads as a word rather than three empty dots — an empty meter
 *  looks like missing data, not like "no heat". */
function Heat({ level }: { level: Product['heat'] }) {
  const { t } = useT()

  if (level === 0) return <span>{t(copy.mild)}</span>

  return (
    <span className="heat" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <i key={i} className={i < level ? 'on' : undefined} />
      ))}
    </span>
  )
}
