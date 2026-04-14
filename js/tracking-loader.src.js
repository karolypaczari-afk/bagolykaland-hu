/**
 * BAGOLYKALAND.HU — Consent-aware tracking bootstrap
 *
 * Loads GTM / GA4 / Clarity / Meta only after consent when IDs are configured.
 */
(function () {
  'use strict';

  var DEFAULT_CONFIG = {
    consentCookieName: 'bk_cookie_consent',
    consentCookieDays: 365,
    requireConsent: true,
    crossDomainDomains: ['bagolykaland.hu', 'www.bagolykaland.hu'],
    vendors: {
      gtmId: '',
      gaMeasurementId: '',
      clarityId: '',
      metaPixelId: '',
    },
  };
  var CONSENT_GRANTED = 'accepted';
  var CONSENT_REJECTED = 'rejected';
  var config = Object.assign({}, DEFAULT_CONFIG, window.BK_TRACKING_CONFIG || {});
  var vendors = Object.assign({}, DEFAULT_CONFIG.vendors, config.vendors || {});
  config.vendors = vendors;

  var state = {
    consentGranted: false,
    loaded: {
      gtm: false,
      ga: false,
      clarity: false,
      meta: false,
    },
    metaPageviewTracked: false,
  };

  function ensureDataLayer() {
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
  }

  function log() {
    if (!config.debug || !window.console || typeof window.console.log !== 'function') {
      return;
    }
    window.console.log.apply(window.console, arguments);
  }

  function hasValue(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function hasConfiguredVendors() {
    return Object.keys(vendors).some(function (key) {
      return hasValue(vendors[key]);
    });
  }

  function getPageType() {
    var path = window.location.pathname.toLowerCase();
    if (path === '/' || path === '/index.html') return 'home';
    if (path.indexOf('/blog/') !== -1) return 'blog';
    if (path.indexOf('/foglalkozasaink/') !== -1) return 'service';
    if (path.indexOf('/vizsgalatok/') !== -1) return 'exam';
    if (path.indexOf('/kapcsolat/') !== -1) return 'contact';
    if (path.indexOf('/rolunk/') !== -1) return 'about';
    return 'page';
  }

  function getConsentState() {
    var storedConsent = getStoredConsent();
    if (state.consentGranted || storedConsent === CONSENT_GRANTED) {
      return 'granted';
    }
    if (storedConsent === CONSENT_REJECTED) {
      return 'denied';
    }
    return 'unknown';
  }

  function pushDataLayerEvent(eventName, params) {
    var payload = Object.assign(
      {
        event: eventName,
        event_source: 'bagolykaland_site',
        page_type: getPageType(),
        page_path: window.location.pathname,
        page_location: window.location.href,
        page_title: document.title || '',
        consent_state: getConsentState(),
      },
      params || {}
    );

    ensureDataLayer().push(payload);
    return payload;
  }

  function escapeCookieName(name) {
    return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function readCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + escapeCookieName(name) + '=([^;]*)'));
    return match ? match[1] : '';
  }

  function setCookie(name, value, days) {
    var expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie =
      name +
      '=' +
      encodeURIComponent(value) +
      '; expires=' +
      expires.toUTCString() +
      '; path=/; SameSite=Lax; Secure';
  }

  function getStoredConsent() {
    var value = readCookie(config.consentCookieName);
    if (value === CONSENT_GRANTED || value === CONSENT_REJECTED) {
      return value;
    }
    return '';
  }

  function ensureScript(id, src, onLoad) {
    var existing = document.getElementById(id);
    if (existing) {
      if (typeof onLoad === 'function') {
        if (existing.getAttribute('data-loaded') === 'true') {
          onLoad();
        } else {
          existing.addEventListener('load', onLoad, { once: true });
        }
      }
      return existing;
    }

    var script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = src;

    if (typeof onLoad === 'function') {
      script.addEventListener('load', function () {
        script.setAttribute('data-loaded', 'true');
        onLoad();
      }, { once: true });
    } else {
      script.addEventListener('load', function () {
        script.setAttribute('data-loaded', 'true');
      }, { once: true });
    }

    var firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      (document.head || document.documentElement).appendChild(script);
    }

    return script;
  }

  function updateGoogleConsent() {
    if (typeof window.gtag !== 'function') return;

    var storageState = state.consentGranted ? 'granted' : 'denied';
    window.gtag('consent', 'update', {
      ad_storage: storageState,
      ad_user_data: storageState,
      ad_personalization: storageState,
      analytics_storage: storageState,
    });
  }

  function updateMetaConsent() {
    if (typeof window.fbq !== 'function') return;
    window.fbq('consent', state.consentGranted ? 'grant' : 'revoke');
  }

  function updateClarityConsent() {
    if (typeof window.clarity !== 'function') return;

    var storageState = state.consentGranted ? 'granted' : 'denied';
    window.clarity('consentv2', {
      ad_Storage: storageState,
      analytics_Storage: storageState,
    });
  }

  function applyConsentState() {
    updateGoogleConsent();
    updateMetaConsent();
    updateClarityConsent();
  }

  function ensureGtag() {
    ensureDataLayer();
    if (typeof window.gtag !== 'function') {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }
    return window.gtag;
  }

  function loadGa() {
    if (!hasValue(vendors.gaMeasurementId) || state.loaded.ga) return false;

    var gtag = ensureGtag();
    gtag('consent', 'default', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
    gtag('js', new Date());
    gtag('config', vendors.gaMeasurementId, {
      linker: { domains: config.crossDomainDomains || [] },
      url_passthrough: true,
      send_page_view: true,
    });

    ensureScript('bk-ga4', 'https://www.googletagmanager.com/gtag/js?id=' + vendors.gaMeasurementId);
    state.loaded.ga = true;
    applyConsentState();
    log('[tracking] GA4 loaded');
    return true;
  }

  function loadGtm() {
    if (!hasValue(vendors.gtmId) || state.loaded.gtm) return false;

    ensureDataLayer().push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js',
    });

    ensureScript('bk-gtm', 'https://www.googletagmanager.com/gtm.js?id=' + vendors.gtmId);
    state.loaded.gtm = true;
    log('[tracking] GTM loaded');
    return true;
  }

  function loadClarity() {
    if (!hasValue(vendors.clarityId) || state.loaded.clarity) return false;

    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', vendors.clarityId);

    state.loaded.clarity = true;
    updateClarityConsent();
    log('[tracking] Clarity loaded');
    return true;
  }

  function loadMeta() {
    if (!hasValue(vendors.metaPixelId) || state.loaded.meta) return false;

    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        if (n.callMethod) {
          n.callMethod.apply(n, arguments);
        } else {
          n.queue.push(arguments);
        }
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', vendors.metaPixelId);
    window.fbq('consent', state.consentGranted ? 'grant' : 'revoke');
    if (state.consentGranted && !state.metaPageviewTracked) {
      window.fbq('track', 'PageView');
      state.metaPageviewTracked = true;
    }

    state.loaded.meta = true;
    log('[tracking] Meta Pixel loaded');
    return true;
  }

  function loadAll() {
    if (!hasConfiguredVendors()) return false;
    if (config.requireConsent && !state.consentGranted) return false;

    loadGtm();
    loadGa();
    loadClarity();
    loadMeta();
    applyConsentState();
    return true;
  }

  function setConsent(granted, options) {
    var settings = options || {};

    state.consentGranted = Boolean(granted);

    if (settings.persist !== false) {
      setCookie(
        config.consentCookieName,
        state.consentGranted ? CONSENT_GRANTED : CONSENT_REJECTED,
        config.consentCookieDays || DEFAULT_CONFIG.consentCookieDays
      );
    }

    if (state.consentGranted && settings.load !== false) {
      loadAll();
    }

    applyConsentState();
    if (settings.track !== false) {
      pushDataLayerEvent('bk_cookie_consent_updated', {
        consent_action: state.consentGranted ? 'accept' : 'reject',
        consent_source: settings.source || 'system',
      });
    }
    return state.consentGranted;
  }

  function trackEvent(eventName, params) {
    pushDataLayerEvent(eventName, params);

    if (!hasValue(vendors.gtmId) && typeof window.gtag === 'function' && hasValue(vendors.gaMeasurementId)) {
      window.gtag('event', eventName, Object.assign({ send_to: vendors.gaMeasurementId }, params || {}));
    }

    return true;
  }

  ensureDataLayer();

  var storedConsent = getStoredConsent();
  if (storedConsent === CONSENT_GRANTED) {
    setConsent(true, { persist: false, track: false, source: 'stored' });
  } else if (storedConsent === CONSENT_REJECTED) {
    setConsent(false, { persist: false, load: false, track: false, source: 'stored' });
  } else if (hasConfiguredVendors()) {
    // No preference yet — grant by default (opt-out model like zsenibagoly).
    // Cookie is NOT persisted here; the cookie-consent banner handles persistence
    // so it can still show as an opt-out surface on first visit.
    setConsent(true, { persist: false, track: false, source: 'default' });
  }

  window.BKTracking = {
    config: config,
    getStoredConsent: getStoredConsent,
    hasConfiguredVendors: hasConfiguredVendors,
    hasConsent: function () {
      return state.consentGranted;
    },
    loadGa: loadGa,
    loadGtm: loadGtm,
    loadClarity: loadClarity,
    loadMeta: loadMeta,
    loadAll: loadAll,
    pushDataLayerEvent: pushDataLayerEvent,
    setConsent: setConsent,
    trackEvent: trackEvent,
  };
})();
