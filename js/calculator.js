/* ============================================================
   Container Load Calculator (products.html)
   Client-side only — no backend dependency. Estimates container
   count from order quantity, product bulk density and packaging
   format, checking both the container's weight payload limit and
   its usable volume limit (whichever binds first).
   ============================================================ */

// Standard ocean-freight container specs. Usable volume already
// discounts nominal cubic capacity for palletized/bagged packing
// efficiency (~85%), not the empty-box CBM figure.
const CONTAINERS = {
  '20std': { labelKey: 'products.calc.container.20std', payloadKg: 28200, usableVolumeM3: 28 },
  '40std': { labelKey: 'products.calc.container.40std', payloadKg: 26700, usableVolumeM3: 58 },
  '40hc': { labelKey: 'products.calc.container.40hc', payloadKg: 28000, usableVolumeM3: 68 },
};

function computeLoad({ densityKgM3, orderKg, container, bagKg }) {
  const volumeLimitKg = container.usableVolumeM3 * densityKgM3;
  const maxLoadKg = Math.min(container.payloadKg, volumeLimitKg);
  const bindingConstraint = volumeLimitKg < container.payloadKg ? 'volume' : 'weight';

  const containersNeeded = Math.max(1, Math.ceil(orderKg / maxLoadKg));
  const totalUnits = Math.ceil(orderKg / bagKg);
  const unitsPerContainer = Math.floor(maxLoadKg / bagKg);
  const lastContainerLoadKg = orderKg - maxLoadKg * (containersNeeded - 1);
  const fillPct = Math.min(100, Math.round((lastContainerLoadKg / maxLoadKg) * 100));

  return { maxLoadKg, containersNeeded, totalUnits, unitsPerContainer, fillPct, bindingConstraint, volumeLimitKg };
}

function formatTonnes(kg) {
  return `${(kg / 1000).toFixed(kg % 1000 === 0 ? 0 : 1)}t`;
}

function initLoadCalculator() {
  const categorySelect = document.getElementById('calc-category');
  const packagingSelect = document.getElementById('calc-packaging');
  const quantityInput = document.getElementById('calc-quantity');
  const unitSelect = document.getElementById('calc-unit');
  const containerSelect = document.getElementById('calc-container');
  if (!categorySelect || !quantityInput || !containerSelect) return;

  const outContainers = document.getElementById('calc-out-containers');
  const outPerLoad = document.getElementById('calc-out-perload');
  const outUnits = document.getElementById('calc-out-units');
  const outUnitsLabel = document.getElementById('calc-out-units-label');
  const outFill = document.getElementById('calc-out-fill');
  const outNote = document.getElementById('calc-out-note');

  function render() {
    const densityKgM3 = Number(categorySelect.value);
    const bagKg = Number(packagingSelect.value);
    const unitLabelKey = packagingSelect.selectedOptions[0].dataset.unitLabelKey;
    const unitLabel = window.t ? window.t(unitLabelKey) : unitLabelKey;
    const rawQuantity = Number(quantityInput.value);
    const unitMultiplier = Number(unitSelect.value);
    const container = CONTAINERS[containerSelect.value];

    if (!rawQuantity || rawQuantity <= 0 || !container) {
      outContainers.textContent = '—';
      outPerLoad.textContent = '—';
      outUnits.textContent = '—';
      outFill.textContent = '—';
      outNote.textContent = '';
      return;
    }

    const containerLabel = window.t ? window.t(container.labelKey) : container.labelKey;
    const orderKg = rawQuantity * unitMultiplier;
    const result = computeLoad({ densityKgM3, orderKg, container, bagKg });

    outContainers.textContent = window.t
      ? window.t('products.calc.containersResult', { count: result.containersNeeded, container: containerLabel })
      : `${result.containersNeeded} × ${containerLabel}`;
    outPerLoad.textContent = formatTonnes(result.maxLoadKg);
    outUnits.textContent = result.totalUnits.toLocaleString('en-US');
    outUnitsLabel.textContent = window.t ? window.t('products.calc.unitsTotal', { unit: unitLabel }) : `${unitLabel} — Total`;
    outFill.textContent = `${result.fillPct}%`;

    const noteVars = {
      density: densityKgM3,
      container: containerLabel.toLowerCase(),
      volume: container.usableVolumeM3,
      approxWeight: formatTonnes(result.volumeLimitKg),
      maxWeight: formatTonnes(container.payloadKg),
    };
    outNote.textContent = window.t
      ? window.t(result.bindingConstraint === 'volume' ? 'products.calc.note.volumeLimited' : 'products.calc.note.weightLimited', noteVars)
      : '';
  }

  [categorySelect, packagingSelect, quantityInput, unitSelect, containerSelect].forEach((el) =>
    el.addEventListener('input', render)
  );
  window.reRenderCalculator = render;
  render();
}

document.addEventListener('DOMContentLoaded', initLoadCalculator);
