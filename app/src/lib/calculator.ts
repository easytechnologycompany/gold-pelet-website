/**
 * Container load maths, ported verbatim from js/calculator.js.
 *
 * `computeLoad` is the single source of truth for the logistics numbers on the
 * finished site, and every constant below — payloads, usable volumes, bulk
 * densities, packaging weights — is copied unchanged. Results must stay
 * identical to the live calculator, so treat this as a fixed contract: if the
 * old file changes, change this to match rather than improving it here.
 *
 * The usable volumes already discount nominal cubic capacity for palletized
 * and bagged packing efficiency (~85%); they are not empty-box CBM figures.
 */

export type ContainerId = '20std' | '40std' | '40hc'

export type ContainerSpec = {
  labelKey: string
  payloadKg: number
  usableVolumeM3: number
}

export const CONTAINERS: Record<ContainerId, ContainerSpec> = {
  '20std': { labelKey: 'products.calc.container.20std', payloadKg: 28200, usableVolumeM3: 28 },
  '40std': { labelKey: 'products.calc.container.40std', payloadKg: 26700, usableVolumeM3: 58 },
  '40hc': { labelKey: 'products.calc.container.40hc', payloadKg: 28000, usableVolumeM3: 68 },
}

/** Typical bulk density per product line, kg/m³. Values from the live form. */
export const PRODUCT_LINES = [
  { densityKgM3: 550, labelKey: 'categories.wheat.name' },
  { densityKgM3: 580, labelKey: 'categories.potato.name' },
  { densityKgM3: 520, labelKey: 'categories.corn.name' },
] as const

/** Packaging formats: `bagKg` is the unit weight, `unitLabelKey` names it. */
export const PACKAGING = [
  { bagKg: 25, labelKey: 'products.calc.packaging.bags25', unitLabelKey: 'products.calc.unitLabel.bags25' },
  { bagKg: 1000, labelKey: 'products.calc.packaging.jumbo1000', unitLabelKey: 'products.calc.unitLabel.jumbo1000' },
  { bagKg: 20, labelKey: 'products.calc.packaging.cartons20', unitLabelKey: 'products.calc.unitLabel.cartons20' },
] as const

/** Quantity units: the multiplier converts the typed figure into kilograms. */
export const UNITS = [
  { multiplier: 1000, labelKey: 'products.calc.tonnes' },
  { multiplier: 1, labelKey: 'products.calc.kilograms' },
] as const

/** The live form's own input constraints. */
export const QUANTITY = { min: 0.1, step: 0.5, initial: 20 } as const

export type LoadInput = {
  densityKgM3: number
  orderKg: number
  container: ContainerSpec
  bagKg: number
}

export type LoadResult = {
  maxLoadKg: number
  containersNeeded: number
  totalUnits: number
  unitsPerContainer: number
  fillPct: number
  bindingConstraint: 'volume' | 'weight'
  volumeLimitKg: number
}

export function computeLoad({ densityKgM3, orderKg, container, bagKg }: LoadInput): LoadResult {
  const volumeLimitKg = container.usableVolumeM3 * densityKgM3
  const maxLoadKg = Math.min(container.payloadKg, volumeLimitKg)
  const bindingConstraint = volumeLimitKg < container.payloadKg ? 'volume' : 'weight'

  const containersNeeded = Math.max(1, Math.ceil(orderKg / maxLoadKg))
  const totalUnits = Math.ceil(orderKg / bagKg)
  const unitsPerContainer = Math.floor(maxLoadKg / bagKg)
  const lastContainerLoadKg = orderKg - maxLoadKg * (containersNeeded - 1)
  const fillPct = Math.min(100, Math.round((lastContainerLoadKg / maxLoadKg) * 100))

  return {
    maxLoadKg,
    containersNeeded,
    totalUnits,
    unitsPerContainer,
    fillPct,
    bindingConstraint,
    volumeLimitKg,
  }
}

export function formatTonnes(kg: number): string {
  return `${(kg / 1000).toFixed(kg % 1000 === 0 ? 0 : 1)}t`
}
