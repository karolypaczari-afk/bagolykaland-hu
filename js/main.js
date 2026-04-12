/**
 * BAGOLYKALAND.HU — Main JS
 * Page interactions: scroll animations, smooth behavior, etc.
 */

(function () {
  'use strict';

  const trackedForms = new WeakSet();

  function track(eventName, params = {}) {
    if (window.BKTracking && typeof window.BKTracking.trackEvent === 'function') {
      window.BKTracking.trackEvent(eventName, params);
    }
  }

  function normalizeText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function getHref(el) {
    if (!el || !el.getAttribute) return '';
    return el.getAttribute('href') || '';
  }

  function getFormName(form) {
    if (!form) return 'unknown_form';
    if (form.id) return form.id;
    if (form.getAttribute('name')) return form.getAttribute('name');
    if (form.getAttribute('aria-label')) return form.getAttribute('aria-label');

    const heading = form.querySelector('h1, h2, h3, legend');
    if (heading) return normalizeText(heading.textContent);

    return 'unnamed_form';
  }

  function getFilledFieldCount(form) {
    return Array.from(form.querySelectorAll('input, textarea, select')).filter((field) => {
      if (field.type === 'checkbox' || field.type === 'radio') {
        return field.checked;
      }
      return normalizeText(field.value).length > 0;
    }).length;
  }

  function initTracking() {
    document.addEventListener('click', (event) => {
      const control = event.target.closest('a, button');
      if (!control) return;

      const href = getHref(control);
      const label = normalizeText(control.textContent) || control.getAttribute('aria-label') || control.id || 'unnamed';

      if (/^tel:/i.test(href)) {
        track('bk_contact_click', {
          contact_method: 'phone',
          click_label: label,
          contact_target: href.replace(/^tel:/i, ''),
        });
        return;
      }

      if (/^mailto:/i.test(href)) {
        track('bk_contact_click', {
          contact_method: 'email',
          click_label: label,
          contact_target: href.replace(/^mailto:/i, ''),
        });
        return;
      }

      if (control.matches('.hamburger, .js-install-app')) {
        return;
      }

      if (
        control.matches('.btn, .nav-cta, .mobile-cta, .service-link') ||
        /\/pages\/kapcsolat\/?$/i.test(href)
      ) {
        track('bk_cta_click', {
          cta_label: label,
          cta_href: href || '',
          cta_kind: control.tagName.toLowerCase(),
          cta_location:
            control.closest('.hero-actions') ? 'hero' :
            control.closest('.header-inner') ? 'header' :
            control.closest('.mobile-nav') ? 'mobile_nav' :
            control.closest('.cta-banner') ? 'cta_banner' :
            control.closest('.news-card') ? 'news_card' :
            control.closest('main') ? 'main_content' :
            'site',
        });
      }
    });

    document.addEventListener('focusin', (event) => {
      const form = event.target.closest('form');
      if (!form || trackedForms.has(form)) return;

      trackedForms.add(form);
      track('bk_form_start', {
        form_name: getFormName(form),
        form_id: form.id || '',
        field_count: form.querySelectorAll('input, textarea, select').length,
      });
    });

    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      track('bk_form_submit', {
        form_name: getFormName(form),
        form_id: form.id || '',
        field_count: form.querySelectorAll('input, textarea, select').length,
        filled_field_count: getFilledFieldCount(form),
      });
    }, true);
  }

  /* ------------------------------------------
     SCROLL ANIMATION (fade-up)
     Elements with class .fade-up animate in
     when they enter the viewport.
  ------------------------------------------ */
  function initScrollAnimations() {
    const els = document.querySelectorAll('.fade-up');
    if (!els.length) return;
    // IntersectionObserver not available in very old WebViews — show elements immediately
    if (!window.IntersectionObserver) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }

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
          // scrollIntoView with behavior:'smooth' requires iOS 15.4+ / Chrome 61+
          // On older browsers it gracefully falls back to instant scroll
          try {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } catch (err) {
            target.scrollIntoView(true);
          }
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
    // If IntersectionObserver unavailable, animate immediately
    if (!window.IntersectionObserver) {
      counters.forEach(el => animateCounter(el));
      return;
    }

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
    initTracking();
    initScrollAnimations();
    initSmoothScroll();
    initCounters();
  }

})();
