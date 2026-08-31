import { PageHero } from '@/components/layout/PageHero'
import { Reveal } from '@/components/motion/Reveal'
import { ButtonRoute } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { mediaURL } from '@/lib/api'
import { useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'

/**
 * Events & News. Every item is a live `/public/news` record the admin
 * dashboard owns — there is no designed fallback list, because a fabricated
 * trade-show date is worse than an empty page. When the feed is empty the hero
 * and the closing CTA still stand on their own.
 *
 * News records are English-only in the database and have no overrides in
 * js/i18n.js, so an item reads the same in all four locales — matching the
 * live site.
 */
export function News() {
  const { tk } = useOverlay()
  const news = useCms((s) => s.news)

  // Featured first — see the sort in cms.ts. The lead item spans the grid so
  // the page has a focal point instead of an undifferentiated wall of cards.
  const [lead, ...rest] = news

  return (
    <main id="top">
      <PageHero page="news" />

      {news.length > 0 && (
        <section className="section bay" id="updates">
          <div className="bento">
            {lead && (
              <Reveal as="article" className="cell w6 tint">
                {lead.image_url ? (
                  <div className="shot-top">
                    <img src={mediaURL(lead.image_url)} alt="" loading="lazy" decoding="async" />
                  </div>
                ) : null}
                <span className="cap">{lead.date_label}</span>
                <h3>{lead.title}</h3>
                <p>{lead.description}</p>
              </Reveal>
            )}

            {rest.map((n, i) => (
              <Reveal key={n.id} as="article" className="cell w3" delay={(i + 1) * 55}>
                {n.image_url ? (
                  <div className="shot-top">
                    <img src={mediaURL(n.image_url)} alt="" loading="lazy" decoding="async" />
                  </div>
                ) : (
                  <span className="ico">
                    <Icon id="i-check" />
                  </span>
                )}
                <span className="cap">{n.date_label}</span>
                <h3>{n.title}</h3>
                <p>{n.description}</p>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="section cta" id="meet">
        <div className="bay">
          <Reveal as="h2">{tk('news.cta.h2')}</Reveal>
          <Reveal as="p" className="lead" delay={70}>
            {tk('news.cta.p')}
          </Reveal>
          <Reveal className="row" delay={140}>
            <ButtonRoute variant="fill" to="/contact#quote">
              {tk('news.cta.btn')}
            </ButtonRoute>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
