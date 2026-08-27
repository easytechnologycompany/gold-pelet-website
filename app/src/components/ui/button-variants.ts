import { cva } from 'class-variance-authority'

/**
 * The base `.btn` class carries the 44px touch-target floor and the
 * press-feedback transform; the variants only swap fill and border. Keeping
 * the rules in CSS rather than inlining utilities is what lets the token
 * layer and the `:active` scale stay in one place.
 *
 * Lives apart from Button.tsx so that file exports components only and Fast
 * Refresh keeps working.
 */
export const buttonVariants = cva('btn', {
  variants: {
    variant: {
      fill: 'btn-fill',
      ghost: 'btn-ghost',
    },
  },
  defaultVariants: { variant: 'fill' },
})
