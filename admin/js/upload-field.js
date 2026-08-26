// Gold Pelet Admin — reusable drag-and-drop upload component. Wraps every
// native <input type="file"> on the page with a polished dropzone UI
// without touching how the file actually gets uploaded: the real input
// stays in the DOM, keeps its id/name/accept, and every existing
// 'change' listener (already attached by each page's own script, e.g.
// "upload the file to /admin/media/upload") keeps firing completely
// unmodified. This module only owns the *selection* experience — drag
// & drop, the visual empty/selected/error states, Change/Remove — and
// forwards a real native 'change' event for drag-and-drop drops so the
// existing upload logic can't tell the difference from a native pick.

function uploadHumanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let u = -1;
  do {
    bytes /= 1024;
    u++;
  } while (bytes >= 1024 && u < units.length - 1);
  return `${bytes.toFixed(bytes < 10 && u > 0 ? 1 : 0)} ${units[u]}`;
}

function uploadAcceptToFormats(accept) {
  if (!accept) return '';
  return accept
    .split(',')
    .map((s) => s.trim().replace(/^\./, '').toUpperCase())
    .filter(Boolean)
    .join(', ');
}

function uploadFileAccepted(file, accept) {
  if (!accept) return true;
  const patterns = accept.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return patterns.some((p) => {
    if (p.startsWith('.')) return name.endsWith(p);
    if (p.endsWith('/*')) return type.startsWith(p.slice(0, -1));
    return type === p;
  });
}

