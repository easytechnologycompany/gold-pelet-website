import type { IconId, GlyphId } from '@/lib/products'
import { cn } from '@/lib/utils'

type IconProps = {
  id: IconId | GlyphId
  size?: number
  className?: string
  /** Mirrors the glyph under RTL. Directional icons only — a chevron that
   *  points "forward" has to point the other way in Arabic. */
  flip?: boolean
  style?: React.CSSProperties
}

/** References a symbol from the sprite. Always decorative: every icon here
 *  is `aria-hidden`, and icon-only controls carry their own aria-label. */
export function Icon({ id, size = 24, className, flip, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={cn(flip && 'flip', className)}
      style={style}
      aria-hidden="true"
    >
      <use href={`#${id}`} />
    </svg>
  )
}
