/**
 * BAGOLYKALAND.HU — Main JS
 * Page interactions: scroll animations, smooth behavior, etc.
 */

(function () {
  'use strict';

  /* ------------------------------------------
     SCROLL ANIMATION (fade-up)
     Elements with class .fade-up animate in
     when they enter the viewport.
  ------------------------------------------ */
  function initScrollAnimations() {
    const els = document.querySelectorAll('.fade-up');
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach(el => observer.observe(el));
  }

  /* ------------------------------------------
     SMOOTH SCROLL for anchor links
  ------------------------------------------ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href').slice(1);
        const target = id ? document.getElementById(id) : null;
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ------------------------------------------
     COUNTER ANIMATION
     Elements with [data-count] will count up.
  ------------------------------------------ */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + (el.dataset.suffix || '');
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => observer.observe(el));
  }

  /* ------------------------------------------
     INIT
  ------------------------------------------ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initScrollAnimations();
    initSmoothScroll();
    initCounters();
  }

})();
