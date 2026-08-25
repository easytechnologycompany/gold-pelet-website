// Gold Pelet — CMS data layer. Fetches from the admin-managed public API
// and overwrites the static HTML's placeholder content on load, so every
// edit made in the dashboard shows up on the live site without a
// deployment. If the API is unreachable, the page silently keeps today's
// static content rather than breaking — this is progressive enhancement,
// not a hard dependency.
//
// Local dev (this file served from localhost) always talks to the local
// backend; anywhere else (GitHub Pages, a future custom domain) talks to
// the deployed Railway backend. Without this split, local dev silently
// depended on the deployed backend's uploads existing — which they may
// not (e.g. right after a deploy that hasn't been given real assets yet).
const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE = isLocalDev
  ? 'http://localhost:8090/api/v1'
  : 'https://backend-production-cfda.up.railway.app/api/v1';
const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, '');

function mediaURL(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

async function cmsFetch(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[cms] fetch failed, keeping static content for', path, err);
    return null;
  }
}

/* ---------------- Branding: colors + logo ---------------- */
async function applyBranding() {
  const branding = await cmsFetch('/public/branding');
  if (!branding) return;

  const root = document.documentElement.style;
  if (branding.primary_hex) root.setProperty('--green-700', branding.primary_hex);
  if (branding.primary_dark_hex) root.setProperty('--green-900', branding.primary_dark_hex);
  if (branding.primary_light_hex) root.setProperty('--green-600', branding.primary_light_hex);
  if (branding.accent_navy_hex) root.setProperty('--navy-600', branding.accent_navy_hex);

  if (branding.logo_url) {
    // Excludes .brand-logo--static (the footer's logo): that instance sits
    // on the dark footer and uses a purpose-built light-on-dark variant
    // (assets/img/logo-light.png) that isn't a CMS asset, so it must never
    // be overwritten by whatever logo_url the admin uploads for the header.
    document.querySelectorAll('.brand-logo:not(.brand-logo--static)').forEach((img) => {
      img.src = mediaURL(branding.logo_url);
    });
  }
}

/* ---------------- Page hero ---------------- */
async function applyPageHero() {
  const page = document.body.dataset.page;
  if (!page) return;
  const hero = await cmsFetch(`/public/page-heroes/${page}`);
  if (!hero) return;

  const section = document.querySelector('.hero, .page-hero');
  if (!section) return;

  // The hero photo is language-independent, so it always applies — only
  // the text below is gated on English, since the CMS copy has no
  // translations and would otherwise stomp an active i18n.js language.
  const bgEl = section.querySelector('.hero-bg');
  if (bgEl && hero.image_url) bgEl.style.backgroundImage = `url('${mediaURL(hero.image_url)}')`;

  if (document.documentElement.lang && document.documentElement.lang !== 'en') return;

  const eyebrowEl = section.querySelector('.eyebrow');
  const headingEl = section.querySelector('h1');
  const subEl = section.querySelector('.hero-lede, .page-hero > .container > p:not(.eyebrow):not(.breadcrumb)');

  if (eyebrowEl && hero.eyebrow) eyebrowEl.textContent = hero.eyebrow;
  if (headingEl && hero.heading) headingEl.textContent = hero.heading;
  if (subEl && hero.subheading) subEl.textContent = hero.subheading;
}

/* ---------------- Stats (hero-stats + stats-strip instances) ---------------- */
async function applyStats() {
  const result = await cmsFetch('/public/stats');
  if (!result) return;
  const byKey = {};
  result.data.forEach((s) => (byKey[s.stat_key] = s));

  document.querySelectorAll('[data-stat-key]').forEach((el) => {
    const stat = byKey[el.dataset.statKey];
    if (!stat) return;
    const numEl = el.querySelector('[data-count-to]');
    const unitEl = el.querySelector('.unit');
    const labelEl = el.querySelector('.stat-label');
    if (numEl) {
      numEl.setAttribute('data-count-to', stat.value_number);
      // Set the visible text immediately too — main.js's scroll-triggered
      // counter animation may already have fired with the static value
      // before this fetch resolved, so this guarantees correctness even
      // if the two race (the animation is a nice-to-have, not load-bearing).
      numEl.textContent = stat.value_number;
    }
    if (unitEl) unitEl.textContent = stat.unit_suffix || '';
    if (labelEl) {
      // Same slug-keyed override pattern, keyed by stat_key this time —
      // stats.<stat_key>.label in TRANSLATIONS, English CMS value as the
      // fallback when a language has no override for that key.
      labelEl.textContent = stat.label;
      labelEl.setAttribute('data-i18n', `stats.${stat.stat_key}.label`);
    }
  });
  retranslate();
}

