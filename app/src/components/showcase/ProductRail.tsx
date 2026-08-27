import type { CSSProperties } from 'react'
import { Reveal } from '@/components/motion/Reveal'
import { copy } from '@/lib/content'
import { useT } from '@/lib/i18n'
import { products, type Product } from '@/lib/products'

/**
 * Scroll-snap carousel. The next card sits deliberately half-visible at the
 * right edge — that overhang is the affordance telling you the row continues,
 * so the section needs no arrows or dots.
 */
export function ProductRail() {
  const { t } = useT()

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
          {products.map((product) => (
            <ProductCard key={product.name.en} product={product} />
          ))}
        </div>
      </div>

      <p className="rail-hint">{t(copy.railHint)}</p>
    </section>
  )
}

function ProductCard({ product }: { product: Product }) {
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
