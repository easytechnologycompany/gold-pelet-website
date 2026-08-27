import { useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { ButtonRoute } from '@/components/ui/Button'
import {
  CONTAINERS,
  PACKAGING,
  PRODUCT_LINES,
  QUANTITY,
  UNITS,
  computeLoad,
  formatTonnes,
  type ContainerId,
} from '@/lib/calculator'
import { useOverlay } from '@/lib/overlay'

/**
 * The container load calculator from products.html.
 *
 * The arithmetic lives in lib/calculator.ts, ported unchanged — this component
 * only collects inputs and renders the result, exactly as the original split
 * `computeLoad()` from its animation layer. The numbers a visitor sees here
 * must match the live calculator for the same inputs.
 *
 * The count-up tweening on the original is deliberately not reproduced: it
 * animated the display of already-computed values and contributed nothing to
 * the result. Reveal handles the section's entrance instead.
 */
export function LoadCalculator() {
  const { tk, locale } = useOverlay()

  const [densityKgM3, setDensity] = useState<number>(PRODUCT_LINES[0].densityKgM3)
  const [bagKg, setBagKg] = useState<number>(PACKAGING[0].bagKg)
  const [quantity, setQuantity] = useState<string>(String(QUANTITY.initial))
  const [multiplier, setMultiplier] = useState<number>(UNITS[0].multiplier)
  const [containerId, setContainerId] = useState<ContainerId>('20std')

  const container = CONTAINERS[containerId]
  const packaging = PACKAGING.find((p) => p.bagKg === bagKg) ?? PACKAGING[0]
  const containerLabel = tk(container.labelKey)

  const rawQuantity = Number(quantity)
  const valid = Number.isFinite(rawQuantity) && rawQuantity > 0

  const result = useMemo(
    () =>
      valid ? computeLoad({ densityKgM3, orderKg: rawQuantity * multiplier, container, bagKg }) : null,
    [valid, densityKgM3, rawQuantity, multiplier, container, bagKg],
  )

  /** Mirrors the original stepper: clamp at min, round to 2dp. */
  const step = (direction: 1 | -1) => {
    const current = Number(quantity) || 0
    const next = Math.max(QUANTITY.min, Math.round((current + direction * QUANTITY.step) * 100) / 100)
    setQuantity(String(next))
  }

  const note = result
    ? tk(
        result.bindingConstraint === 'volume'
          ? 'products.calc.note.volumeLimited'
          : 'products.calc.note.weightLimited',
        {
          density: densityKgM3,
          container: containerLabel.toLowerCase(),
          volume: container.usableVolumeM3,
          approxWeight: formatTonnes(result.volumeLimitKg),
          maxWeight: formatTonnes(container.payloadKg),
        },
      )
    : ''

  const dash = '—'

  return (
    <section className="section bay" id="load-calculator">
      <div className="center">
        <Reveal as="p" className="eyebrow">
          {tk('products.calc.eyebrow')}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {tk('products.calc.h2')}
        </Reveal>
        <Reveal as="p" className="lead" delay={110}>
          {tk('products.calc.p')}
        </Reveal>
      </div>

      <Reveal className="calc" delay={160}>
        <div className="calc-grid">
          <div className="field">
            <label htmlFor="calc-category">{tk('products.calc.productLine')}</label>
            <select
              id="calc-category"
              value={densityKgM3}
              onChange={(e) => setDensity(Number(e.target.value))}
            >
              {PRODUCT_LINES.map((l) => (
                <option key={l.densityKgM3} value={l.densityKgM3}>
                  {tk(l.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="calc-packaging">{tk('products.calc.packagingFormat')}</label>
            <select
              id="calc-packaging"
              value={bagKg}
              onChange={(e) => setBagKg(Number(e.target.value))}
            >
              {PACKAGING.map((p) => (
                <option key={p.bagKg} value={p.bagKg}>
                  {tk(p.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="calc-quantity">{tk('products.calc.orderQuantity')}</label>
            <div className="calc-qty-row">
              <div className="calc-qty-stepper">
                <button
                  type="button"
                  className="calc-qty-btn"
                  aria-label={tk('products.calc.decreaseQty')}
                  onClick={() => step(-1)}
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <input
                  id="calc-quantity"
                  type="number"
                  min={QUANTITY.min}
                  step={QUANTITY.step}
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <button
                  type="button"
                  className="calc-qty-btn"
                  aria-label={tk('products.calc.increaseQty')}
                  onClick={() => step(1)}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>
              <select value={multiplier} onChange={(e) => setMultiplier(Number(e.target.value))}>
                {UNITS.map((u) => (
                  <option key={u.multiplier} value={u.multiplier}>
                    {tk(u.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="calc-container">{tk('products.calc.containerTypeLabel')}</label>
            <select
              id="calc-container"
              value={containerId}
              onChange={(e) => setContainerId(e.target.value as ContainerId)}
            >
              {(Object.keys(CONTAINERS) as ContainerId[]).map((id) => (
                <option key={id} value={id}>
                  {tk(CONTAINERS[id].labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="calc-out">
          <div className="calc-stat">
            <span className="cap">{tk('products.calc.containersNeeded')}</span>
            <strong>
              {result
                ? tk('products.calc.containersResult', {
                    count: result.containersNeeded,
                    container: containerLabel,
                  })
                : dash}
            </strong>
          </div>
          <div className="calc-stat">
            <span className="cap">{tk('products.calc.maxLoad')}</span>
            <strong>{result ? formatTonnes(result.maxLoadKg) : dash}</strong>
          </div>
          <div className="calc-stat">
            <span className="cap">
              {tk('products.calc.unitsTotal', { unit: tk(packaging.unitLabelKey) })}
            </span>
            <strong>
              {result ? new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale).format(result.totalUnits) : dash}
            </strong>
          </div>
          <div className="calc-stat">
            <span className="cap">{tk('products.calc.lastFill')}</span>
            <strong>{result ? `${result.fillPct}%` : dash}</strong>
            <div className="calc-bar" aria-hidden="true">
              <span
                className={result && result.fillPct < 40 ? 'is-low' : undefined}
                style={{ inlineSize: `${result?.fillPct ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {note && <p className="calc-note">{note}</p>}

        <div className="calc-foot">
          <p className="consent">{tk('products.calc.disclaimer')}</p>
          <ButtonRoute variant="ghost" to="/contact#quote">
            {tk('products.calc.requestQuote')}
          </ButtonRoute>
        </div>
      </Reveal>
    </section>
  )
}
