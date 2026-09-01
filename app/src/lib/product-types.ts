import { useCms } from '@/lib/cms'
import { overlayKey, useOverlay } from '@/lib/overlay'

/**
 * The product types the catalogue actually has, in the CMS's own order.
 *
 * One list, three consumers: the header menu, the footer's Products column and
 * the enquiry form's product field. Each of those used to carry its own
 * hard-coded wheat/potato/corn triple, which was fine only for as long as the
 * catalogue held exactly those three and held them forever. Retire a line in
 * the admin and the header noticed while the other two went on advertising it
 * — the footer with an anchor to a section that no longer renders, the quote
 * form by inviting an enquiry about something nobody sells.
 *
 * Empty categories are dropped rather than shown empty, which is the same rule
 * `/products` applies when it declines to render a section with nothing in it.
 * That is what keeps the three views agreeing: a category is offered here
 * exactly when there is something to land on.
 */
export type ProductType = {
  slug: string
  /** The catalogue page renders each category section under its slug. */
  to: string
  label: string
}

export function useProductTypes(): ProductType[] {
  const { cms } = useOverlay()
  const categories = useCms((s) => s.categories)
  const products = useCms((s) => s.products)

  return Object.values(categories)
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((c) => products.some((p) => p.category_id === c.id))
    .map((c) => ({
      slug: c.slug,
      to: `/products#${c.slug}`,
      label: cms(overlayKey.categoryName(c.slug), c.name),
    }))
}
