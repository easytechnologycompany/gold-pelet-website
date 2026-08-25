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
  '20std': { label: "20' Standard", payloadKg: 28200, usableVolumeM3: 28 },
  '40std': { label: "40' Standard", payloadKg: 26700, usableVolumeM3: 58 },
  '40hc': { label: "40' High Cube", payloadKg: 28000, usableVolumeM3: 68 },
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
    const unitLabel = packagingSelect.selectedOptions[0].dataset.unitLabel;
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

    const orderKg = rawQuantity * unitMultiplier;
    const result = computeLoad({ densityKgM3, orderKg, container, bagKg });

    outContainers.textContent = `${result.containersNeeded} × ${container.label}`;
    outPerLoad.textContent = formatTonnes(result.maxLoadKg);
    outUnits.textContent = result.totalUnits.toLocaleString('en-US');
    outUnitsLabel.textContent = `${unitLabel} — Total`;
    outFill.textContent = `${result.fillPct}%`;

    outNote.textContent =
      result.bindingConstraint === 'volume'
        ? `This load is volume-limited: at an estimated ${densityKgM3} kg/m³ bulk density, the ${container.label.toLowerCase()} fills its ${container.usableVolumeM3} m³ usable capacity (≈${formatTonnes(result.volumeLimitKg)}) before reaching its ${formatTonnes(container.payloadKg)} weight limit.`
        : `This load is weight-limited: the ${container.label.toLowerCase()} reaches its ${formatTonnes(container.payloadKg)} payload limit before filling its ${container.usableVolumeM3} m³ usable capacity.`;
  }

  [categorySelect, packagingSelect, quantityInput, unitSelect, containerSelect].forEach((el) =>
    el.addEventListener('input', render)
  );
  render();
}

document.addEventListener('DOMContentLoaded', initLoadCalculator);
