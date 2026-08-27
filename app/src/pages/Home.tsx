import { Hero } from '@/components/showcase/Hero'
import { Statement } from '@/components/showcase/Statement'
import { BentoGrid } from '@/components/showcase/BentoGrid'
import { ManufacturingStory } from '@/components/showcase/ManufacturingStory'
import { ProductRail } from '@/components/showcase/ProductRail'
import { Specs } from '@/components/showcase/Specs'
import { Cta } from '@/components/showcase/Cta'

/**
 * The approved design is a single product page; the nav targets are sections
 * on it, not routes. Section order is fixed — Hero → Statement → Bento →
 * Rail → Specs → CTA — and the alternating `--bg` / `--bg-2` grounds depend
 * on it, so reordering means re-checking the section backgrounds.
 */
export function Home() {
  return (
    <main id="top">
      <Hero />
      <Statement />
      <BentoGrid />
      {/* Renders only when the CMS has process photography — see the
          component. It sits under the bento so #made covers the whole
          manufacturing story, credentials then process. */}
      <ManufacturingStory />
      <ProductRail />
      <Specs />
      <Cta />
    </main>
  )
}