// Content keys that are prose (change with the visitor's language) vs.
// facts (an email/phone/URL/address is the same string in every
// language — translating it would corrupt real contact data). Only the
// prose keys get the slug-keyed data-i18n override below; the rest are
// intentionally left as plain CMS text in every language.
const TRANSLATABLE_CONTENT_KEYS = new Set([
  'about.story.heading',
  'about.story.para1',
  'about.story.para2',
  'footer.blurb',
]);

/* ---------------- Site content (key -> text blocks) ---------------- */
async function applyContent() {
  const result = await cmsFetch('/public/content');
  if (!result) return;
  const byKey = {};
  result.data.forEach((c) => (byKey[c.content_key] = c.content_value));

  document.querySelectorAll('[data-content-key]').forEach((el) => {
    const key = el.dataset.contentKey;
    const value = byKey[key];
    if (value === undefined) return;
    el.textContent = value;
    if (el.tagName === 'A') {
      if (el.getAttribute('href')?.startsWith('mailto:')) el.href = `mailto:${value}`;
      else if (el.getAttribute('href')?.startsWith('tel:')) el.href = `tel:${value.replace(/[^+\d]/g, '')}`;
    }
    if (TRANSLATABLE_CONTENT_KEYS.has(key)) {
      // Same slug-keyed override pattern as applyStats(): the CMS value
      // (English) is the fallback already applied above; retranslate()
      // below overwrites it with the active language's version if one
      // exists in TRANSLATIONS, and leaves the English CMS text in place
      // (with a console warning) if it doesn't — never a blank string.
      el.setAttribute('data-i18n', `content.${key}`);
    }
  });
  retranslate();
}

