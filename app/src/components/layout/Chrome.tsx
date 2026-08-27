import { useEffect, useRef, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { LOCALE_CODE, LOCALE_NAME, LOCALES, useLang, useT, type Locale } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { useCms } from '@/lib/cms'
import { mediaURL } from '@/lib/api'
import { copy } from '@/lib/content'
import { useScrollLinked } from '@/components/motion/useScrollLinked'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '#story', key: 'navOverview' },
  { href: '#range', key: 'navProducts' },
  { href: '#made', key: 'navMade' },
  { href: '#specs', key: 'navSpecs' },
  { href: '#trade', key: 'navTrade' },
] as const

/**
 * Translucent fixed header with content scrolling underneath. The hairline
 * appears only once the page has left the top edge rather than sitting there
 * permanently — that's the `at-edge` class.
 */
export function Chrome() {
  const { t } = useT()
  const [atEdge, setAtEdge] = useState(false)

  // Same rAF tick that drives the hero pack. setState with an unchanged
  // value bails out before re-rendering, so this costs nothing per frame.
  useScrollLinked((y) => setAtEdge(y > 8))

  return (
    <header className={cn('chrome', atEdge && 'at-edge')}>
      <div className="inner">
        <a className="brand" href="#top">
          <BrandMark />
        </a>

        <nav aria-label={t(copy.ariaPrimary)}>
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {t(copy[item.key])}
            </a>
          ))}
        </nav>

        <div className="tools">
          <LanguageMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

/**
 * The real logo from the CMS when it is reachable, and the hand-drawn mark
 * plus wordmark when it is not.
 *
 * The CMS artwork is a complete lockup — it already spells "GOLD PELET" — so
 * it stands alone rather than sitting next to the text, which would print the
 * company name twice. `alt` carries the name for anyone not seeing the image.
 */
function BrandMark() {
  const { t } = useT()
  const branding = useCms((s) => s.branding)
  const logo = branding?.logo_url ? mediaURL(branding.logo_url) : null

  if (logo) {
    // Intrinsic ratio is 910×576; these keep the box reserved before load.
    return <img className="brand-logo" src={logo} alt={t(copy.brand)} width={54} height={34} />
  }

  return (
    <>
      <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="none" stroke="var(--accent)" strokeWidth="2" />
        <path
          d="M10,17.5 C10,12.5 15,9.5 19,11.5 C23,13.5 23,20 19,22 C15,24 10,22 10,17.5 Z"
          fill="var(--accent)"
        />
      </svg>
      <span>{t(copy.brand)}</span>
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

function ThemeToggle() {
  const { t } = useT()
  const isDark = useTheme((s) => s.isDark)
  const toggle = useTheme((s) => s.toggle)

  return (
    <button className="tap" type="button" aria-label={t(copy.ariaAppearance)} onClick={toggle}>
      {/* Shows the destination, not the current state. */}
      {isDark ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
    </button>
  )
}
