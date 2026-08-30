import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

/**
 * A listbox that looks like the rest of the system rather than like the OS.
 *
 * This replaces a native `<select>`. That was a deliberate choice originally --
 * the platform menu is accessible for free and is the wheel picker on a phone
 * -- and the one thing genuinely lost here is that picker. Everything else it
 * gave us is reimplemented below rather than assumed: the combobox roles, the
 * full keyboard model, and a panel that cannot be clipped.
 *
 * Three decisions worth knowing about.
 *
 * The panel is portalled to the body. A dropdown inside `.calc` is inside a
 * bordered, rounded card that also establishes containing blocks further up
 * the tree, and any of those can clip it. Portalling takes it out of that
 * subtree entirely, so it needs one modest z-index rather than a large one
 * fighting whatever it happens to overlap. It sits at 90: above the page,
 * below the fixed header at 100, and positioned so it never needs to overlap
 * the header anyway.
 *
 * Position is written straight to the node, never held in state. A React
 * render per scroll frame to move a panel is the same waste as one per scroll
 * frame to move the hero pack, and this codebase already refuses that
 * elsewhere. It also sidesteps a re-render between the panel mounting and it
 * being placed, which is what makes a portalled menu flash at the origin.
 *
 * The entrance is a CSS animation on insertion, not a transition triggered
 * from a frame callback. The callback version mounted the panel at opacity 0
 * and waited for requestAnimationFrame to reveal it, so anywhere rAF is
 * throttled -- a background tab being the ordinary case -- it opened invisible
 * and stayed that way. Whether the menu can be seen should not depend on a
 * frame callback firing.
 *
 * Focus stays on the trigger for the whole interaction, with
 * `aria-activedescendant` naming the active option. Moving real focus into the
 * list is the other valid pattern, but it means restoring focus on every exit
 * path and it makes Tab a trap to escape rather than a way out. This way Tab
 * simply leaves, which is what the key is for.
 */

export type SelectOption = { value: string; label: string }

/* The panel is only ever rendered in the browser, but the hook itself is
   called during the prerender, where useLayoutEffect warns. */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/** Matches the panel's transition; see .cselect-panel in index.css. */
const EXIT_MS = 190
/** How long a type-ahead search stays open before the next key starts a new one. */
const TYPE_MS = 700

