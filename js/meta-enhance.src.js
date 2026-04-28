/**
 * BAGOLYKALAND.HU — Meta Pixel + CAPI enrichment layer
 *
 * Runs after tracking-loader has booted the base pixel. Adds:
 *   1. fbclid → _fbc cookie (90d) — first-hit Meta identifier when SDK hasn't set one yet
 *   2. _fbp cookie backup (390d) — in case FB SDK times out
 *   3. Persistent external_id cookie — improves Meta match quality across sessions
 *   4. Hashed email persistence — once a user submits a form, reuse for later CAPI events
 *   5. Event dedup via shared eventID for browser fbq + server CAPI
 *   6. Custom engagement events: CTAClick, PageScroll, TimeOnPage, OutboundClick, EmailClick
 *   7. CAPI relay to /api/meta-capi-relay.php for server-side mirror (requires capi-config.php)
 *
 * Stays inert until the cookie consent state is granted.
 */
(function () {
  'use strict';

  var CAPI_ENDPOINT = '/api/meta-capi-relay.php';
  var EMAIL_HASH_KEY = 'bk_meta_em_hash';
  var PHONE_HASH_KEY = 'bk_meta_ph_hash';
  var FN_HASH_KEY = 'bk_meta_fn_hash';
  var LN_HASH_KEY = 'bk_meta_ln_hash';
  var EXT_ID_COOKIE = 'bk_ext_id';
  var DOMAIN_COOKIE_ATTR = location.hostname.indexOf('bagolykaland.hu') !== -1
    ? ';domain=.bagolykaland.hu'
    : '';

  function getCookie(name) {
    var m = document.cookie.match('(^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)');
    return m ? decodeURIComponent(m[2]) : '';
  }

  function setCookie(name, value, days) {
    if (!value) return;
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value) +
      DOMAIN_COOKIE_ATTR +
      ';path=/;expires=' + d.toUTCString() +
      ';SameSite=Lax;Secure';
  }

  function getQuery(name) {
    var m = window.location.search.match(new RegExp('[?&]' + name + '=([^&#]+)'));
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }

  function genId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now() + '_' + Math.random().toString(36).slice(2, 11);
  }

  function bytesToHex(bytes) {
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
      var h = bytes[i].toString(16);
      hex += h.length < 2 ? '0' + h : h;
    }
    return hex;
  }

  function sha256(str, cb) {
    if (!window.crypto || !crypto.subtle || !window.TextEncoder) {
      cb('');
      return;
    }
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
      .then(function (buf) { cb(bytesToHex(new Uint8Array(buf))); })
      .catch(function () { cb(''); });
  }

  function readStored(key, globalKey) {
    if (window[globalKey]) return window[globalKey];
    try {
      var stored = localStorage.getItem(key);
      if (stored) { window[globalKey] = stored; return stored; }
    } catch (e) { /* storage blocked */ }
    return '';
  }

  function persistStored(key, globalKey, hashHex) {
    if (!hashHex) return;
    window[globalKey] = hashHex;
    try { localStorage.setItem(key, hashHex); } catch (e) { /* silent */ }
  }

  function readStoredEmailHash() { return readStored(EMAIL_HASH_KEY, '_bkEmailHash'); }
  function readStoredPhoneHash() { return readStored(PHONE_HASH_KEY, '_bkPhoneHash'); }
  function readStoredFnHash()    { return readStored(FN_HASH_KEY,    '_bkFnHash'); }
  function readStoredLnHash()    { return readStored(LN_HASH_KEY,    '_bkLnHash'); }

  function persistEmailHash(hashHex) { persistStored(EMAIL_HASH_KEY, '_bkEmailHash', hashHex); }
  function persistPhoneHash(hashHex) { persistStored(PHONE_HASH_KEY, '_bkPhoneHash', hashHex); }
  function persistFnHash(hashHex)    { persistStored(FN_HASH_KEY,    '_bkFnHash',    hashHex); }
  function persistLnHash(hashHex)    { persistStored(LN_HASH_KEY,    '_bkLnHash',    hashHex); }

  // Normalize + hash a Hungarian phone number (06xxx → 36xxx, digits only).
  function hashPhoneE164(raw, cb) {
    var d = String(raw || '').replace(/\D+/g, '');
    if (!d) return cb('');
    if (d.indexOf('36') !== 0 && d.indexOf('06') === 0) d = '36' + d.slice(2);
    sha256(d, cb);
  }

  // Persist all identity fields from a single form submission. Caller passes
  // plaintext; we hash + store. This powers the 1.57% (em) + 0.82% (ph) EMQ
  // uplift Meta's Events Manager recommends.
  function persistIdentity(fields) {
    if (!fields) return;
    if (fields.email) sha256(String(fields.email).trim().toLowerCase(), persistEmailHash);
    if (fields.phone) hashPhoneE164(fields.phone, persistPhoneHash);
    if (fields.firstName) sha256(String(fields.firstName).trim().toLowerCase(), persistFnHash);
    if (fields.lastName)  sha256(String(fields.lastName).trim().toLowerCase(),  persistLnHash);
  }

  // ── External ID (persistent user identifier) ──────────────────────────────
  var externalId = getCookie(EXT_ID_COOKIE);
  if (!externalId) {
    externalId = genId();
    setCookie(EXT_ID_COOKIE, externalId, 180);
  }
  // Resolve once — every sendCapi() call awaits the SHA-256 result so CAPI
  // always receives the hashed external_id (Meta's expected format), never
  // the raw UUID during the brief async window.
  var externalIdHashPromise = new Promise(function (resolve) {
    sha256(externalId, function (h) { resolve(h || externalId); });
  });

  // ── _fbc / _fbp bootstrapping ─────────────────────────────────────────────
  function ensureFbCookies() {
    var fbclid = getQuery('fbclid');
    var fbc = getCookie('_fbc') || window._bkDerivedFbc || '';
    if (fbclid) {
      fbc = fbc || ('fb.1.' + Date.now() + '.' + fbclid);
      window._bkDerivedFbc = fbc;
      setCookie('_fbc', fbc, 90);
    } else if (fbc) {
      setCookie('_fbc', fbc, 90);
    }

    var fbp = getCookie('_fbp') || window._bkDerivedFbp || '';
    if (!fbp) {
      fbp = 'fb.1.' + Date.now() + '.' + Math.floor(Math.random() * 1e10);
      window._bkDerivedFbp = fbp;
    }
    setCookie('_fbp', fbp, 390);

    return { fbc: fbc, fbp: fbp };
  }

  // ── CAPI relay (fire-and-forget) ──────────────────────────────────────────
  function sendCapi(eventName, eventId, customData, extraUserData) {
    // Always wait for the external_id hash so the server-side event sees
    // a sha256 identifier — never the raw UUID during the async window.
    externalIdHashPromise.then(function (extIdHash) {
      var userData = {
        external_id: extIdHash,
        client_user_agent: navigator.userAgent
      };
      var fbc = getCookie('_fbc') || window._bkDerivedFbc;
      var fbp = getCookie('_fbp') || window._bkDerivedFbp;
      if (fbc) userData.fbc = fbc;
      if (fbp) userData.fbp = fbp;
      var emHash = readStoredEmailHash();
      if (emHash) userData.em = emHash;
      var phHash = readStoredPhoneHash();
      if (phHash) userData.ph = phHash;
      var fnHash = readStoredFnHash();
      if (fnHash) userData.fn = fnHash;
      var lnHash = readStoredLnHash();
      if (lnHash) userData.ln = lnHash;
      if (extraUserData) {
        for (var k in extraUserData) {
          if (Object.prototype.hasOwnProperty.call(extraUserData, k) && extraUserData[k]) {
            userData[k] = extraUserData[k];
          }
        }
      }

      var payload = {
        event_name: eventName,
        event_id: eventId,
        source_url: window.location.href,
        user_data: userData,
        custom_data: customData || {}
      };

      try {
        if (typeof fetch === 'function') {
          fetch(CAPI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
          }).catch(function () {});
          return;
        }
      } catch (e) { /* ignore */ }
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', CAPI_ENDPOINT, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(payload));
      } catch (e) { /* silent */ }
    });
  }

  // ── Dedup fbq('track') + CAPI relay ───────────────────────────────────────
  function trackMetaEvent(eventName, customData, extraUserData, options) {
    var eventId = (options && options.eventId) || genId();
    if (typeof window.fbq === 'function') {
      try {
        window.fbq('track', eventName, customData || {}, { eventID: eventId });
      } catch (e) { /* SDK not ready yet */ }
    }
    sendCapi(eventName, eventId, customData, extraUserData);
    return eventId;
  }

  function trackMetaCustom(eventName, customData) {
    var eventId = genId();
    if (typeof window.fbq === 'function') {
      try {
        window.fbq('trackCustom', eventName, customData || {}, { eventID: eventId });
      } catch (e) { /* silent */ }
    }
  }

  // ── Page-name detection (for event attribution) ──────────────────────────
  function detectPageName() {
    var path = window.location.pathname.toLowerCase();
    if (path === '/' || path.indexOf('/index') === 0) return 'home';
    if (path.indexOf('/nyari-tabor') !== -1) return 'camp_kincskereso';
    if (path.indexOf('/szorongasoldo') !== -1) return 'szorongasoldo';
    if (path.indexOf('/nyari-iskola-elokeszito') !== -1) return 'nyari_iskola_elokeszito';
    if (path.indexOf('/iskola-elokeszito') !== -1) return 'iskolaelokeszito';
    if (path.indexOf('/foglalkozasaink') !== -1) return 'service';
    if (path.indexOf('/vizsgalatok') !== -1) return 'assessment';
    if (path.indexOf('/kezen-fogva') !== -1) return 'kezen_fogva';
    if (path.indexOf('/blog/') !== -1) return 'blog';
    if (path.indexOf('/kapcsolat') !== -1) return 'kapcsolat';
    if (path.indexOf('/rolunk') !== -1) return 'rolunk';
    if (path.indexOf('/arlista') !== -1) return 'arlista';
    return 'other';
  }
  var pageName = detectPageName();

  // High-value pages emit a standard ViewContent with value/content_ids so
  // Meta's optimizer sees the funnel: ViewContent → InitiateCheckout →
  // CampApplication/Lead. ViewContent is a standard event (unlike
  // custom CTAClick) and counts toward Aggregated Event Measurement.
  var VIEW_CONTENT_MAP = {
    camp_kincskereso: {
      content_ids: ['kincskereso-2026'],
      content_name: 'Kincskereső Élménytábor 2026',
      content_category: 'summer_camp',
      value: 75000,
      currency: 'HUF'
    },
    szorongasoldo: {
      content_ids: ['szorongasoldo-program'],
      content_name: 'Szorongásoldó program',
      content_category: 'program',
      value: 90000,
      currency: 'HUF'
    },
    iskolaelokeszito: {
      content_ids: ['iskola-elokeszito'],
      content_name: 'Iskola-előkészítő',
      content_category: 'program',
      value: 10000,
      currency: 'HUF'
    },
    nyari_iskola_elokeszito: {
      content_ids: ['nyari-iskola-elokeszito-2026'],
      content_name: 'Nyári intenzív iskola-előkészítő 2026',
      content_category: 'school_prep_intensive',
      value: 140000,
      currency: 'HUF'
    },
    service: {
      content_category: 'service',
      value: 10000,
      currency: 'HUF'
    },
    assessment: {
      content_category: 'assessment',
      value: 15000,
      currency: 'HUF'
    }
  };

  // ── Public API for form handlers ─────────────────────────────────────────
  function reportLead(source, email) {
    var done = function (emHash) {
      if (emHash) persistEmailHash(emHash);
      trackMetaEvent('Lead', {
        content_name: pageName,
        content_category: source || 'form_submit',
        value: 3000,
        currency: 'HUF'
      }, emHash ? { em: emHash } : null);
    };
    if (email) sha256(String(email).trim().toLowerCase(), done);
    else done('');
  }

  function reportContact(email) {
    var done = function (emHash) {
      if (emHash) persistEmailHash(emHash);
      trackMetaEvent('Contact', {
        content_name: 'contact_form',
        content_category: pageName
      }, emHash ? { em: emHash } : null);
    };
    if (email) sha256(String(email).trim().toLowerCase(), done);
    else done('');
  }

  // ── Engagement events (CTA, scroll, time, outbound, email click) ─────────
  function wireCtaTracking() {
    var ctas = document.querySelectorAll(
      'a.btn-coral, a.btn-teal, a.btn-primary, .nav-cta a, .v2-sticky-cta a, .announcement-bar a'
    );
    ctas.forEach(function (btn) {
      if (btn.dataset.bkCtaTracked === '1') return;
      btn.dataset.bkCtaTracked = '1';
      btn.addEventListener('click', function () {
        var label = (btn.textContent || '').trim().slice(0, 60);
        trackMetaCustom('CTAClick', {
          cta_text: label,
          cta_href: btn.getAttribute('href') || '',
          page: pageName
        });
      });
    });
  }

  var scrollMarks = { 25: false, 50: false, 75: false, 90: false };
  function onScroll() {
    var top = window.pageYOffset || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (h <= 0) return;
    var pct = Math.round(top / h * 100);
    Object.keys(scrollMarks).forEach(function (m) {
      if (!scrollMarks[m] && pct >= parseInt(m, 10)) {
        scrollMarks[m] = true;
        trackMetaCustom('PageScroll', { percent: parseInt(m, 10), page: pageName });
      }
    });
  }

  var timeMarks = { 30: false, 60: false, 180: false };
  var timeStart = Date.now();
  function checkTime() {
    var sec = Math.floor((Date.now() - timeStart) / 1000);
    var allDone = true;
    Object.keys(timeMarks).forEach(function (m) {
      if (!timeMarks[m] && sec >= parseInt(m, 10)) {
        timeMarks[m] = true;
        trackMetaCustom('TimeOnPage', { seconds: parseInt(m, 10), page: pageName });
      }
      if (!timeMarks[m]) allDone = false;
    });
    return allDone;
  }

  function wireEngagement() {
    var scrollTimer;
    window.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(onScroll, 200);
    }, { passive: true });

    var timeInt = setInterval(function () {
      if (checkTime()) clearInterval(timeInt);
    }, 5000);

    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a');
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (href.indexOf('mailto:') === 0) {
        var em = href.replace('mailto:', '').split('?')[0];
        trackMetaCustom('EmailClick', { email: em, page: pageName });
        return;
      }
      if (href.indexOf('tel:') === 0) {
        trackMetaCustom('PhoneClick', { phone: href.slice(4), page: pageName });
        return;
      }
      if (href.indexOf('http') === 0 && href.indexOf(window.location.hostname) === -1) {
        trackMetaCustom('OutboundClick', { url: href, page: pageName });
      }
    });
  }

  // InitiateCheckout — fires once the visitor touches any lead-capture or
  // program form. Signals high intent a step earlier than the submit event,
  // giving Meta more data to optimize on (especially valuable during the
  // learning phase when CampApplication volume is still low).
  var initiateCheckoutFired = false;
  function wireInitiateCheckout() {
    if (initiateCheckoutFired) return;
    var selector = '[data-program-form] input, [data-program-form] select, [data-program-form] textarea, .lead-catcher-form input, form.program-signup-fields input, form.program-signup-fields select';
    document.addEventListener('focusin', function (e) {
      if (initiateCheckoutFired) return;
      if (!e.target.matches || !e.target.matches(selector)) return;
      initiateCheckoutFired = true;
      var form = e.target.closest('[data-program-form], .lead-catcher-form, form');
      var program = (form && form.getAttribute('data-program-form')) || '';
      var payload = {
        content_name: program || pageName,
        content_category: program ? 'program_inquiry' : 'lead_magnet',
        page: pageName
      };
      var mapped = VIEW_CONTENT_MAP[pageName];
      if (mapped && mapped.content_ids) {
        payload.content_ids = mapped.content_ids;
        payload.value = mapped.value;
        payload.currency = mapped.currency;
        payload.num_items = 1;
      }
      trackMetaEvent('InitiateCheckout', payload);
    }, true);
  }

  // ── Boot — only once consent is granted ──────────────────────────────────
  function boot() {
    if (window._bkMetaEnhanceBooted) return;
    if (!window.BKTracking || !window.BKTracking.hasConsent()) return;
    window._bkMetaEnhanceBooted = true;

    ensureFbCookies();

    // Backfill PageView CAPI — tracking-loader fires fbq PageView but not CAPI.
    // Reuse the event_id that tracking-loader generated so Meta dedups the
    // browser + server PageView into a single attributed event (Meta's docs
    // require identical event_name + event_id within 48h for dedup).
    var pvId = window.BK_PV_EVENT_ID || genId();
    sendCapi('PageView', pvId, { page_name: pageName });

    // Standard ViewContent with monetary value on high-intent landing pages —
    // feeds Meta's optimizer the full funnel: ViewContent → InitiateCheckout
    // → CampApplication. Standard events count toward AEM (Aggregated Event
    // Measurement) so iOS 14.5+ users are attributed correctly.
    var vc = VIEW_CONTENT_MAP[pageName];
    if (vc) {
      trackMetaEvent('ViewContent', Object.assign({ page: pageName }, vc));
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        wireCtaTracking();
        wireEngagement();
        wireInitiateCheckout();
      });
    } else {
      wireCtaTracking();
      wireEngagement();
      wireInitiateCheckout();
    }

    // Re-wire CTAs after dynamic nav injection (components.js)
    document.addEventListener('navReady', wireCtaTracking);
  }

  // Wait for tracking-loader's BKTracking + consent flag.
  (function waitForConsent() {
    if (window.BKTracking && window.BKTracking.hasConsent()) {
      boot();
      return;
    }
    // Hook into consent flow — poll briefly, then give up.
    var tries = 0;
    var tick = setInterval(function () {
      tries++;
      if (window.BKTracking && window.BKTracking.hasConsent()) {
        clearInterval(tick);
        boot();
      } else if (tries > 40) {
        clearInterval(tick); // 20s — user declined or no vendors configured
      }
    }, 500);
  })();

  // Expose for form handlers (popup.js, contact form, etc.)
  window.BKMeta = {
    reportLead: reportLead,
    reportContact: reportContact,
    trackEvent: trackMetaEvent,
    trackCustom: trackMetaCustom,
    persistEmailHash: persistEmailHash,
    persistPhoneHash: persistPhoneHash,
    persistIdentity: persistIdentity,
    hashEmail: function (raw, cb) { sha256(String(raw).trim().toLowerCase(), cb); },
    hashPhone: hashPhoneE164
  };
})();
