/**
 * BAGOLYKALAND.HU — Tracking configuration
 *
 * Add your own vendor IDs below when you are ready to enable analytics.
 * The consent banner and loader are already wired sitewide; with blank IDs
 * they stay safely inert.
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
