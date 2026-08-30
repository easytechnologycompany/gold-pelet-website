import { PageHero } from '@/components/layout/PageHero'
import { Reveal } from '@/components/motion/Reveal'
import { LoadCalculator } from '@/components/showcase/LoadCalculator'
import { PackShot } from '@/components/showcase/PackShot'
import { ProductCard } from '@/components/showcase/ProductCard'
import { ButtonRoute } from '@/components/ui/Button'
import { useCms } from '@/lib/cms'
import { useOverlay, overlayKey } from '@/lib/overlay'

/**
 * The product catalogue: every active product from `/public/products`, grouped
 * by its category and in the CMS's own order. Add a product in the admin
 * dashboard and it appears here — there is no hardcoded list to keep in step.
 *
 * The section ids are the category slugs, which is what the footer's
 * `/products#wheat` links target.
 */

/** The live site numbers its three ranges; the keys are named for the range
 *  rather than the slug, so this maps one to the other. */
const EYEBROW_BY_SLUG: Record<string, string> = {
  wheat: 'products.eyebrow.grain',
  potato: 'products.eyebrow.potato',
  corn: 'products.eyebrow.egyptian3d',
}

export function Products() {
  const { tk, cms } = useOverlay()
  const products = useCms((s) => s.products)
  const categories = useCms((s) => s.categories)

  const ordered = Object.values(categories).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <main id="top">
      <PageHero page="products" />

      <PackShot />

      {ordered.map((category) => {
        const inCategory = products.filter((p) => p.category_id === category.id)
        if (!inCategory.length) return null

        const eyebrowKey = EYEBROW_BY_SLUG[category.slug]
        const description = cms(overlayKey.categoryDescription(category.slug), category.description)

        return (
          <section className="section bay" id={category.slug} key={category.id}>
            {eyebrowKey && (
              <Reveal as="p" className="eyebrow">
                {tk(eyebrowKey)}
              </Reveal>
            )}
            <Reveal as="h2" delay={60}>
              {cms(overlayKey.categoryName(category.slug), category.name)}
            </Reveal>
            {description && (
              <Reveal as="p" className="lead" delay={110}>
                {description}
              </Reveal>
            )}

            <div className="pgrid">
              {inCategory.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  category={category}
                  delay={Math.min(i, 5) * 55}
                />
              ))}
            </div>
          </section>
        )
      })}

      <LoadCalculator />

      <section className="section cta" id="spec-sheet">
        <div className="bay">
          <Reveal as="h2">{tk('products.cta.h2')}</Reveal>
          <Reveal as="p" className="lead" delay={70}>
            {tk('products.cta.p')}
          </Reveal>
          <Reveal className="row" delay={140}>
            <ButtonRoute variant="fill" to="/contact#quote">
              {tk('products.cta.btn')}
            </ButtonRoute>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
