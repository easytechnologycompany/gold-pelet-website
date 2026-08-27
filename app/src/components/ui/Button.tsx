import type { VariantProps } from 'class-variance-authority'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
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

/** Same skin, anchor semantics — used for the CTA row, which navigates. */
export function ButtonLink({
  variant,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & Variants) {
  return <a className={cn(buttonVariants({ variant }), className)} {...props} />
}
