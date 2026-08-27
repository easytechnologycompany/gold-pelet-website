import { Hero } from '@/components/showcase/Hero'
import { ManufacturingStory } from '@/components/showcase/ManufacturingStory'
import { ProductRail } from '@/components/showcase/ProductRail'
import { BentoGrid } from '@/components/showcase/BentoGrid'
import { Statement } from '@/components/showcase/Statement'
import { Certifications } from '@/components/showcase/Certifications'
import { Cta } from '@/components/showcase/Cta'

/**
 * The home page, in the finished site's own section order: hero, the process
 * story, the catalogue, manufacturing capacity, the numbers, certifications,
 * and the closing banner.
 *
 * Every section renders from the live CMS and returns null when it has nothing
 * to show, so the page shortens rather than showing placeholders. The
 * alternating `--bg` / `--bg-2` grounds depend on this order — reordering means
 * re-checking the section backgrounds.
 */
export function Home() {
  return (
    <main id="top">
      <Hero />
      <ManufacturingStory />
      <ProductRail />
      <BentoGrid />
      <Statement />
      <Certifications />
      <Cta />
    </main>
  )
}
