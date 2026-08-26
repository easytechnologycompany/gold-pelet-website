/* ============================================================
   Container Load Calculator (products.html)
   Client-side only — no backend dependency. Estimates container
   count from order quantity, product bulk density and packaging
   format, checking both the container's weight payload limit and
   its usable volume limit (whichever binds first).

   computeLoad() below is the single source of truth for the actual
   logistics math — nothing in the animation/interaction layer further
   down touches those numbers, it only tweens how the *already
   computed* result is displayed.
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

/* ---------------- Motion layer ---------------- */
// Everything below animates the *display* of already-computed values —
// count-up/down tweening, the result-card "pulse", the fill bar, and the
// constraint-note crossfade. None of it feeds back into computeLoad().

const REDUCE_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TWEEN_MS = 400; // within the requested 300-500ms window
const PULSE_MS = 480; // matches the CSS transition on .calc-result-stat

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/** Tweens a single number from `from` to `to`, calling onFrame(currentValue)
 * every animation frame. Snaps straight to the end value when the user
 * prefers reduced motion, or when there's nothing to animate. */
function tweenValue(from, to, onFrame, onDone) {
  if (REDUCE_MOTION || from === to || !Number.isFinite(from)) {
    onFrame(to);
    if (onDone) onDone();
    return;
  }
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / TWEEN_MS);
    onFrame(from + (to - from) * easeOutCubic(t));
    if (t < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  requestAnimationFrame(step);
}

/** Briefly adds .is-updated to a result-card so the CSS lift/border-accent
 * transition plays, then removes it — only called for a stat whose value
 * actually changed. */
function pulseCard(el) {
  if (!el || REDUCE_MOTION) return;
  el.classList.remove('is-updated');
  void el.offsetWidth; // restart the transition if a previous pulse is still fading out
  el.classList.add('is-updated');
  clearTimeout(el._pulseTimer);
  el._pulseTimer = setTimeout(() => el.classList.remove('is-updated'), PULSE_MS);
}

/** Crossfades a text node's content: fades out, swaps the text once faded,
 * fades back in. No-ops immediately (still swaps text) under reduced
 * motion. Skips entirely if the text isn't actually changing. */
function crossfadeText(el, newText) {
  if (!el || el.textContent === newText) return;
  if (REDUCE_MOTION) {
    el.textContent = newText;
    return;
  }
  el.classList.add('is-swapping');
  clearTimeout(el._fadeTimer);
  el._fadeTimer = setTimeout(() => {
    el.textContent = newText;
    el.classList.remove('is-swapping');
  }, 220); // matches the CSS opacity/transform transition on .calc-result-note span
}

