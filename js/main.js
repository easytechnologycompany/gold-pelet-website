// Chips Co. Industries — shared site behavior:
// mobile nav toggle, scroll-triggered stat counters, RFQ/contact form
// validation. No frameworks — kept dependency-free for a static site.

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
