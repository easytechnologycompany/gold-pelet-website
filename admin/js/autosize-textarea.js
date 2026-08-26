// Gold Pelet Admin — shared "grow, then scroll" textarea behavior. A
// textarea starts compact, grows with its content up to a max height (see
// --autosize-max-height / .autosize-textarea in admin.css), then stops
// growing and becomes internally scrollable — the page never gets
// excessively tall just because one field has a lot of text. Once
// overflow-y is 'auto' the browser's own scrolling (wheel, trackpad,
// keyboard, touch) works for free; this module only ever touches height
// and the is-tall class, never scroll position or selection.
const AUTOSIZE_MAX_HEIGHT = 320; // px — keep in sync with admin.css

function autosizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
  el.classList.toggle('is-tall', el.scrollHeight >= AUTOSIZE_MAX_HEIGHT);
}

/** Enhances every not-yet-enhanced textarea under `root` (default: whole
 * document): applies the shared class, sizes it to its current content
 * (so a field pre-filled with saved data starts at the right height, not
 * collapsed), and keeps it sized as the admin types. Pages that populate
 * a textarea's value programmatically after this runs (e.g. an edit-modal
 * opened later with fetched data) must call autosizeTextarea(el) again
 * once the value is set — a scripted .value assignment doesn't fire
 * 'input'. */
function enhanceAutosizeTextareas(root) {
  (root || document).querySelectorAll('textarea:not([data-autosize-enhanced])').forEach((el) => {
    el.dataset.autosizeEnhanced = 'true';
    el.classList.add('autosize-textarea');
    autosizeTextarea(el);
    el.addEventListener('input', () => autosizeTextarea(el));
  });
}
window.autosizeTextarea = autosizeTextarea;
window.enhanceAutosizeTextareas = enhanceAutosizeTextareas;

document.addEventListener('DOMContentLoaded', () => enhanceAutosizeTextareas());
