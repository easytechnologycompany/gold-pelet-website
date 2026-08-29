import { useEffect } from 'react'

export type ToastState = { kind: 'success' | 'error'; message: string } | null

/**
 * The bottom-right toast from admin/js/api.js, with two changes.
 *
 * An error no longer auto-dismisses. The old showToast() hid everything after
 * 3.2s, which is fine for "Category created" and wrong for a failure the
 * operator has to read and act on, so errors stay until dismissed.
 *
 * The live region is polite for success and assertive for errors, and errors
 * carry role="alert" — a failed save is exactly the case where a screen
 * reader should interrupt rather than wait for a pause.
 */
export function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const isError = toast?.kind === 'error'

  useEffect(() => {
    if (!toast || isError) return
    const id = setTimeout(onDismiss, 3200)
    return () => clearTimeout(id)
  }, [toast, isError, onDismiss])

  if (!toast) return null

  return (
    <div
      className={`admin-toast admin-toast--${toast.kind}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <span>{toast.message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}
