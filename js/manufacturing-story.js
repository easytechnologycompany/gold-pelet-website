// Gold Pelet — "From Field to Fryer" scroll-driven story (index.html only).
// Desktop/tablet (>=901px): the outer .story-scroll-area is a tall wrapper;
// .story-sticky pins in place while the user scrolls normally through it.
// A single passive, rAF-throttled scroll listener maps scroll position to
// one of 6 discrete steps — it never touches wheel/touch events and never
// calls preventDefault, so scrolling stays 100% native (fast scroll,
// reverse direction, Page Up/Down, drag-the-scrollbar all keep working).
// All the actual motion (crossfade, translate, blur) is CSS transitions;
// this script only ever flips which step's classes are active.
// Mobile (<=900px) ignores all of this — the .story-mobile-list is a plain
// stacked flow revealed by the site's existing scroll-reveal engine.

(function () {
  'use strict';

  const section = document.querySelector('.story-scroll-area');
  if (!section) return;

  const STEP_COUNT = 6;
  const progressItems = [...section.querySelectorAll('.story-progress-item')];
  const stepEls = [...section.querySelectorAll('.story-step')];
  const visualLayers = [...section.querySelectorAll('.story-visual-layer')];
  const fryRaw = section.querySelector('.story-step-frying .media-state[data-state="raw"]');
  const fryFried = section.querySelector('.story-step-frying .media-state[data-state="fried"]');

  const desktopMQ = window.matchMedia('(min-width: 901px)');
  const reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  let currentStep = -1;
  let ticking = false;
  let fryTimer = null;

  function setStep(index) {
    if (index === currentStep) return;
    currentStep = index;

    stepEls.forEach((el) => el.classList.toggle('is-active', Number(el.dataset.step) === index));
    visualLayers.forEach((el) => el.classList.toggle('is-active', Number(el.dataset.step) === index));
    progressItems.forEach((el) => {
      const step = Number(el.dataset.step);
      el.classList.toggle('is-active', step === index);
      el.classList.toggle('is-done', step < index);
      el.setAttribute('aria-current', step === index ? 'step' : 'false');
    });

    // Stage 5 ("Frying & Expansion") is the hero moment — the raw pellet
    // auto-transforms into its fried state shortly after the stage
    // becomes active, reusing the exact same crossfade as the product
    // cards' RAW/FRIED control for one consistent motion language.
    if (fryRaw && fryFried) {
      window.clearTimeout(fryTimer);
      if (index === 4) {
        fryTimer = window.setTimeout(() => {
          if (currentStep !== 4) return;
          fryRaw.classList.remove('is-active');
          fryFried.classList.add('is-active');
        }, reducedMotionMQ.matches ? 0 : 550);
      } else {
        fryFried.classList.remove('is-active');
        fryRaw.classList.add('is-active');
      }
    }
  }

  function updateProgress() {
    ticking = false;
    if (!desktopMQ.matches) return;

    const rect = section.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) {
      setStep(0);
      return;
    }

    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const progress = scrolled / total;
    const index = Math.min(STEP_COUNT - 1, Math.floor(progress * STEP_COUNT));
    setStep(index);
  }

  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateProgress);
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
  if (desktopMQ.addEventListener) {
    desktopMQ.addEventListener('change', onScrollOrResize);
  } else if (desktopMQ.addListener) {
    desktopMQ.addListener(onScrollOrResize);
  }

  progressItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!desktopMQ.matches) return;
      const step = Number(btn.dataset.step);
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const targetProgress = (step + 0.5) / STEP_COUNT;
      const targetY = window.scrollY + rect.top + targetProgress * total;
      window.scrollTo({ top: targetY, behavior: reducedMotionMQ.matches ? 'auto' : 'smooth' });
    });
  });

  updateProgress();
})();
