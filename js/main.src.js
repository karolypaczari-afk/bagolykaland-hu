/**
 * BAGOLYKALAND.HU — Main JS
 * Page interactions: scroll animations, smooth behavior, etc.
 */

(function () {
  'use strict';

  /* ------------------------------------------
     SUPABASE SAVE HELPER
     Silently saves form data to Supabase DB.
     Uses anon key + RLS (INSERT only).
     Honeypot: skips if `website` field is filled.
  ------------------------------------------ */
  var SB_URL = 'https://esiittanpkwxvmghqbsy.supabase.co/rest/v1/';
  var SB_KEY = 'sb_publishable_WbKSuHWa6yRLGShUnR6bcw_341Kp-Xz';

  function sbInsert(table, payload) {
    return fetch(SB_URL + table, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    }).catch(function () {}); // silent fail — never blocks UI
  }

  const trackedForms = new WeakSet();

  // Primary camp-application program name — fired as a dedicated Meta
  // custom event so ad campaigns can optimize on it without being diluted
  // by the lead-magnet or other program inquiries.
  var CAMP_PROGRAM_NAME = 'Kincskereső Élménytábor 2026';
  var CAMP_VALUE_HUF = 75000;

  // UUID v4 for deduplicating browser pixel events against
  // the server-side Conversions API event fired from /api/contact.php.
  function bkUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function track(eventName, params = {}) {
    if (window.BKTracking && typeof window.BKTracking.trackEvent === 'function') {
      window.BKTracking.trackEvent(eventName, params);
    }

    // ── Meta Pixel mapping ──
    // Each form/action maps to exactly one Meta event to keep ad
    // optimization signals clean:
    //   • "5 ingyenes segédanyag" lead magnet (inline + popup) → Lead
    //   • Nyári tábor jelentkezés → trackCustom CampApplication
    //   • Egyéb program/vizsgálat jelentkezés     → trackCustom ProgramSignup
    //   • Generic bk_form_submit fires no Meta event (dataLayer only)
    if (typeof window.fbq !== 'function') return;

    if (eventName === 'bk_contact_click') {
      window.fbq('track', 'Contact', { content_name: params.contact_method || '' });

    } else if (eventName === 'bk_lead_catcher_submit') {
      // Prefer the BKMeta path (fbq + CAPI mirror with shared eventID)
      // so iOS/adblocker pixel loss is recovered on the server.
      if (window.BKMeta && typeof window.BKMeta.reportLead === 'function') {
        window.BKMeta.reportLead(params.lc_source || 'bagolykaland', params.email || '');
      } else {
        window.fbq('track', 'Lead', {
          content_name: params.lc_source || 'bagolykaland',
          content_category: 'lead_magnet',
        });
      }

    } else if (eventName === 'bk_program_signup') {
      var program = params.program || '';
      var dedup = params.event_id ? { eventID: params.event_id } : undefined;
      if (program === CAMP_PROGRAM_NAME) {
        var campCustom = {
          content_name: program,
          content_category: 'summer_camp',
          value: CAMP_VALUE_HUF,
          currency: 'HUF',
        };
        if (params.turnus) {
          campCustom.content_ids = [params.turnus];
          campCustom.num_items = 1;
        }
        window.fbq('trackCustom', 'CampApplication', campCustom, dedup);
      } else {
        window.fbq('trackCustom', 'ProgramSignup', {
          content_name: program,
          content_category: 'program_inquiry',
        }, dedup);
      }

    } else if (eventName === 'bk_contact_form_success') {
      var contactDedup = params.event_id ? { eventID: params.event_id } : undefined;
      window.fbq('track', 'Contact', {
        content_name: params.form_name || 'contact-form',
      }, contactDedup);

    } else if (eventName === 'bk_cta_click') {
      window.fbq('track', 'ViewContent', { content_name: params.cta_label || '' });
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

      if (control.dataset.track === 'bk_google_review_click') {
        track('bk_google_review_click', {
          click_variant: control.dataset.trackVariant || '',
          click_label: label,
          click_href: href || '',
        });
        return;
      }

      if (control.dataset.track === 'bk_messenger_click') {
        track('bk_messenger_click', {
          click_href: href || '',
          click_location: 'fab',
        });
        return;
      }

      if (
        control.matches('.btn, .nav-cta, .mobile-cta, .service-link') ||
        /\/kapcsolat\/?$/i.test(href)
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
    const els = document.querySelectorAll('.fade-up, .fade-in-left, .fade-in-right, .scale-in, .value-item, .process-step');
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
     LEAD CATCHER (inline email capture forms)
  ------------------------------------------ */
  function initLeadCatchers() {
    document.querySelectorAll('[data-lc-form]').forEach(form => {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = (form.querySelector('input[name="name"]') || {}).value || '';
        const email = (form.querySelector('input[type="email"]') || {}).value || '';
        const btn = form.querySelector('button[type="submit"]');
        const block = form.closest('.lead-catcher');
        const group = block ? block.dataset.lcGroup : 'general';
        const source = block ? (block.dataset.lcSource || 'bagolykaland') : 'bagolykaland';
        if (!email) return;

        // Honeypot check
        const honeypot = (form.querySelector('input[name="website"]') || {}).value || '';
        if (honeypot) return;

        // Save to Supabase (fire-and-forget)
        sbInsert('leads', {
          name: name.trim() || null,
          email: email.trim(),
          source_page: window.location.pathname,
          group_name: group,
          form_type: 'lead_catcher'
        });

        const origText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Küldés...';

        track('bk_lead_catcher_submit', { lc_group: group, lc_source: source, email: email });

        const cfg = (window.BK_ML || {});
        const apiKey = cfg.API_KEY || '';

        if (!apiKey) {
          // No API key — show success anyway (dev/preview mode)
          showLeadSuccess(form, block, group);
          return;
        }

        fetch('https://connect.mailerlite.com/api/subscribers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
          },
          body: JSON.stringify({
            email: email,
            fields: { name: name, signup_source: source, signup_page: window.location.pathname },
            groups: [group]
          })
        })
        .then(r => {
          if (r.ok || r.status === 409) return showLeadSuccess(form, block, group);
          throw new Error(r.status);
        })
        .catch(() => {
          btn.disabled = false;
          btn.textContent = origText;
          let err = form.querySelector('.lc-error');
          if (!err) {
            err = document.createElement('p');
            err.className = 'lc-error';
            err.style.cssText = 'color:var(--clr-coral);font-size:.85rem;margin-top:8px;text-align:center;width:100%;';
            form.appendChild(err);
          }
          err.textContent = 'Hiba történt, kérjük próbáld újra.';
          track('bk_lead_catcher_error', { lc_group: group });
        });
      });
    });
  }

  function showLeadSuccess(form, block, group) {
    form.style.display = 'none';
    const gdpr = block ? block.querySelector('.lead-catcher-gdpr') : null;
    if (gdpr) gdpr.style.display = 'none';
    const success = block ? block.querySelector('.lead-catcher-success') : null;
    if (success) success.classList.add('is-visible');
    // Suppress popup for this context
    document.cookie = 'bk_popup_dismissed_' + group + '=submitted;max-age=' + (30 * 86400) + ';path=/;SameSite=Lax';
    track('bk_lead_catcher_success', { lc_group: group });
  }

  /* ------------------------------------------
     CONTACT FORM (fetch → /api/contact.php)
  ------------------------------------------ */
  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var btn = form.querySelector('button[type="submit"]');
      var errorEl = document.getElementById('contact-error');
      var successEl = document.getElementById('contact-success');

      var name = form.querySelector('#contact-name').value.trim();
      var email = form.querySelector('#contact-email').value.trim();
      var phone = form.querySelector('#contact-phone').value.trim();
      var message = form.querySelector('#contact-message').value.trim();
      var website = (form.querySelector('input[name="website"]') || {}).value || '';

      // Client-side validation
      errorEl.style.display = 'none';
      if (website) return; // honeypot
      if (!name || !email || !message) {
        errorEl.textContent = 'Kérjük, töltsd ki az összes kötelező mezőt.';
        errorEl.style.display = 'block';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorEl.textContent = 'Kérjük, adj meg érvényes e-mail címet.';
        errorEl.style.display = 'block';
        return;
      }

      var origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Küldés...';

      // Shared event_id: browser pixel + server-side CAPI dedup.
      var contactEventId = bkUuid();

      fetch('/api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name, email: email, phone: phone, message: message, website: website,
          event_id: contactEventId, page_url: window.location.href
        })
      })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d }; }); })
      .then(function (res) {
        if (res.data.ok) {
          // Save to Supabase (fire-and-forget)
          sbInsert('contacts', {
            name: name,
            email: email,
            phone: phone || null,
            message: message
          });
          form.style.display = 'none';
          successEl.style.display = 'block';
          track('bk_contact_form_success', { form_name: 'contact-form', event_id: contactEventId });
        } else {
          throw new Error(res.data.error || 'Hiba történt.');
        }
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = origText;
        errorEl.textContent = err.message || 'Hiba történt, kérjük próbáld újra.';
        errorEl.style.display = 'block';
        track('bk_contact_form_error', { form_name: 'contact-form' });
      });
    });
  }

  /* ------------------------------------------
     PROGRAM SIGNUP FORMS (→ /api/contact.php)
  ------------------------------------------ */
  function initProgramForms() {
    document.querySelectorAll('[data-program-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var program = form.dataset.programForm || 'Általános érdeklődés';
        var name = (form.querySelector('input[name="name"]') || {}).value || '';
        var email = (form.querySelector('input[type="email"]') || {}).value || '';
        var phone = (form.querySelector('input[type="tel"]') || {}).value || '';
        var website = (form.querySelector('input[name="website"]') || {}).value || '';
        var btn = form.querySelector('button[type="submit"]');
        var wrapper = form.closest('.program-signup');
        var errorEl = form.querySelector('.program-form-error');
        var successEl = wrapper ? wrapper.querySelector('.program-signup-success') : null;

        if (website) return; // honeypot
        if (!name.trim() || !email.trim()) {
          if (errorEl) { errorEl.textContent = 'Kérjük, töltsd ki a nevet és az e-mail címet.'; errorEl.style.display = 'block'; }
          return;
        }
        if (errorEl) errorEl.style.display = 'none';

        var origText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Küldés...';

        var message = 'Jelentkezés / Érdeklődés: ' + program;
        var childName = (form.querySelector('input[name="child_name"]') || {}).value || '';
        var childAge = (form.querySelector('input[name="child_age"]') || {}).value || '';
        var turnus = (form.querySelector('select[name="turnus"]') || {}).value || '';
        if (childName) message += '\nGyermek neve: ' + childName;
        if (childAge) message += '\nGyermek kora: ' + childAge;
        if (turnus) message += '\nVálasztott turnus: ' + turnus;

        // Shared event_id: browser pixel + server-side Meta CAPI dedup.
        var eventId = bkUuid();

        // Hungarian convention puts surname first ("Paczári Károly").
        var nameParts = name.trim().split(/\s+/);
        var lastName  = nameParts[0] || '';
        var firstName = nameParts.slice(1).join(' ') || '';

        fetch('/api/contact.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            message: message,
            program: program,
            source: window.location.pathname,
            website: website,
            event_id: eventId,
            page_url: window.location.href,
            turnus: turnus || ''
          })
        })
        .then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d }; }); })
        .then(function (res) {
          if (res.data.ok) {
            // Save to Supabase (fire-and-forget)
            sbInsert('signups', {
              parent_name: name.trim(),
              email: email.trim(),
              phone: phone.trim() || null,
              child_name: childName || null,
              child_age: childAge || null,
              turnus: turnus || null,
              program: program,
              source_page: window.location.pathname
            });

            // Persist hashed identity for CAPI enrichment on future pageviews.
            // +1.57% (em) / +0.82% (ph) median reported-conversion uplift per
            // Meta Events Manager benchmarks.
            if (window.BKMeta && typeof window.BKMeta.persistIdentity === 'function') {
              window.BKMeta.persistIdentity({
                email: email.trim(),
                phone: phone.trim(),
                firstName: firstName,
                lastName: lastName
              });
            }

            // Refresh Google Ads Enhanced Conversions user_data with freshly
            // captured identity before the conversion event fires in GTM.
            // setTimeout gives persistIdentity's async sha256 a moment to land.
            setTimeout(function () {
              if (window.BKTracking && typeof window.BKTracking.pushEnhancedConversionsData === 'function') {
                window.BKTracking.pushEnhancedConversionsData(true);
              }
            }, 250);

            // Re-init the browser pixel with advanced matching so this session's
            // remaining page views carry em/ph/fn/ln → higher EMQ without any
            // cross-page storage of plaintext (fbq hashes internally).
            if (typeof window.fbq === 'function'
                && window.BK_TRACKING_CONFIG
                && window.BK_TRACKING_CONFIG.vendors
                && window.BK_TRACKING_CONFIG.vendors.metaPixelId) {
              try {
                window.fbq('init', window.BK_TRACKING_CONFIG.vendors.metaPixelId, {
                  em: email.trim().toLowerCase(),
                  ph: (phone || '').replace(/\D+/g, ''),
                  fn: firstName.toLowerCase(),
                  ln: lastName.toLowerCase()
                });
              } catch (e) { /* SDK not ready — pixel will still fire via dedup */ }
            }

            form.style.display = 'none';
            if (successEl) successEl.style.display = 'block';
            track('bk_program_signup', {
              program: program,
              page: window.location.pathname,
              event_id: eventId,
              turnus: turnus || ''
            });
          } else {
            throw new Error(res.data.error || 'Hiba történt.');
          }
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.textContent = origText;
          if (errorEl) { errorEl.textContent = err.message || 'Hiba történt, kérjük próbáld újra.'; errorEl.style.display = 'block'; }
        });
      });
    });
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
    initLeadCatchers();
    initContactForm();
    initProgramForms();
  }

})();
