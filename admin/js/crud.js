// Generic list-CRUD engine for the admin pages whose resource is just an
// ordered list of rows (stats, timeline, certifications, categories, news)
// — mirrors the backend's generic CRUDHandler[T]: one engine, driven by a
// small config object per page, instead of five nearly-identical page
// scripts. Renders the table, an add/edit modal built from `fields`, and
// wires delete — everything else lives in <resource>.html's config call.
//
// config shape:
// {
//   endpoint: 'stats',                 // admin API path segment
//   titleSingular: 'Stat',
//   columns: [{ key, label, render? }],// table columns, render(item) optional
//   fields: [{ name, label, type, required?, placeholder?, hint? }],
//   defaults: {...},                   // pre-filled values for "Add new"
// }
function initCrudPage(config) {
  requireAuth();

  const tableHead = document.getElementById('crud-thead');
  const tableBody = document.getElementById('crud-tbody');
  const addBtn = document.getElementById('crud-add-btn');
  const backdrop = document.getElementById('crud-modal-backdrop');
  const modalTitle = document.getElementById('crud-modal-title');
  const form = document.getElementById('crud-form');
  const closeBtn = document.getElementById('crud-modal-close');
  const cancelBtn = document.getElementById('crud-modal-cancel');

  let editingId = null;

  if (addBtn) addBtn.textContent = `${t('crud.add')} ${config.titleSingular}`;

  // ---- table head, built once from columns ----
  tableHead.innerHTML =
    config.columns.map((c) => `<th>${c.label}</th>`).join('') +
    `<th class="col-actions">${t('crud.actions')}</th>`;

  // ---- form fields, built once from `fields` ----
  form.innerHTML = config.fields
    .map((f) => {
      if (f.type === 'checkbox') {
        return `<div class="field field-checkbox">
          <input type="checkbox" id="f-${f.name}" name="${f.name}">
          <label for="f-${f.name}">${f.label}</label>
        </div>`;
      }
      if (f.type === 'textarea') {
        return `<div class="field">
          <label for="f-${f.name}">${f.label}</label>
          <textarea id="f-${f.name}" name="${f.name}" class="autosize-textarea" placeholder="${f.placeholder || ''}"></textarea>
          ${f.hint ? `<span class="field-hint">${f.hint}</span>` : ''}
        </div>`;
      }
      if (f.type === 'image') {
        return `<div class="field">
          <label for="f-${f.name}-file">${f.label}${f.required ? ' *' : ''}</label>
          <img id="f-${f.name}-preview" alt="" style="display:none;max-width:160px;max-height:120px;object-fit:cover;border-radius:6px;margin-bottom:8px;">
          <input type="file" id="f-${f.name}-file" accept=".jpg,.jpeg,.png,.webp" data-upload-label-key="upload.label.photo" data-max-size-mb="8">
          <input type="hidden" id="f-${f.name}" name="${f.name}">
          ${f.hint ? `<span class="field-hint">${f.hint}</span>` : ''}
        </div>`;
      }
      return `<div class="field">
        <label for="f-${f.name}">${f.label}${f.required ? ' *' : ''}</label>
        <input type="${f.type || 'text'}" id="f-${f.name}" name="${f.name}"
          placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}
          ${f.step ? `step="${f.step}"` : ''}>
        ${f.hint ? `<span class="field-hint">${f.hint}</span>` : ''}
      </div>`;
    })
    .join('');
  window.enhanceFileInputs && window.enhanceFileInputs(form);

  // ---- image fields: wire file inputs to upload-then-fill-hidden-value ----
  config.fields
    .filter((f) => f.type === 'image')
    .forEach((f) => {
      const fileInput = document.getElementById(`f-${f.name}-file`);
      const hidden = document.getElementById(`f-${f.name}`);
      const preview = document.getElementById(`f-${f.name}-preview`);
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiFetch('/admin/media/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          showToast(await apiErrorMessage(res), 'error');
          return;
        }
        const asset = await res.json();
        hidden.value = asset.url;
        preview.src = mediaURL(asset.url);
        preview.style.display = 'block';
      });
    });

  function getFieldValue(name, type) {
    const el = form.querySelector(`[name="${name}"]`);
    if (type === 'checkbox') return el.checked;
    if (type === 'number') return el.value === '' ? 0 : Number(el.value);
    return el.value;
  }
  function setFieldValue(name, type, value) {
    const el = form.querySelector(`[name="${name}"]`);
    if (type === 'checkbox') el.checked = Boolean(value);
    else el.value = value ?? '';
    // A scripted .value assignment doesn't fire 'input', so a textarea
    // that already has the autosize behavior wired (see
    // js/autosize-textarea.js) needs an explicit re-measure to fit
    // whatever was just loaded, instead of staying at its empty height.
    if (type === 'textarea' && window.autosizeTextarea) window.autosizeTextarea(el);
    if (type === 'image') {
      const preview = document.getElementById(`${el.id}-preview`);
      if (value) {
        preview.src = mediaURL(value);
        preview.style.display = 'block';
      } else {
        preview.style.display = 'none';
      }
    }
  }

  function openModal(item) {
    // Opened before the fields are populated: a textarea's autosize
    // measurement reads scrollHeight, which reports 0 on a still-hidden
    // (display:none) modal.
    backdrop.classList.add('open');
    editingId = item ? item.id : null;
    modalTitle.textContent = item ? `${t('crud.edit')} ${config.titleSingular}` : `${t('crud.add').replace('+', '').trim()} ${config.titleSingular}`;
    const values = item || config.defaults || {};
    config.fields.forEach((f) => setFieldValue(f.name, f.type, values[f.name]));
  }
  function closeModal() {
    backdrop.classList.remove('open');
    editingId = null;
  }

  async function load() {
    tableBody.innerHTML = `<tr><td colspan="${config.columns.length + 1}">${t('crud.loading')}</td></tr>`;
    const res = await apiFetch(`/admin/${config.endpoint}`);
    if (!res.ok) {
      tableBody.innerHTML = `<tr><td colspan="${config.columns.length + 1}">${t('crud.failedToLoad')}</td></tr>`;
      return;
    }
    const { data } = await res.json();
    if (!data.length) {
      tableBody.innerHTML = `<tr><td colspan="${config.columns.length + 1}"><div class="empty-state">${t('crud.empty')}</div></td></tr>`;
      return;
    }
    tableBody.innerHTML = data
      .map(
        (item) => `<tr data-id="${item.id}">
          ${config.columns.map((c) => `<td>${c.render ? c.render(item) : (item[c.key] ?? '')}</td>`).join('')}
          <td class="col-actions">
            <div class="row-actions">
              <button class="btn btn--outline btn--sm" data-edit="${item.id}">${t('crud.edit')}</button>
              <button class="btn btn--danger btn--sm" data-delete="${item.id}">${t('crud.delete')}</button>
            </div>
          </td>
        </tr>`
      )
      .join('');

    tableBody.querySelectorAll('[data-edit]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const row = data.find((d) => d.id === btn.dataset.edit);
        openModal(row);
      })
    );
    tableBody.querySelectorAll('[data-delete]').forEach((btn) =>
      btn.addEventListener('click', () => handleDelete(btn.dataset.delete))
    );
  }

  async function handleDelete(id) {
    const ok = await confirmDeleteDialog(config.titleSingular.toLowerCase());
    if (!ok) return;
    const res = await apiFetch(`/admin/${config.endpoint}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(t('crud.deleted', { item: config.titleSingular }));
      load();
    } else {
      showToast(await apiErrorMessage(res), 'error');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {};
    config.fields.forEach((f) => (payload[f.name] = getFieldValue(f.name, f.type)));

    const isEdit = Boolean(editingId);
    const res = await apiFetch(
      isEdit ? `/admin/${config.endpoint}/${editingId}` : `/admin/${config.endpoint}`,
      { method: isEdit ? 'PUT' : 'POST', body: payload }
    );
    if (res.ok) {
      showToast(t(isEdit ? 'crud.updated' : 'crud.created', { item: config.titleSingular }));
      closeModal();
      load();
    } else {
      showToast(await apiErrorMessage(res), 'error');
    }
  });

  addBtn.addEventListener('click', () => openModal(null));
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  load();
}
