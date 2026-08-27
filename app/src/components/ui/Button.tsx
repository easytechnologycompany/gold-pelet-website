import type { VariantProps } from 'class-variance-authority'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button-variants'

type Variants = VariantProps<typeof buttonVariants>

export function Button({
  variant,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Variants) {
  return <button type="button" className={cn(buttonVariants({ variant }), className)} {...props} />
}

/** Same skin, anchor semantics — used for in-page jumps like `#trade`. */
export function ButtonLink({
  variant,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & Variants) {
  return <a className={cn(buttonVariants({ variant }), className)} {...props} />
}

/**
 * Same skin again, but routed. `ButtonLink` renders a bare `<a>`, so pointing
 * it at `/contact` would reload the whole app and throw away the CMS store
 * this session already hydrated. Anything crossing between pages uses this.
 */
export function ButtonRoute({
  variant,
  className,
  ...props
}: LinkProps & Variants) {
  return <Link className={cn(buttonVariants({ variant }), className)} {...props} />
}
