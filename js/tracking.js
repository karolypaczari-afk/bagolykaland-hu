/**
 * BAGOLYKALAND.HU — Tracking configuration
 *
 * GTM-first setup:
 * - set `gtmId` when your Tag Manager container is ready
 * - the site already emits custom `bk_*` events into `dataLayer`
 * - direct GA4 / Clarity / Meta IDs remain optional fallbacks
 *
 * With blank IDs the tracking layer stays safely inert.
 */
(function () {
  'use strict';

  var existingConfig = window.BK_TRACKING_CONFIG || {};
  var existingVendors = existingConfig.vendors || {};

  window.BK_TRACKING_CONFIG = Object.assign(
    {
      siteName: 'BagolykaLand',
      consentCookieName: 'bk_cookie_consent',
      consentCookieDays: 365,
      requireConsent: true,
      showBannerWithoutVendors: false,
      cookiePolicyUrl: '/pages/adatkezelesi-tajekoztato/',
      crossDomainDomains: ['bagolykaland.hu', 'www.bagolykaland.hu'],
      debug: false,
      vendors: {
        gtmId: '',
        gaMeasurementId: '',
        clarityId: '',
        metaPixelId: '',
      },
    },
    existingConfig
  );

  window.BK_TRACKING_CONFIG.vendors = Object.assign(
    {
      gtmId: '',
      gaMeasurementId: '',
      clarityId: '',
      metaPixelId: '',
    },
    existingVendors
  );
})();
