import type { AnchorHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

type ChevronLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  label: string
}

/**
 * Apple's chevron link: accent text, and the chevron slides forward on hover.
 * The glyph is marked `flip` so it points the correct way in RTL — the
 * hover translate is mirrored alongside it in index.css.
 */
export function ChevronLink({ label, className, ...props }: ChevronLinkProps) {
  return (
    <a className={cn('chev', className)} {...props}>
      <span>{label}</span>
      <Icon id="i-chev" size={15} flip />
    </a>
  )
}
