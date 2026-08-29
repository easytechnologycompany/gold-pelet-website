import { useEffect, useRef, type ReactNode } from 'react'

/**
 * The add/edit dialog.
 *
 * Replaces the old page's `.modal-backdrop.open` div, and adds the three
 * things that markup never had: focus moves into the dialog on open and
 * returns to whatever opened it on close, Tab is trapped inside while it is
 * open, and the page behind it cannot scroll.
 *
 * `aria-modal` with `role="dialog"` is what tells a screen reader the rest of
 * the page is inert; without the focus trap that promise is not kept, which
 * is why the two ship together.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)
  const restoreTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    restoreTo.current = document.activeElement as HTMLElement | null

    // Lenis drives the window scroll (components/motion/SmoothScroll), and it
    // keeps scrolling the page under an open dialog unless the body is locked.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null)

    // The first *field*, not the first focusable — the close button leads in
    // DOM order, and landing there would cost an extra Tab before typing.
    // Dialogs with no field at all (the delete confirm) fall back to the
    // first focusable, which is what should be focused there anyway.
    const items = focusables()
    const firstField = items.find((el) =>
      ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName),
    )
    ;(firstField ?? items[0])?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panel.current?.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      restoreTo.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="admin-backdrop"
      onMouseDown={(e) => {
        // mousedown, not click: a drag that starts inside the panel and ends
        // on the backdrop would otherwise close the dialog mid-selection.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" ref={panel}>
        <div className="admin-modal-head">
          <h2 id="admin-modal-title">{title}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
