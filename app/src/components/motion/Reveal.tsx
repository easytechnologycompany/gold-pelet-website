import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEventHandler,
  type ReactNode,
} from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

type RevealProps = {
  children: ReactNode
  /** Stagger, in ms. Feeds the `--d` custom property the CSS reads. */
  delay?: number
  className?: string
  style?: CSSProperties
  /** Defaults to a div; sections pass their own element. Lists and the enquiry
   *  form are included so revealing an item never forces a wrapper that would
   *  break `<ol>`/`<li>` or `<form>` semantics. */
  as?: 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'article' | 'section' | 'ul' | 'ol' | 'li' | 'form'
  /** Only meaningful with `as="form"`. */
  onSubmit?: FormEventHandler<HTMLFormElement>
}

/**
 * Cross-fade plus a short rise, driven by IntersectionObserver.
 *
 * Reduced motion is a *gentler equivalent*, not an absence of feedback: the
 * rise drops away and the element cross-fades instead (handled in the CSS).
 * Here it means the element is shown from the first render — derived, not set
 * from an effect, so there is no second render pass and nothing to flash.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  style,
  as = 'div',
  onSubmit,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const [intersected, setIntersected] = useState(false)
  const shown = Boolean(reduce) || intersected

  useEffect(() => {
    if (reduce) return
    const node = ref.current
    if (!node) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          setIntersected(true)
          io.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [reduce])

  const Tag = as as 'div'
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      onSubmit={onSubmit as FormEventHandler<HTMLDivElement> | undefined}
      className={cn('reveal', shown && 'in', className)}
      style={{ ...style, ...(delay ? ({ '--d': `${delay}ms` } as CSSProperties) : null) }}
      // Released once the transition has run so the compositor layer isn't
      // held for the life of the page.
      onTransitionEnd={(e) => {
        e.currentTarget.style.willChange = 'auto'
      }}
    >
      {children}
    </Tag>
  )
}
