/**
 * BAGOLYKALAND.HU — Cookie consent banner (opt-out model)
 *
 * Tracking is granted by default. This banner is shown once as an opt-out
 * surface — the user can reject cookies if they choose. Scrolling, clicking
 * outside, or clicking "Elfogadom" dismisses the banner and persists consent.
 */
(function () {
  'use strict';

  var tracking = window.BKTracking;
  if (!tracking || !tracking.config) {
    return;
  }

  var config = tracking.config;
  var storedConsent = typeof tracking.getStoredConsent === 'function' ? tracking.getStoredConsent() : '';

  // Show banner only when no stored preference exists (first visit).
  // Tracking is already running — the banner is informational / opt-out.
  var shouldShowBanner =
    (tracking.hasConfiguredVendors() || config.showBannerWithoutVendors) &&
    !storedConsent;

  if (!shouldShowBanner) {
    return;
  }

  function getCurrentScript() {
    if (document.currentScript) {
      return document.currentScript;
    }

    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i -= 1) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('cookie-consent.js') !== -1) {
        return scripts[i];
      }
    }

    return null;
  }

  function getStylesheetHref() {
    var currentScript = getCurrentScript();
    if (!currentScript) return '';

    var src = currentScript.getAttribute('src') || '';
    if (!src) return '';

    return src.replace(/(^|\/)js\/cookie-consent\.js$/, '$1css/cookie-consent.css');
  }

  function ensureStyles(callback) {
    var href = getStylesheetHref();
    if (!href) {
      callback();
      return;
    }

    var existing = document.querySelector('link[data-bk-cookie-consent-styles]');
    if (existing) {
      if (existing.sheet) {
        callback();
        return;
      }

      existing.addEventListener('load', callback, { once: true });
      existing.addEventListener('error', callback, { once: true });
      window.setTimeout(callback, 1200);
      return;
    }

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-bk-cookie-consent-styles', 'true');
    link.addEventListener('load', callback, { once: true });
    link.addEventListener('error', callback, { once: true });
    window.setTimeout(callback, 1200);
    (document.head || document.documentElement).appendChild(link);
  }

  function closeBanner(banner) {
    banner.classList.remove('is-visible');
    window.setTimeout(function () {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 400);
  }

  function renderBanner() {
    if (!document.body || document.getElementById('bk-cookie-consent')) {
      return;
    }

    // Persist default consent immediately — on next page load the cookie
    // exists so the banner won't appear again.
    tracking.setConsent(true, { persist: true, load: false, track: false, source: 'default' });

    var banner = document.createElement('aside');
    banner.id = 'bk-cookie-consent';
    banner.className = 'bk-cookie-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie hozzájárulás');
    banner.innerHTML =
      '<div class="bk-cookie-consent__inner">' +
      '  <div class="bk-cookie-consent__copy">' +
      '    <p>Cookie-kat használunk a legjobb élmény érdekében. ' +
      '<a href="' + (config.cookiePolicyUrl || '/adatkezelesi-tajekoztato/') + '">Cookie tájékoztató</a></p>' +
      '  </div>' +
      '  <div class="bk-cookie-consent__actions">' +
      '    <button type="button" class="bk-cookie-consent__btn bk-cookie-consent__btn--primary" data-bk-consent="accept">Elfogadom</button>' +
      '    <button type="button" class="bk-cookie-consent__btn bk-cookie-consent__btn--secondary" data-bk-consent="reject">Elutasítom</button>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(banner);
    tracking.trackEvent('bk_cookie_banner_view', {
      banner_variant: 'opt-out',
    });

    // Auto-accept on scroll (300px, like zsenibagoly)
    function onScroll() {
      if (window.scrollY > 300) {
        cleanup();
        tracking.setConsent(true, { source: 'scroll' });
        closeBanner(banner);
      }
    }

    // Auto-accept on any click outside the banner
    function onDocClick(event) {
      if (!banner.contains(event.target)) {
        cleanup();
        tracking.setConsent(true, { source: 'interaction' });
        closeBanner(banner);
      }
    }

    function cleanup() {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onDocClick, true);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onDocClick, true);

    banner.addEventListener('click', function (event) {
      var action = event.target && event.target.getAttribute('data-bk-consent');
      if (!action) return;

      cleanup();
      var accepted = action === 'accept';
      tracking.setConsent(accepted, {
        source: 'banner',
      });
      closeBanner(banner);
    });

    window.requestAnimationFrame(function () {
      banner.classList.add('is-visible');
    });
  }

  function start() {
    ensureStyles(renderBanner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
