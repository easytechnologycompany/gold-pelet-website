import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { copy } from '@/lib/content'
import { useT } from '@/lib/i18n'

/**
 * Not part of the approved design — the router needs a terminal state. Built
 * entirely from existing tokens and type scale so it introduces no new visual
 * language: eyebrow, h2, one chevron back.
 */
export function NotFound() {
  const { t } = useT()

  return (
    <main className="nf">
      <p className="eyebrow">404</p>
      <h2>{t(copy.nfTitle)}</h2>
      <Link className="chev" to="/">
        <span>{t(copy.nfBack)}</span>
        <Icon id="i-chev" size={15} flip />
      </Link>
    </main>
  )
}
