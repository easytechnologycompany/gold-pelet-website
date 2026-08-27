// Gold Pelet Admin — API client. Every admin page loads this first.
// The dashboard is served as static files from its own frontend service,
// separate from the Go API backend (they used to be the same origin when
// the backend served /admin directly — no longer true), so the backend's
// URL has to be explicit rather than derived from window.location. Mirrors
// the exact isLocalDev split chips-company-website/js/cms.js already uses.
const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const BACKEND_ORIGIN = isLocalDev
  ? 'http://localhost:8090'
  : 'https://backend-production-cfda.up.railway.app';
const API_BASE = `${BACKEND_ORIGIN}/api/v1`;
const TOKEN_KEY = 'gp_admin_token';

/** Resolves an /uploads/... path (as stored in the DB) against the
 * backend's origin — needed now that the dashboard and the API are no
 * longer same-origin. Absolute URLs pass through unchanged. */
function mediaURL(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${BACKEND_ORIGIN}${path}`;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Wraps fetch(): attaches the bearer token, JSON-encodes plain object
 * bodies, and redirects to login.html on a 401 rather than letting every
 * page handle that individually.
 */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  let body = options.body;

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, body });

  if (res.status === 401) {
    clearToken();
    window.location.href = 'login.html';
    throw new Error('Unauthorized');
  }
  return res;
}

/** Call at the top of every protected page. */
function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
  }
}

function logout() {
  clearToken();
  window.location.href = 'login.html';
}

/** Small bottom-right toast, used for save/delete confirmations and errors. */
function showToast(message, type = 'success') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast show toast--${type}`;
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/** Extracts a readable message from a failed API response. */
async function apiErrorMessage(res) {
  try {
    const data = await res.json();
    return data.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

function wireLogoutButton() {
  const btn = document.querySelector('[data-logout]');
  if (btn) btn.addEventListener('click', logout);
}

/** Single source of truth for the sidebar logo, which always sits on the
 * dark sidebar background (--green-900) — mirrors chips-company-website's
 * data-logo-theme pattern. Changing the asset path means editing this one
 * constant, not every admin page's markup. */
const SIDEBAR_LOGO_SRC = '../assets/img/logo-white.png';

function applySidebarLogo() {
  const img = document.querySelector('.sidebar-brand img');
  if (img) img.src = SIDEBAR_LOGO_SRC;
}

/**
 * Mobile shell. Below 900px the sidebar becomes an off-canvas drawer (see
 * admin.css), which needs a toggle to open it and a backdrop to close it.
 * Both are built here rather than pasted into all 12 admin pages' markup —
 * same reasoning as applySidebarLogo above: one definition, and a page
 * without a sidebar (login.html) simply never gets them.
 *
 * The topbar also carries the brand, which is otherwise only in the
 * sidebar and so would be invisible on a phone until you opened the drawer.
 */
function initMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main');
  if (!sidebar || !main) return;

  if (!sidebar.id) sidebar.id = 'admin-sidebar';
  const label = window.t ? window.t('sidebar.menu') : 'Menu';

  const topbar = document.createElement('div');
  topbar.className = 'admin-topbar';
  topbar.innerHTML =
    `<button type="button" class="sidebar-toggle" aria-expanded="false" aria-controls="${sidebar.id}" aria-label="${label}"><span></span></button>` +
    `<span class="admin-topbar-brand"><img src="${SIDEBAR_LOGO_SRC}" alt=""><span data-i18n="sidebar.admin">Admin</span></span>`;
  main.prepend(topbar);

  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  document.body.appendChild(backdrop);

  const toggle = topbar.querySelector('.sidebar-toggle');

  function setOpen(open) {
    sidebar.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    // Only while the drawer covers the page — the desktop sidebar is part
    // of the layout and must never lock scrolling.
    document.body.classList.toggle('sidebar-locked', open);
    if (open) sidebar.querySelector('a, button')?.focus();
    else toggle.focus();
  }

  toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('is-open')));
  backdrop.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) setOpen(false);
  });

  // Rotating a phone to landscape can cross the breakpoint while the drawer
  // is open; without this the desktop sidebar comes back with the backdrop
  // and the scroll lock still applied over it.
  const mq = window.matchMedia('(min-width: 901px)');
  const onChange = () => { if (mq.matches) setOpen(false); };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
}

/**
 * Admin tables have more columns than a phone has width. Wrapping each one
 * in its own scroll container keeps the overflow inside the card instead of
 * widening the whole document — the card, its heading and the page around
 * it stay put while only the table pans.
 *
 * Wrapping the <table> element itself (not its contents) is what makes this
 * survive crud.js, which re-renders thead/tbody innerHTML on every load and
 * never replaces the table node.
 */
function wrapDataTables() {
  document.querySelectorAll('table.data-table').forEach((table) => {
    if (table.parentElement.classList.contains('table-scroll')) return;
    const scroller = document.createElement('div');
    scroller.className = 'table-scroll';
    table.parentNode.insertBefore(scroller, table);
    scroller.appendChild(table);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wireLogoutButton();
  applySidebarLogo();
  initMobileSidebar();
  wrapDataTables();
});