const UPLOAD_ICONS = {
  upload: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  change: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 4v5h5M20 20v-5h-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 15a7 7 0 0012.6 2.5M18.5 9A7 7 0 005.9 6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  remove: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

function uploadT(key, vars) {
  return window.t ? window.t(key, vars) : key;
}

function enhanceUploadField(input) {
  if (!input || input.dataset.uploadEnhanced) return;
  input.dataset.uploadEnhanced = 'true';

  const maxSizeMB = Number(input.dataset.maxSizeMb || 8);
  const maxSizeLabel = `${maxSizeMB}MB`;
  const labelText = input.dataset.uploadLabel || uploadT(input.dataset.uploadLabelKey || 'upload.label.default');
  const formats = uploadAcceptToFormats(input.accept);
  const hintParts = [uploadT('upload.dragDrop')];
  if (formats) hintParts.push(`${uploadT('upload.accepted')}: ${formats}`);
  hintParts.push(uploadT('upload.maxSize', { size: maxSizeLabel }));

  const zone = document.createElement('div');
  zone.className = 'upload-zone';
  if (input.disabled) zone.classList.add('is-disabled');
  // The drag/accept/max-size hint is dropped from the visible box to keep
  // it compact, but kept as a native tooltip + accessible name so sighted
  // mouse users and screen readers both still get it.
  zone.title = hintParts.join(' · ');

  zone.innerHTML = `
    <div class="upload-zone-empty">
      <div class="upload-zone-icon">${UPLOAD_ICONS.upload}</div>
      <div class="upload-zone-title">${labelText}</div>
      <div class="upload-zone-error-msg" data-zone-error hidden></div>
    </div>
    <div class="upload-zone-selected">
      <div class="upload-zone-thumb" data-zone-thumb>${UPLOAD_ICONS.image}</div>
      <div class="upload-zone-info">
        <div class="upload-zone-filename" data-zone-filename></div>
        <div class="upload-zone-filesize" data-zone-filesize></div>
        <div class="upload-zone-progress"><div class="upload-zone-progress-bar"></div></div>
      </div>
      <div class="upload-zone-actions">
        <button type="button" class="upload-zone-action-btn" data-zone-change aria-label="${uploadT('upload.change')}">${UPLOAD_ICONS.change}</button>
        <button type="button" class="upload-zone-action-btn is-danger" data-zone-remove aria-label="${uploadT('upload.remove')}">${UPLOAD_ICONS.remove}</button>
      </div>
    </div>
  `;

  // Move the real input inside the new zone (same element, same
  // id/name/accept/listeners — just visually re-parented) so it still
  // physically overlays the empty-state content: that's what gives us
  // native click-to-browse and full keyboard/screen-reader support for
  // free, with zero custom focus-management code.
  input.parentNode.insertBefore(zone, input);
  zone.appendChild(input);
  input.classList.add('upload-zone-input');
  // Screen readers announce the focused control's own accessible name, not
  // a tooltip on its container, so the dropped hint text goes here too.
  input.setAttribute('aria-label', `${labelText} — ${zone.title}`);

  const errorEl = zone.querySelector('[data-zone-error]');
  const thumbEl = zone.querySelector('[data-zone-thumb]');
  const filenameEl = zone.querySelector('[data-zone-filename]');
  const filesizeEl = zone.querySelector('[data-zone-filesize]');
  const changeBtn = zone.querySelector('[data-zone-change]');
  const removeBtn = zone.querySelector('[data-zone-remove]');

  let errorTimer = null;
  function showError(msg) {
    zone.classList.remove('has-file');
    zone.classList.add('has-error');
    errorEl.textContent = msg;
    errorEl.hidden = false;
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      zone.classList.remove('has-error');
      errorEl.hidden = true;
    }, 3500);
  }

  function renderSelected(file) {
    filenameEl.textContent = file.name;
    filesizeEl.textContent = uploadHumanSize(file.size);
    zone.classList.add('has-file');
    zone.classList.remove('has-error');
    if (file.type && file.type.startsWith('image/')) {
      thumbEl.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="">`;
    } else {
      thumbEl.innerHTML = UPLOAD_ICONS.image;
    }
    const check = document.createElement('div');
    check.className = 'upload-zone-check';
    check.innerHTML = UPLOAD_ICONS.check;
    thumbEl.appendChild(check);
  }

  function reset() {
    zone.classList.remove('has-file', 'is-uploading');
    input.value = '';
  }

  // Drag & drop — validated locally, then handed to the real input via
  // DataTransfer + a dispatched native 'change' event, so the page's own
  // existing 'change' listener (the real upload logic) fires exactly as
  // if the file had been picked through the native file dialog.
  ['dragenter', 'dragover'].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      if (input.disabled) return;
      e.preventDefault();
      zone.classList.add('is-dragover');
    })
  );
  ['dragleave', 'dragend'].forEach((evt) =>
    zone.addEventListener(evt, () => zone.classList.remove('is-dragover'))
  );
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('is-dragover');
    if (input.disabled) return;
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    if (!uploadFileAccepted(file, input.accept)) {
      showError(uploadT('upload.errorType'));
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      showError(uploadT('upload.errorSize', { size: maxSizeLabel }));
      return;
    }
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Runs on every change regardless of source (native picker or the
  // drag-and-drop path above) — purely visual, never blocks or rewrites
  // what the page's own upload listener sees on the same event.
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) {
      zone.classList.remove('has-file');
      return;
    }
    if (!uploadFileAccepted(file, input.accept)) {
      showError(uploadT('upload.errorType'));
      reset();
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      showError(uploadT('upload.errorSize', { size: maxSizeLabel }));
      reset();
      return;
    }
    renderSelected(file);
  });

  changeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    input.click();
  });
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    reset();
  });
}

/** Enhances every not-yet-enhanced file input under `root` (default:
 * whole document). Pages that inject file inputs dynamically after load
 * (e.g. a rebuilt form, a freshly rendered card grid) call this again
 * with the new container once their markup exists. */
function enhanceFileInputs(root) {
  (root || document).querySelectorAll('input[type="file"]:not([data-upload-enhanced])').forEach(enhanceUploadField);
}
window.enhanceFileInputs = enhanceFileInputs;

document.addEventListener('DOMContentLoaded', () => enhanceFileInputs());