export function Select({
  id,
  value,
  options,
  onChange,
  labelledBy,
}: {
  id: string
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
  /** id of the visible <label>, so the control is named without a second one. */
  labelledBy?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const exitTimer = useRef<number | null>(null)
  const typeBuffer = useRef('')
  const typeTimer = useRef<number | null>(null)
  const listboxId = `${id}-listbox`
  const reactId = useId()
  const optionId = (i: number) => `${reactId}-opt-${i}`

  const selected = options.find((o) => o.value === value)

  /**
   * Place the panel against the trigger and inside the viewport.
   *
   * Below by default. Flips above only when below genuinely cannot hold it and
   * above has more room, so a control near the fold does not flip on a couple
   * of pixels. Height is capped by whichever side it lands on, so a long list
   * scrolls internally instead of running off the screen.
   */
  const place = useCallback(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return

    const r = trigger.getBoundingClientRect()
    const margin = 8
    // The header is fixed; keep the panel clear of it rather than under it.
    const chrome = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--chrome-h'),
    ) || 64

    const below = window.innerHeight - r.bottom - margin
    const above = r.top - chrome - margin
    const wanted = panel.scrollHeight

    // Flip only when below cannot reasonably hold it and above is roomier, so
    // a control near the fold does not flip over a couple of pixels.
    const flip = below < Math.min(wanted, 176) && above > below
    // Clamped to the side it actually lands on, with no minimum: a floor here
    // would win over the clamp and push the panel back off the screen, which
    // is exactly what it did at 375 where the space below is under 120px.
    const maxHeight = Math.min(wanted, Math.max(0, flip ? above : below))

    panel.style.width = `${r.width}px`
    panel.style.left = `${r.left}px`
    panel.style.maxHeight = `${maxHeight}px`
    if (flip) {
      panel.style.top = `${r.top - margin - maxHeight}px`
      panel.dataset.side = 'top'
    } else {
      panel.style.top = `${r.bottom + margin}px`
      panel.dataset.side = 'bottom'
    }
  }, [])

  /** Close with the exit animation, then unmount. */
  const close = useCallback((focusTrigger = true) => {
    const panel = panelRef.current
    if (focusTrigger) triggerRef.current?.focus()
    if (!panel) {
      setOpen(false)
      return
    }
    panel.dataset.state = 'closing'
    if (exitTimer.current) window.clearTimeout(exitTimer.current)
    exitTimer.current = window.setTimeout(() => setOpen(false), EXIT_MS)
  }, [])

  const openWith = useCallback(
    (index: number) => {
      if (exitTimer.current) window.clearTimeout(exitTimer.current)
      setActiveIndex(index)
      setOpen(true)
    },
    [],
  )

  const commit = useCallback(
    (index: number) => {
      const option = options[index]
      if (option) onChange(option.value)
      close()
    },
    [close, onChange, options],
  )

  /**
   * Placement, dismissal and follow-on-scroll, all while open.
   *
   * `place` runs in this layout effect so the panel is positioned in the same
   * frame it appears, before a paint at the wrong coordinates. The scroll
   * listener is passive and on capture, so it also fires for scrollable
   * ancestors rather than only the window.
   */
  useIsoLayoutEffect(() => {
    if (!open) return
    place()
  }, [open, place])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return
      close(false)
    }
    const onScrollOrResize = () => place()

    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, place, close])

  /** Keep the active option in view as the arrows move it. */
  useEffect(() => {
    if (!open) return
    panelRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  useEffect(() => () => {
    if (exitTimer.current) window.clearTimeout(exitTimer.current)
    if (typeTimer.current) window.clearTimeout(typeTimer.current)
  }, [])

  /**
   * Jump to an option by typing its opening letters, the way a native select
   * does. The buffer clears after a pause, so "co" finds Corn while c-then-c
   * cycles through everything starting with c -- the repeated-character case
   * is treated as cycling rather than as a search for "cc", which would match
   * nothing.
   *
   * Matching is on the rendered label with `toLocaleLowerCase`, so it works in
   * whatever language the labels are currently in: nothing here knows or cares
   * that they might be English. Turkish is the reason for the locale-aware
   * form rather than plain toLowerCase -- I is not i there.
   *
   * Typing while closed opens the menu on the match rather than committing it
   * silently. A native select can change its value unseen because the OS gives
   * that its own feedback; here, showing the list is the feedback.
   */
  const typeahead = (char: string) => {
    if (typeTimer.current) window.clearTimeout(typeTimer.current)
    typeTimer.current = window.setTimeout(() => { typeBuffer.current = '' }, TYPE_MS)
    typeBuffer.current += char.toLocaleLowerCase()

    const buf = typeBuffer.current
    const repeated = buf.length > 1 && [...buf].every((c) => c === buf[0])
    const query = repeated ? buf[0] : buf
    // A repeat or a first keystroke moves on from where we are; a longer
    // search restarts from the top so it can narrow rather than skip.
    const from = repeated || buf.length === 1 ? activeIndex + 1 : 0

    for (let i = 0; i < options.length; i++) {
      const idx = (from + i) % options.length
      if (options[idx].label.toLocaleLowerCase().startsWith(query)) {
        setActiveIndex(idx)
        if (!open) setOpen(true)
        return
      }
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Printable keys search. Space is the exception: it opens and commits
    // until a search is already running, at which point it is just a space.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key !== ' ' || typeBuffer.current) {
        e.preventDefault()
        typeahead(e.key)
        return
      }
    }

    const last = options.length - 1
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) openWith(selectedIndex)
        else setActiveIndex((i) => Math.min(last, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) openWith(selectedIndex)
        else setActiveIndex((i) => Math.max(0, i - 1))
        break
      case 'Home':
        if (open) { e.preventDefault(); setActiveIndex(0) }
        break
      case 'End':
        if (open) { e.preventDefault(); setActiveIndex(last) }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open) commit(activeIndex)
        else openWith(selectedIndex)
        break
      case 'Escape':
        if (open) { e.preventDefault(); close() }
        break
      case 'Tab':
        // Not trapped: let the key move on, just do not leave a menu behind.
        if (open) close(false)
        break
    }
  }

  return (
    <div className="cselect">
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className="cselect-trigger"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-labelledby={labelledBy ? `${labelledBy} ${id}` : undefined}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        onClick={() => (open ? close() : openWith(selectedIndex))}
        onKeyDown={onKeyDown}
      >
        <span className="cselect-value">{selected?.label ?? ''}</span>
        <ChevronDown className="chev" size={18} aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            className="cselect-panel"
            role="listbox"
            /* data-state and data-side are set imperatively below and are
               deliberately absent here: React re-renders on every activeIndex
               change, and a rendered attribute would be reset to its JSX value
               each time -- which put the panel back to opacity 0 mid-open. */
            aria-labelledby={labelledBy}
            // Keeps focus on the trigger: pointerdown here must not blur it.
            onPointerDown={(e) => e.preventDefault()}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value
              return (
                <div
                  key={o.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  data-active={i === activeIndex}
                  className="cselect-option"
                  onPointerEnter={() => setActiveIndex(i)}
                  onClick={() => commit(i)}
                >
                  <span>{o.label}</span>
                  {isSelected && <Check size={16} aria-hidden="true" />}
                </div>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
