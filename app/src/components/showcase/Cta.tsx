import { Reveal } from '@/components/motion/Reveal'
import { ButtonRoute } from '@/components/ui/Button'
import { useOverlay } from '@/lib/overlay'

/**
 * The home page's closing banner, on the live site's `home.cta` copy. Both
 * buttons are routed rather than in-page anchors: they lead to the quote form
 * and the catalogue, which are now real pages.
 */
export function Cta() {
  const { tk } = useOverlay()

  return (
    <section className="section cta" id="trade">
      <div className="bay">
        <Reveal as="h2">{tk('home.cta.h2')}</Reveal>
        <Reveal as="p" className="lead" delay={70}>
          {tk('home.cta.p')}
        </Reveal>
        <Reveal className="row" delay={140}>
          <ButtonRoute variant="fill" to="/contact#quote">
            {tk('home.cta.btn1')}
          </ButtonRoute>
          <ButtonRoute variant="ghost" to="/products">
            {tk('home.cta.btn2')}
          </ButtonRoute>
        </Reveal>
      </div>
    </section>
  )
}
