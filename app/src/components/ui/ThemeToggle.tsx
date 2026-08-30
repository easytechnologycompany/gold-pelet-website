import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'

/**
 * Switches between light and dark. One button, used by the public header and
 * by the admin sidebar.
 *
 * It lived inside Chrome as a local component until the admin needed one too.
 * Copying it would have meant two buttons reading the same store and drifting
 * apart in behaviour, which is the shape of problem this codebase has already
 * had more than once.
 *
 * The label is a prop rather than read from a dictionary here, because the two
 * callers have different ones: the public site has four locales in
 * lib/content, the admin has two in its own dictionary, and neither should
 * reach into the other's. The icon and the store are the shared parts; the
 * word is not.
 */
export function ThemeToggle({ label, className }: { label: string; className?: string }) {
  const isDark = useTheme((s) => s.isDark)
  const toggle = useTheme((s) => s.toggle)

  return (
    <button className={className} type="button" aria-label={label} onClick={toggle}>
      {/* Shows the destination, not the current state. */}
      {isDark ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
    </button>
  )
}