/* ---------------- Certifications ---------------- */
async function applyCertifications() {
  const mount = document.querySelector('[data-mount="certifications"]');
  if (!mount) return;
  const result = await cmsFetch('/public/certifications');
  if (!result || !result.data.length) return;

  const icons = {
    'shield-check': '<path d="M12 2l7 4v6c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V6l7-4z" stroke="currentColor" stroke-width="1.8"/>',
    'shield-tick': '<path d="M9 12l2 2 4-4M12 2l7 4v6c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V6l7-4z" stroke="currentColor" stroke-width="1.8"/>',
    'circle-check': '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8 12l3 3 5-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    'document-check': '<path d="M4 12h16M4 6h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  };

  mount.innerHTML = result.data
    .map(
      (cert) => `<div class="cert-badge">
        <div class="mark"><svg width="20" height="20" viewBox="0 0 24 24" fill="none">${icons[cert.icon_key] || icons['shield-check']}</svg></div>
        <div><strong>${cert.name}</strong><span>${cert.description}</span></div>
      </div>`
    )
    .join('');
  window.applyScrollReveal && window.applyScrollReveal(mount);
}

/* ---------------- About timeline ---------------- */
async function applyTimeline() {
  const mount = document.querySelector('[data-mount="timeline"]');
  if (!mount) return;
  const result = await cmsFetch('/public/timeline');
  if (!result || !result.data.length) return;

  mount.innerHTML = result.data
    .map(
      (m) => `<div class="timeline-item">
        <div class="year">${m.year_label}</div>
        <h3>${m.title}</h3>
        <p>${m.description || ''}</p>
      </div>`
    )
    .join('');
  window.applyScrollReveal && window.applyScrollReveal(mount);
}

/* ---------------- News ---------------- */
async function applyNews() {
  const featuredMount = document.querySelector('[data-mount="news-featured"]');
  const gridMount = document.querySelector('[data-mount="news-grid"]');
  if (!featuredMount && !gridMount) return;
  const result = await cmsFetch('/public/news');
  if (!result || !result.data.length) return;

  const featured = result.data.find((n) => n.is_featured);
  const rest = result.data.filter((n) => !n.is_featured);

  const featuredMedia = featured && featured.image_url
    ? `<div class="media"><img src="${mediaURL(featured.image_url)}" alt="${featured.title}" loading="lazy"></div>`
    : `<div class="media pattern"><svg viewBox="0 0 24 24" fill="none"><path d="M3 21l3-8 5 3 4-9 6 14H3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></div>`;

  if (featuredMount && featured) {
    featuredMount.innerHTML = `<article class="news-card news-card--feature">
      ${featuredMedia}
      <div class="body">
        <span class="date">${featured.date_label}</span>
        <h3 style="font-size:1.6rem;">${featured.title}</h3>
        <p>${featured.description || ''}</p>
      </div>
    </article>`;
    window.applyScrollReveal && window.applyScrollReveal(featuredMount);
  }

  if (gridMount) {
    gridMount.innerHTML = rest
      .map((n) => {
        const media = n.image_url
          ? `<div class="media"><img src="${mediaURL(n.image_url)}" alt="${n.title}" loading="lazy"></div>`
          : `<div class="media pattern"><svg viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M12 2l7 4v6c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V6l7-4z" stroke="currentColor" stroke-width="1.6"/></svg></div>`;
        return `<article class="news-card">
          ${media}
          <div class="body">
            <span class="date">${n.date_label}</span>
            <h3>${n.title}</h3>
            <p>${n.description || ''}</p>
          </div>
        </article>`;
      })
      .join('');
    window.applyScrollReveal && window.applyScrollReveal(gridMount);
  }
}

/* ---------------- Products / catalog ---------------- */
function productCardHTML(p) {
  const tag = p.is_featured ? '<span class="tag" data-i18n="product.bestSeller">Best Seller</span>' : '';

  const rawState = p.raw_image_url
    ? `<img src="${mediaURL(p.raw_image_url)}" alt="${p.name} — raw pellet" loading="lazy">`
    : `<div class="media-placeholder"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span data-i18n="product.rawPhotoSoon">Raw photo coming soon</span></div>`;
  const friedState = p.fried_image_url
    ? `<img src="${mediaURL(p.fried_image_url)}" alt="${p.name} — fried" loading="lazy">`
    : `<div class="media-placeholder"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M4 12h16M4 6h16M4 18h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span data-i18n="product.friedPhotoSoon">Fried photo coming soon</span></div>`;

  const specs = (p.specs || []).map((s) => `<span class="chip">${s.label}</span>`).join('');
  const sampleHref = `contact.html?product=${encodeURIComponent(p.name)}#quote-form`;
  // Product names/descriptions live in the CMS (English-only — there's no
  // translation column on the products table), so a client-side override
  // keyed by slug fills in for the 4 supported languages via the exact
  // same data-i18n/TRANSLATIONS mechanism as everything else. Falls back
  // to the real CMS value (English) for any product without an override.
  const nameKey = `products.${p.slug}.name`;
  const descKey = `products.${p.slug}.description`;

  return `<article class="product-card">
    <div class="media">
      ${tag}
      <div class="media-state is-active" data-state="raw">${rawState}</div>
      <div class="media-state" data-state="fried">${friedState}</div>
      <div class="media-toggle" data-active="raw" role="group" aria-label="Raw or fried view">
        <span class="media-toggle-pill" aria-hidden="true"></span>
        <button type="button" class="media-toggle-btn is-active" data-state="raw" aria-pressed="true" data-i18n="product.raw">Raw</button>
        <button type="button" class="media-toggle-btn" data-state="fried" aria-pressed="false" data-i18n="product.fried">Fried</button>
      </div>
    </div>
    <div class="body">
      <h3 data-i18n="${nameKey}">${p.name}</h3>
      <p data-i18n="${descKey}">${p.description || ''}</p>
      <div class="specs">${specs}</div>
      <a class="btn btn--outline btn--sm request-sample-btn" href="${sampleHref}" data-i18n="product.requestSample">Request Sample Kit</a>
    </div>
  </article>`;
}

// cms.js's own DOMContentLoaded handler runs its applies concurrently
// (not awaited) — by the time any of them mutate the DOM, i18n.js has
// already done its one-time translation pass on page load. Every function
// below that injects data-i18n-bearing markup re-runs that pass afterward
// against the *current* language, or newly-injected content would stay
// English until the visitor manually touched the language switcher again.
function retranslate() {
  window.applyTranslations && window.applyTranslations(document.documentElement.lang || 'en');
}

/** Home page: a flat preview grid of the first few active products. */
async function applyHomeProducts(limit = 3) {
  const mount = document.querySelector('[data-mount="home-products"]');
  if (!mount) return;
  const result = await cmsFetch('/public/products');
  if (!result || !result.data.length) return;
  mount.innerHTML = result.data.slice(0, limit).map(productCardHTML).join('');
  window.applyScrollReveal && window.applyScrollReveal(mount);
  retranslate();
}

/** Products page: every category as its own section, in category order. */
async function applyCatalog() {
  const mount = document.querySelector('[data-mount="catalog"]');
  if (!mount) return;

  const [catResult, prodResult] = await Promise.all([
    cmsFetch('/public/categories'),
    cmsFetch('/public/products'),
  ]);
  if (!catResult || !prodResult) return;

  const productsByCategory = {};
  prodResult.data.forEach((p) => {
    (productsByCategory[p.category_id] ||= []).push(p);
  });

  mount.innerHTML = catResult.data
    .map((cat, i) => {
      const products = productsByCategory[cat.id] || [];
      const altClass = i % 2 === 1 ? ' section--alt' : '';
      // Same slug-keyed override approach as product names/descriptions —
      // categories.<slug>.name/.description in TRANSLATIONS, falling back
      // to the CMS's English value when no override exists.
      return `<section class="section${altClass}" id="${cat.slug}">
        <div class="container">
          <div class="section-head">
            <p class="eyebrow">${String(i + 1).padStart(2, '0')} · <span data-i18n="categories.${cat.slug}.name">${cat.name}</span></p>
            <h2 data-i18n="categories.${cat.slug}.name">${cat.name}</h2>
            <p data-i18n="categories.${cat.slug}.description">${cat.description || ''}</p>
          </div>
          <div class="card-grid">${products.map(productCardHTML).join('')}</div>
        </div>
      </section>`;
    })
    .join('');
  window.applyScrollReveal && window.applyScrollReveal(mount);
  retranslate();
}

/* ---------------- RFQ / contact form ---------------- */
// Overrides the "no endpoint connected yet" stub in main.js — since the
// backend now exists, a validated submission does a real POST and shows
// a genuine success/failure state instead of the honest placeholder.
function wireRealRFQSubmission() {
  const form = document.querySelector('[data-rfq-form]');
  if (!form) return;
  const statusBox = form.querySelector('.form-status');

  // Both this and main.js's stub handler are 'submit' listeners on the same
  // form element — for listeners on the same target, the bubble phase fires
  // them in attachment order regardless of a capture flag (capture only
  // affects propagation between different elements in the ancestor chain).
  // main.js's script tag comes first, so its listener is always attached
  // and runs first; this one runs second, sees the has-error state it just
  // set, and overwrites its "no endpoint" stub message with a real result.
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.querySelector('.field.has-error')) return;
    const anyEmpty = [...form.querySelectorAll('[data-validate]')].some((f) => !f.value.trim());
    if (anyEmpty) return;

    const payload = {
      company_name: form.querySelector('#company').value.trim(),
      contact_name: form.querySelector('#contact-name').value.trim(),
      email: form.querySelector('#email').value.trim(),
      phone: form.querySelector('#phone').value.trim(),
      country: form.querySelector('#country').value.trim(),
      product_interest: form.querySelector('#product').value,
      estimated_volume: form.querySelector('#volume').value,
      message: form.querySelector('#message').value.trim(),
    };

    try {
      const res = await fetch(`${API_BASE}/public/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        statusBox.textContent = 'Thank you — your enquiry has been received. Our team will respond within 3 business days.';
        statusBox.className = 'form-status show ok';
        form.reset();
      } else {
        statusBox.textContent = 'Something went wrong sending your enquiry. Please email us directly instead.';
        statusBox.className = 'form-status show fail';
      }
    } catch (err) {
      statusBox.textContent = 'Could not reach the server. Please email us directly instead.';
      statusBox.className = 'form-status show fail';
    }
  });
}

/* ---------------- Named image slots (Manufacturing Story stages, split
   sections, and any other one-off photo an admin should be able to swap) --
   generic find-and-set on any element carrying data-image-key, matching the
   backend's site_images.image_key. Applies to <img> (src) and any other
   element (background-image), so it covers both markup styles used across
   the story/split sections without needing per-slot code. ---------------- */
async function applySiteImages() {
  const targets = document.querySelectorAll('[data-image-key]');
  if (!targets.length) return;
  const result = await cmsFetch('/public/site-images');
  if (!result) return;
  const byKey = {};
  result.data.forEach((img) => (byKey[img.image_key] = img));

  targets.forEach((el) => {
    const slot = byKey[el.dataset.imageKey];
    if (!slot || !slot.image_url) return;
    const url = mediaURL(slot.image_url);
    if (el.tagName === 'IMG') el.src = url;
    else el.style.backgroundImage = `url('${url}')`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyBranding();
  applyPageHero();
  applyStats();
  applyContent();
  applyCertifications();
  applyTimeline();
  applyNews();
  applyHomeProducts();
  applyCatalog();
  applySiteImages();
  wireRealRFQSubmission();
});
