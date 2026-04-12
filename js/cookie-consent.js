/**
 * BAGOLYKALAND.HU — Cookie consent banner
 *
 * Shows only when tracking vendors are configured and consent is required.
 */
(function () {
  'use strict';

  var tracking = window.BKTracking;
  if (!tracking || !tracking.config) {
    return;
  }

  var config = tracking.config;
  var storedConsent = typeof tracking.getStoredConsent === 'function' ? tracking.getStoredConsent() : '';
  var shouldShowBanner =
    config.requireConsent &&
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
    }, 250);
  }

  function renderBanner() {
    if (!document.body || document.getElementById('bk-cookie-consent')) {
      return;
    }

    var banner = document.createElement('aside');
    banner.id = 'bk-cookie-consent';
    banner.className = 'bk-cookie-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie beállítások');
    banner.innerHTML =
      '<div class="bk-cookie-consent__inner">' +
      '  <div class="bk-cookie-consent__copy">' +
      '    <strong>Cookie beállítások</strong>' +
      '    <p>A statisztikai és marketing cookie-k csak jóváhagyás után indulnak el. A részleteket az <a href="' +
      config.cookiePolicyUrl +
      '">adatkezelési tájékoztatóban</a> találod.</p>' +
      '  </div>' +
      '  <div class="bk-cookie-consent__actions">' +
      '    <button type="button" class="bk-cookie-consent__btn bk-cookie-consent__btn--primary" data-bk-consent="accept">Elfogadom</button>' +
      '    <button type="button" class="bk-cookie-consent__btn bk-cookie-consent__btn--secondary" data-bk-consent="reject">Csak szükségesek</button>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(banner);
    tracking.trackEvent('bk_cookie_banner_view', {
      banner_variant: 'default',
    });

    banner.addEventListener('click', function (event) {
      var action = event.target && event.target.getAttribute('data-bk-consent');
      if (!action) return;

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
