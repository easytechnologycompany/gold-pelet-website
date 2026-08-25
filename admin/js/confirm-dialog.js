// Gold Pelet Admin — reusable confirm dialog, replacing window.confirm()
// for destructive actions (delete, etc.) with a modal that matches the
// dashboard's design system. One overlay/modal pair is built lazily on
// first use and reused for every call; window.confirmDialog() returns a
// Promise<boolean> so call sites just `if (!(await confirmDialog(...)))
// return;` in place of the old `if (!confirm(...)) return;`.

const CONFIRM_ICON_WARNING =
  '<svg viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L14.7 3.86a2 2 0 00-3.4 0z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

let overlayEl = null;
let modalEl = null;
let titleEl = null;
let messageEl = null;
let cancelBtn = null;
let confirmBtn = null;
let previouslyFocused = null;
let pendingResolve = null;

function buildConfirmDialog() {
  if (overlayEl) return;

  overlayEl = document.createElement('div');
  overlayEl.className = 'confirm-overlay';
  overlayEl.innerHTML = `
    <div class="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" tabindex="-1">
      <div class="confirm-modal-icon" data-confirm-icon>${CONFIRM_ICON_WARNING}</div>
      <h3 class="confirm-modal-title" id="confirm-dialog-title" data-confirm-title></h3>
      <p class="confirm-modal-message" id="confirm-dialog-message" data-confirm-message></p>
      <div class="confirm-modal-actions">
        <button type="button" class="confirm-btn-cancel" data-confirm-cancel></button>
        <button type="button" class="confirm-btn-confirm" data-confirm-confirm></button>
      </div>
    </div>
  `;
  document.body.appendChild(overlayEl);

  modalEl = overlayEl.querySelector('.confirm-modal');
  titleEl = overlayEl.querySelector('[data-confirm-title]');
  messageEl = overlayEl.querySelector('[data-confirm-message]');
  cancelBtn = overlayEl.querySelector('[data-confirm-cancel]');
  confirmBtn = overlayEl.querySelector('[data-confirm-confirm]');

  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) closeConfirmDialog(false);
  });
  cancelBtn.addEventListener('click', () => closeConfirmDialog(false));
  confirmBtn.addEventListener('click', () => closeConfirmDialog(true));
  overlayEl.addEventListener('keydown', onConfirmDialogKeydown);
}

function onConfirmDialogKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeConfirmDialog(false);
    return;
  }
  if (e.key !== 'Tab') return;
  // Only two focusable elements in this dialog — a minimal manual focus
  // trap that wraps Tab/Shift+Tab between them instead of letting focus
  // escape to the page underneath.
  const focusable = [cancelBtn, confirmBtn];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function closeConfirmDialog(result) {
  if (!overlayEl || !overlayEl.classList.contains('is-open')) return;
  overlayEl.classList.remove('is-open');
  if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
    previouslyFocused.focus();
  }
  previouslyFocused = null;
  if (pendingResolve) {
    const resolve = pendingResolve;
    pendingResolve = null;
    resolve(result);
  }
}

/**
 * Opens the confirm dialog and resolves true/false once the user acts.
 * { title, message, confirmLabel, cancelLabel, danger } — danger (default
 * true) colors the confirm button as a destructive action.
 */
function confirmDialog({ title, message, confirmLabel, cancelLabel, danger = true } = {}) {
  buildConfirmDialog();
  // A second call while one is already open would leak the first
  // Promise forever; resolve it false (cancelled) before opening the new one.
  if (overlayEl.classList.contains('is-open')) closeConfirmDialog(false);

  previouslyFocused = document.activeElement;
  titleEl.textContent = title || '';
  messageEl.textContent = message || '';
  cancelBtn.textContent = cancelLabel || (window.t ? window.t('crud.cancel') : 'Cancel');
  confirmBtn.textContent = confirmLabel || (window.t ? window.t('crud.delete') : 'Delete');
  confirmBtn.classList.toggle('is-danger', danger);

  overlayEl.classList.add('is-open');
  cancelBtn.focus();

  return new Promise((resolve) => {
    pendingResolve = resolve;
  });
}

/** Convenience wrapper for the common "delete this {item}?" case. */
function confirmDeleteDialog(itemLabel) {
  const t = window.t || ((k) => k);
  return confirmDialog({
    title: t('confirm.deleteTitle', { item: itemLabel }),
    message: t('confirm.deleteMessage'),
    confirmLabel: t('crud.delete'),
    cancelLabel: t('crud.cancel'),
    danger: true,
  });
}

window.confirmDialog = confirmDialog;
window.confirmDeleteDialog = confirmDeleteDialog;
