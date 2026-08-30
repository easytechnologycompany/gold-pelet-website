import { useMemo, useState, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { Select } from '@/components/ui/Select'
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
  const number = (n: number) =>
    new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale).format(n)

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
          <Field id="calc-category" label={tk('products.calc.productLine')}>
            <Select
              id="calc-category"
              labelledBy="calc-category-label"
              value={String(densityKgM3)}
              onChange={(v) => setDensity(Number(v))}
              options={PRODUCT_LINES.map((l) => ({
                value: String(l.densityKgM3),
                label: tk(l.labelKey),
              }))}
            />
          </Field>

          <Field id="calc-packaging" label={tk('products.calc.packagingFormat')}>
            <Select
              id="calc-packaging"
              labelledBy="calc-packaging-label"
              value={String(bagKg)}
              onChange={(v) => setBagKg(Number(v))}
              options={PACKAGING.map((p) => ({
                value: String(p.bagKg),
                label: tk(p.labelKey),
              }))}
            />
          </Field>

          <Field id="calc-quantity" label={tk('products.calc.orderQuantity')}>
            <div className="qty-row">
              <div className="qty">
                <button
                  type="button"
                  className="qty-btn"
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
                  className="qty-btn"
                  aria-label={tk('products.calc.increaseQty')}
                  onClick={() => step(1)}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>

              {/* Two options, so both stay visible instead of hiding behind a
                  dropdown. State is the multiplier, never the label. */}
              <div className="seg" role="group" aria-label={tk('products.calc.orderQuantity')}>
                {UNITS.map((u) => (
                  <button
                    key={u.multiplier}
                    type="button"
                    className={multiplier === u.multiplier ? 'is-active' : undefined}
                    aria-pressed={multiplier === u.multiplier}
                    onClick={() => setMultiplier(u.multiplier)}
                  >
                    {tk(u.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          <Field id="calc-container" label={tk('products.calc.containerTypeLabel')}>
            <Select
              id="calc-container"
              labelledBy="calc-container-label"
              value={containerId}
              onChange={(v) => setContainerId(v as ContainerId)}
              options={(Object.keys(CONTAINERS) as ContainerId[]).map((cid) => ({
                value: cid,
                label: tk(CONTAINERS[cid].labelKey),
              }))}
            />
          </Field>
        </div>

        <div className="calc-out">
          <div className="calc-stat lead">
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
            <strong>{result ? number(result.totalUnits) : dash}</strong>
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

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="calc-field">
      {/* The id is what the combobox points `aria-labelledby` at: `htmlFor`
          names an input, but it does not name a button. Harmless for the
          quantity field, which is a real input and uses both. */}
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}
