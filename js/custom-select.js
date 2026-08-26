/* ============================================================
   Gold Pelet — custom dropdown UI for the Container Load Calculator's
   <select> elements (Product Line, Packaging Format, Unit, Container
   Type). Presentation-only: the native <select> stays in the DOM as
   the real data source (visually hidden, not display:none-removed, so
   .value/.selectedIndex/.options keep behaving exactly as before) —
   every existing consumer (calculator.js's `.value` reads, its
   addEventListener('input', ...) calls) keeps working completely
   unmodified. Selecting an option here just sets the native select's
   value and dispatches real 'input'/'change' events, same as a user
   picking from the native control would.
   ============================================================ */

const CHEVRON_SVG = '<svg class="custom-select-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function enhanceSelect(select) {
  if (select.dataset.customSelectEnhanced) return;
  select.dataset.customSelectEnhanced = 'true';

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select';

  // The native <select> keeps its id (calculator.js looks it up by id),
  // so the page's existing <label for="..."> still technically points at
  // an aria-hidden, unfocusable element. Forwarding the label's click to
  // the new trigger keeps "click the label" working as users expect,
  // without renaming any id calculator.js depends on.
  const associatedLabel = document.querySelector(`label[for="${select.id}"]`);
  if (associatedLabel && !associatedLabel.id) associatedLabel.id = `${select.id}-label`;

  select.classList.add('custom-select-native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  if (associatedLabel) trigger.setAttribute('aria-labelledby', `${associatedLabel.id} ${select.id}-value`);
  trigger.innerHTML = `<span class="custom-select-value" id="${select.id}-value"></span>${CHEVRON_SVG}`;
  wrapper.appendChild(trigger);

  const listbox = document.createElement('ul');
  listbox.className = 'custom-select-listbox';
  listbox.setAttribute('role', 'listbox');
  listbox.tabIndex = -1;
  listbox.id = `${select.id}-listbox`;
  wrapper.appendChild(listbox);
  trigger.setAttribute('aria-controls', listbox.id);

  if (associatedLabel) {
    associatedLabel.addEventListener('click', (e) => {
      e.preventDefault();
      trigger.focus();
    });
  }

  const valueEl = trigger.querySelector('.custom-select-value');
  let activeIndex = select.selectedIndex;

  /** Rebuilds the listbox's option labels from the native <select>'s
   * current text — called once on enhance, and again from
   * window.refreshCustomSelects() after a language switch, since the
   * translated option text lives on the (now-hidden) native <option>
   * elements, not duplicated anywhere in this module. */
  function syncFromSelect() {
    listbox.innerHTML = '';
    Array.from(select.options).forEach((option, i) => {
      const li = document.createElement('li');
      li.className = 'custom-select-option';
      li.setAttribute('role', 'option');
      li.id = `${select.id}-opt-${i}`;
      li.setAttribute('aria-selected', option.selected ? 'true' : 'false');
      li.textContent = option.textContent;
      li.addEventListener('click', () => selectIndex(i));
      li.addEventListener('mouseenter', () => setActive(i));
      listbox.appendChild(li);
    });
    const current = select.options[select.selectedIndex];
    valueEl.textContent = current ? current.textContent : '';
    activeIndex = select.selectedIndex;
  }

  function setActive(index) {
    activeIndex = index;
    Array.from(listbox.children).forEach((li, i) => li.classList.toggle('is-active', i === index));
    trigger.setAttribute('aria-activedescendant', `${select.id}-opt-${index}`);
  }

  function scrollActiveIntoView() {
    const el = listbox.children[activeIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function selectIndex(index) {
    if (select.selectedIndex !== index) {
      select.selectedIndex = index;
      // Forwarded to the real select so calculator.js's own listeners
      // (attached directly to these elements) fire exactly as if the
      // user had picked this option from the native control.
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    Array.from(listbox.children).forEach((li, i) => li.setAttribute('aria-selected', i === index ? 'true' : 'false'));
    valueEl.textContent = select.options[index].textContent;
    close();
    trigger.focus();
  }

  function onDocClick(e) {
    if (!wrapper.contains(e.target)) close();
  }

  function onKeydown(e) {
    const count = select.options.length;
    if (e.key === 'Escape') { e.preventDefault(); close(); trigger.focus(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(count - 1, activeIndex + 1)); scrollActiveIntoView(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(0, activeIndex - 1)); scrollActiveIntoView(); return; }
    if (e.key === 'Home') { e.preventDefault(); setActive(0); scrollActiveIntoView(); return; }
    if (e.key === 'End') { e.preventDefault(); setActive(count - 1); scrollActiveIntoView(); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectIndex(activeIndex); return; }
    if (e.key === 'Tab') close();
  }

  function open() {
    if (wrapper.classList.contains('is-open')) return;
    wrapper.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    setActive(select.selectedIndex);
    scrollActiveIntoView();
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKeydown, true);
  }

  function close() {
    if (!wrapper.classList.contains('is-open')) return;
    wrapper.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    document.removeEventListener('click', onDocClick, true);
    document.removeEventListener('keydown', onKeydown, true);
  }

  trigger.addEventListener('click', () => {
    if (wrapper.classList.contains('is-open')) close();
    else open();
  });
  trigger.addEventListener('keydown', (e) => {
    if (!wrapper.classList.contains('is-open') && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      open();
    }
  });

  syncFromSelect();
  wrapper._syncFromSelect = syncFromSelect;
}

/** Enhances every not-yet-enhanced [data-custom-select] under `root`
 * (default: whole document). */
function enhanceCustomSelects(root) {
  (root || document).querySelectorAll('select[data-custom-select]:not([data-custom-select-enhanced])').forEach(enhanceSelect);
}

/** Re-reads every enhanced select's (now newly-translated) option text
 * into its listbox — called from i18n.js's setLanguage(). */
function refreshCustomSelects() {
  document.querySelectorAll('.custom-select').forEach((wrapper) => {
    if (wrapper._syncFromSelect) wrapper._syncFromSelect();
  });
}
window.refreshCustomSelects = refreshCustomSelects;

document.addEventListener('DOMContentLoaded', () => enhanceCustomSelects());
