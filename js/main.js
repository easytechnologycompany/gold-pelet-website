// Chips Co. Industries — shared site behavior:
// mobile nav toggle, scroll-triggered stat counters, scroll-reveal
// animations, RFQ/contact form validation. No frameworks — kept
// dependency-free for a static site.

(function () {
  'use strict';

  /* ---------------- Mobile nav ---------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------- Animated stat counters ---------------- */
  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length && 'IntersectionObserver' in window) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animateCounter = (el) => {
      const target = parseFloat(el.getAttribute('data-count-to'));
      const decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
      const duration = 1400;

      if (prefersReducedMotion) {
        el.textContent = target.toFixed(decimals);
        return;
      }

      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = value.toFixed(decimals);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((el) => observer.observe(el));
  }

  /* ---------------- Scroll-reveal (fade-in-up) ---------------- */
  // Card-like and section elements fade up into view as they cross the
  // viewport. Elements are found by selector rather than a hand-authored
  // "reveal" class in the HTML, so cms.js can re-run this against freshly
  // injected product/cert/news/timeline cards after each fetch resolves —
  // see window.applyScrollReveal below.
  const REVEAL_SELECTOR = [
    '.product-card', '.feature-card', '.cert-badge', '.news-card',
    '.info-card', '.timeline-item', '.calc-card', '.cta-banner',
    '.section-head', '.split-content', '.split-media',
    '.stats-strip .stat',
  ].join(', ');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealObserver =
    !prefersReducedMotion && 'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        )
      : null;

  function applyScrollReveal(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const groupCounts = new WeakMap();
    scope.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
      if (el.dataset.revealApplied) return;
      el.dataset.revealApplied = '1';

      if (!revealObserver) {
        el.classList.add('reveal', 'is-visible');
        return;
      }

      const index = groupCounts.get(el.parentElement) || 0;
      groupCounts.set(el.parentElement, index + 1);

      el.classList.add('reveal');
      el.style.animationDelay = `${Math.min(index, 5) * 70}ms`;
      revealObserver.observe(el);
    });
  }

  applyScrollReveal(document);
  window.applyScrollReveal = applyScrollReveal;

  /* ---------------- Sample-kit request prefill (contact.html) ---------------- */
  // Product cards link to contact.html?product=<name>#quote-form. The
  // #quote-form anchor scrolls there natively; this just pre-selects the
  // closest product category and drops the product name into the message.
  const requestedProduct = new URLSearchParams(window.location.search).get('product');
  if (requestedProduct) {
    const productSelect = document.getElementById('product');
    const messageField = document.getElementById('message');
    if (productSelect) {
      const lower = requestedProduct.toLowerCase();
      const category = lower.includes('wheat') ? 'wheat' : lower.includes('potato') ? 'potato' : 'corn';
      productSelect.value = category;
    }
    if (messageField && !messageField.value) {
      messageField.value = `Requesting a sample kit for: ${requestedProduct}\n\n`;
    }
  }

  /* ---------------- Product card raw/fried image toggle ---------------- */

  // Moves the sliding pill onto whichever button is currently active, by
  // copying that button's real width and offset rather than assuming the
  // two halves are equal and that "second" means "to the right".
  //
  // offsetLeft is measured against .media-toggle (its offsetParent, since
  // that element is positioned) and is already resolved for the writing
  // direction — so in RTL, where the flex row reverses and RAW sits on the
  // physical right, this reports the physical position the button actually
  // occupies. No dir branch, and nothing here depends on the label text:
  // the state lives in data-state, which stays "raw"/"fried" in every
  // language while only the label is translated.
  // `animate` is false for anything that isn't a deliberate toggle. Re-fitting
  // after a language switch or a resize is a correction, not a state change —
  // letting the pill glide to its new size there reads as though the control
  // changed by itself. It should only travel when the reader moves it.
  function syncMediaTogglePill(toggle, animate) {
    const pill = toggle.querySelector('.media-toggle-pill');
    const active = toggle.querySelector('.media-toggle-btn.is-active');
    if (!pill || !active) return;
    if (!animate) pill.style.transition = 'none';
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
    if (!animate) {
      void pill.offsetWidth;   // flush the suppressed transition before restoring it
      pill.style.transition = '';
    }
  }

  // Backup only. The pill is kept correct by the explicit calls below and in
  // i18n.js and cms.js, because those fire at known moments and can be
  // verified; this catches the leftovers — a page zoom, a font swapping in
  // late. It is deliberately not the primary mechanism: ResizeObserver
  // delivers its callbacks as part of the rendering steps, so anything that
  // stops the page rendering also stops this, and a control that silently
  // mis-renders is worse than one that never animates.
  const toggleResizeObserver =
    'ResizeObserver' in window
      ? new ResizeObserver((entries) => {
          const seen = new Set();
          entries.forEach((entry) => {
            const toggle = entry.target.closest('.media-toggle');
            if (toggle && !seen.has(toggle)) {
              seen.add(toggle);
              syncMediaTogglePill(toggle);
            }
          });
        })
      : null;

  function initMediaToggles(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.media-toggle').forEach((toggle) => {
      syncMediaTogglePill(toggle);
      if (!toggleResizeObserver || toggle.dataset.pillObserved) return;
      toggle.dataset.pillObserved = '1';
      toggle.querySelectorAll('.media-toggle-btn').forEach((b) => toggleResizeObserver.observe(b));
    });
  }

  initMediaToggles(document);
  // Exposed for cms.js, which injects product cards after its fetches resolve,
  // and for i18n.js, whose language switch gives the buttons new labels and so
  // new widths — same arrangement as window.applyScrollReveal above.
  window.initMediaToggles = initMediaToggles;
  // A webfont swapping in changes label widths after first paint.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => initMediaToggles(document));
  // Card widths are fluid, so a viewport change moves the buttons out from
  // under the pill. Debounced — this only needs to be right once the resize
  // settles, not on every intermediate frame.
  let toggleResizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(toggleResizeTimer);
    toggleResizeTimer = setTimeout(() => initMediaToggles(document), 120);
  }, { passive: true });

  // Delegated on document, not per-card, so it works for both the static
  // fallback markup and cards cms.js injects later via mount.innerHTML.
  // Real <button> elements mean Tab + Enter/Space already work for free;
  // this just keeps the sliding pill, aria-pressed and layer state in sync.
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.media-toggle-btn');
    if (!btn) return;
    const toggle = btn.closest('.media-toggle');
    const media = btn.closest('.media');
    if (!toggle || !media) return;
    const state = btn.dataset.state;
    toggle.dataset.active = state;
    toggle.querySelectorAll('.media-toggle-btn').forEach((b) => {
      const isActive = b === btn;
      b.classList.toggle('is-active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });
    media.querySelectorAll('.media-state').forEach((s) => s.classList.toggle('is-active', s.dataset.state === state));
    syncMediaTogglePill(toggle, true);   // a deliberate toggle — let the pill travel
  });

  /* ---------------- RFQ / contact form ---------------- */
  // No backend is connected yet — this validates client-side and shows an
  // honest "not wired up" status rather than pretending the inquiry sent.
  // Swap the TODO block for a real fetch() call once an endpoint exists.
  const rfqForm = document.querySelector('[data-rfq-form]');
  if (rfqForm) {
    const statusBox = rfqForm.querySelector('.form-status');

    const validators = {
      required: (value) => value.trim().length > 0 || 'This field is required.',
      email: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Enter a valid email address.',
      phone: (value) =>
        value.trim() === '' || /^[+()\-.\s0-9]{7,}$/.test(value.trim()) || 'Enter a valid phone number.',
    };

    const validateField = (field) => {
      const rules = (field.getAttribute('data-validate') || '').split(' ').filter(Boolean);
      const wrapper = field.closest('.field');
      const errorEl = wrapper ? wrapper.querySelector('.error-msg') : null;

      for (const rule of rules) {
        const result = validators[rule] ? validators[rule](field.value) : true;
        if (result !== true) {
          wrapper && wrapper.classList.add('has-error');
          if (errorEl) errorEl.textContent = result;
          return false;
        }
      }
      wrapper && wrapper.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
      return true;
    };

    rfqForm.querySelectorAll('[data-validate]').forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
    });

    rfqForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const fields = rfqForm.querySelectorAll('[data-validate]');
      let allValid = true;
      fields.forEach((field) => {
        if (!validateField(field)) allValid = false;
      });

      if (!allValid) {
        if (statusBox) {
          statusBox.textContent = 'Please fix the highlighted fields and try again.';
          statusBox.className = 'form-status show fail';
        }
        return;
      }

      // TODO(integration): wire this to a real inquiry endpoint
      // (e.g. POST /api/rfq or a hosted form service). Left unconnected
      // deliberately rather than faking a success response.
      if (statusBox) {
        statusBox.textContent =
          'Form validated — this site has no inquiry endpoint connected yet. ' +
          'Please email the address above until online submission is live.';
        statusBox.className = 'form-status show fail';
      }
    });
  }
})();