function initLoadCalculator() {
  const categorySelect = document.getElementById('calc-category');
  const packagingSelect = document.getElementById('calc-packaging');
  const quantityInput = document.getElementById('calc-quantity');
  const unitSelect = document.getElementById('calc-unit');
  const containerSelect = document.getElementById('calc-container');
  if (!categorySelect || !quantityInput || !containerSelect) return;

  const qtyDecreaseBtn = document.getElementById('calc-qty-decrease');
  const qtyIncreaseBtn = document.getElementById('calc-qty-increase');

  const outContainers = document.getElementById('calc-out-containers');
  const outPerLoad = document.getElementById('calc-out-perload');
  const outUnits = document.getElementById('calc-out-units');
  const outUnitsLabel = document.getElementById('calc-out-units-label');
  const outFill = document.getElementById('calc-out-fill');
  const outFillBar = document.getElementById('calc-out-fill-bar');
  const outNote = document.getElementById('calc-out-note');

  const cardContainers = outContainers.closest('.calc-result-stat');
  const cardPerLoad = outPerLoad.closest('.calc-result-stat');
  const cardUnits = outUnits.closest('.calc-result-stat');
  const cardFill = outFill.closest('.calc-result-stat');

  // Raw (pre-formatting) values from the previous render, used both to
  // detect "did this actually change" and as the tween's start point.
  let prev = { containersNeeded: null, maxLoadKg: null, totalUnits: null, fillPct: null, noteText: null };

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
      outFillBar.style.width = '0%';
      outNote.textContent = '';
      prev = { containersNeeded: null, maxLoadKg: null, totalUnits: null, fillPct: null, noteText: null };
      return;
    }

    const containerLabel = window.t ? window.t(container.labelKey) : container.labelKey;
    const orderKg = rawQuantity * unitMultiplier;
    const result = computeLoad({ densityKgM3, orderKg, container, bagKg });

    outUnitsLabel.textContent = window.t ? window.t('products.calc.unitsTotal', { unit: unitLabel }) : `${unitLabel} — Total`;

    // "Containers Needed" — the sentence template ({count} × {container})
    // is re-run through window.t() on every animation frame with the
    // interpolated count, so the tween works correctly in every language
    // rather than assuming the number is the whole string.
    const fromContainers = prev.containersNeeded ?? result.containersNeeded;
    const containersChanged = prev.containersNeeded !== result.containersNeeded;
    tweenValue(fromContainers, result.containersNeeded, (v) => {
      const count = Math.round(v);
      outContainers.textContent = window.t
        ? window.t('products.calc.containersResult', { count, container: containerLabel })
        : `${count} × ${containerLabel}`;
    }, () => {
      if (containersChanged) pulseCard(cardContainers);
    });

    const fromMaxLoad = prev.maxLoadKg ?? result.maxLoadKg;
    const maxLoadChanged = prev.maxLoadKg !== result.maxLoadKg;
    tweenValue(fromMaxLoad, result.maxLoadKg, (v) => {
      outPerLoad.textContent = formatTonnes(v);
    }, () => {
      if (maxLoadChanged) pulseCard(cardPerLoad);
    });

    const fromUnits = prev.totalUnits ?? result.totalUnits;
    const unitsChanged = prev.totalUnits !== result.totalUnits;
    tweenValue(fromUnits, result.totalUnits, (v) => {
      outUnits.textContent = Math.round(v).toLocaleString('en-US');
    }, () => {
      if (unitsChanged) pulseCard(cardUnits);
    });

    const fromFill = prev.fillPct ?? result.fillPct;
    const fillChanged = prev.fillPct !== result.fillPct;
    tweenValue(fromFill, result.fillPct, (v) => {
      const pct = Math.round(v);
      outFill.textContent = `${pct}%`;
      outFillBar.style.width = `${pct}%`;
      outFillBar.classList.toggle('is-low', pct < 40);
    }, () => {
      if (fillChanged) pulseCard(cardFill);
    });

    const noteVars = {
      density: densityKgM3,
      container: containerLabel.toLowerCase(),
      volume: container.usableVolumeM3,
      approxWeight: formatTonnes(result.volumeLimitKg),
      maxWeight: formatTonnes(container.payloadKg),
    };
    const noteText = window.t
      ? window.t(result.bindingConstraint === 'volume' ? 'products.calc.note.volumeLimited' : 'products.calc.note.weightLimited', noteVars)
      : '';
    crossfadeText(outNote, noteText);

    prev = {
      containersNeeded: result.containersNeeded,
      maxLoadKg: result.maxLoadKg,
      totalUnits: result.totalUnits,
      fillPct: result.fillPct,
      noteText,
    };
  }

  [categorySelect, packagingSelect, quantityInput, unitSelect, containerSelect].forEach((el) =>
    el.addEventListener('input', render)
  );

  // Custom +/- stepper: adjusts the real <input type=number> and dispatches
  // a native 'input' event, so it goes through the exact same recalculation
  // path as typing — no separate code path to keep in sync.
  function step(direction) {
    const stepSize = Number(quantityInput.step) || 1;
    const min = Number(quantityInput.min) || 0;
    const current = Number(quantityInput.value) || 0;
    const next = Math.max(min, Math.round((current + direction * stepSize) * 100) / 100);
    quantityInput.value = next;
    quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (qtyDecreaseBtn) qtyDecreaseBtn.addEventListener('click', () => step(-1));
  if (qtyIncreaseBtn) qtyIncreaseBtn.addEventListener('click', () => step(1));

  window.reRenderCalculator = render;
  render();
}

document.addEventListener('DOMContentLoaded', initLoadCalculator);
