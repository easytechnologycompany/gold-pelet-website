import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { LOCALE_CODE, LOCALE_NAME, LOCALES, useLang, useT, type Locale } from '@/lib/i18n'
import { ThemeToggle as SharedThemeToggle } from '@/components/ui/ThemeToggle'
import { useCms } from '@/lib/cms'
import { mediaURL } from '@/lib/api'
import { copy } from '@/lib/content'
import { useScrollLinked } from '@/components/motion/useScrollLinked'
import { useOverlay } from '@/lib/overlay'
import { cn } from '@/lib/utils'

/**
 * The finished site's six-item primary nav, keyed to its own `nav.*`
 * translation keys rather than a parallel set invented here — so a label the
 * live site already ships in four languages is the same label on this one.
 */
const NAV = [
  { to: '/', key: 'nav.home' },
  { to: '/products', key: 'nav.products' },
  { to: '/services', key: 'nav.services' },
  { to: '/about', key: 'nav.about' },
  { to: '/news', key: 'nav.news' },
  { to: '/contact', key: 'nav.contact' },
] as const

/**
 * Translucent fixed header with content scrolling underneath. The hairline
 * appears only once the page has left the top edge rather than sitting there
 * permanently — that's the `at-edge` class.
 */
export function Chrome() {
  const { t } = useT()
  const { tk } = useOverlay()
  const [atEdge, setAtEdge] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Same rAF tick that drives the hero pack. setState with an unchanged
  // value bails out before re-rendering, so this costs nothing per frame.
  useScrollLinked((y) => setAtEdge(y > 8))

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <header className={cn('chrome', atEdge && 'at-edge')}>
      <div className="inner">
        <Link className="brand" to="/">
          <BrandMark />
        </Link>

        <nav aria-label={t(copy.ariaPrimary)}>
          {NAV.map((item) => (
            // `end` only on "/", or Home would stay marked active on every
            // page, since every path starts with a slash.
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {tk(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="tools">
          {/* The live site's header CTA. Routed, not an anchor, so it works
              from any page rather than only from the one holding #quote. */}
          <Link className="nav-cta" to="/contact#quote">
            {tk('header.cta')}
          </Link>
          <LanguageMenu />
          <ThemeToggle />
          <button
            type="button"
            className="nav-burger"
            aria-expanded={menuOpen}
            aria-controls="nav-sheet"
            aria-label={t(copy.ariaPrimary)}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* The phone nav. The desktop row is display:none below 900px, so with
          six destinations this is the only way to reach five of them there. */}
      {menuOpen && (
        // Closing happens on the link itself rather than in an effect watching
        // the route: the sheet has to shut even when you tap the page you are
        // already on, which is not a route change at all.
        <div className="nav-sheet" id="nav-sheet" onClick={() => setMenuOpen(false)}>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {tk(item.key)}
            </NavLink>
          ))}
          <NavLink to="/contact#quote">{tk('header.cta')}</NavLink>
        </div>
      )}
    </header>
  )
}

/**
 * The real logo's mark from the CMS when it is reachable, and the hand-drawn
 * glyph when it is not. Either way the wordmark beside it is live text, which
 * is what keeps the company name legible at header size — the artwork's own
 * "ELET" lettering is what forced the full lockup small.
 *
 * The mark is cropped out of the full logo in CSS (see `.brand-logo`), so the
 * image is decorative here: the adjacent text already carries the name, and
 * an `alt` would make a screen reader say it twice.
 */
function BrandMark() {
  const { t } = useT()
  const branding = useCms((s) => s.branding)
  const logo = branding?.logo_url ? mediaURL(branding.logo_url) : null

  /**
   * The fallback below already covered "the CMS has no logo". It did not cover
   * "the CMS has a logo and the file did not arrive", which is a different
   * failure and the one that actually happens: the artwork is served from the
   * backend's origin, not this one, and that service sleeps. A phone on mobile
   * data meeting a cold start gets a failed image request where a desktop with
   * the file already cached never notices.
   *
   * Without this the <img> still rendered, .brand-logo still reserved its
   * 33x40 crop viewport, and nothing painted into it: the logo did not fall
   * back, it silently went missing next to the wordmark.
   */
  // Remembers which URL failed rather than a bare boolean, so a later upload
  // is attempted on its own merits: a different URL is by definition not the
  // one that failed. A boolean would need an effect to clear it, and a
  // setState in an effect is the cascading render this codebase avoids.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  return (
    <>
      {logo && failedUrl !== logo ? (
        // The plate is a separate element from the crop box: .brand-logo's
        // size *is* the crop viewport, so padding it would shift what the
        // overflow actually clips.
        <span className="brand-plate">
          <span className="brand-logo">
            <img src={logo} alt="" aria-hidden="true" onError={() => setFailedUrl(logo)} />
          </span>
        </span>
      ) : (
        <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="none" stroke="var(--accent)" strokeWidth="2" />
          <path
            d="M10,17.5 C10,12.5 15,9.5 19,11.5 C23,13.5 23,20 19,22 C15,24 10,22 10,17.5 Z"
            fill="var(--accent)"
          />
        </svg>
      )}
      <span className="brand-name">{t(copy.brand)}</span>
    </>
  )
}

/**
 * Four locales don't fit a binary toggle, so this is a listbox rather than a
 * button that cycles. Escape and outside-click both close it, and focus
 * returns to the trigger on selection.
 */
function LanguageMenu() {
  const { t } = useT()
  const locale = useLang((s) => s.locale)
  const setLocale = useLang((s) => s.setLocale)

  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }

    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (next: Locale) => {
    setLocale(next)
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div className="lang" ref={wrapRef}>
      <button
        ref={buttonRef}
        className="tap"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="lang-menu"
        aria-label={t(copy.ariaLanguage)}
        onClick={(e) => {
          // The document listener above would otherwise see this same click
          // bubble up and close the menu in the same tick it opened.
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        {LOCALE_CODE[locale]}
      </button>

      <ul className="lang-menu" id="lang-menu" role="listbox" aria-label={t(copy.ariaLanguage)} hidden={!open}>
        {LOCALES.map((code) => (
          <li
            key={code}
            role="option"
            aria-selected={code === locale}
            tabIndex={0}
            onClick={() => choose(code)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return
              e.preventDefault()
              choose(code)
            }}
          >
            <span>{LOCALE_CODE[code]}</span>
            {LOCALE_NAME[code]}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The shared control, wearing the header's skin and the visitor's label. */
function ThemeToggle() {
  const { t } = useT()
  return <SharedThemeToggle className="tap" label={t(copy.ariaAppearance)} />
}
