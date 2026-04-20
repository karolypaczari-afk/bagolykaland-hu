/**
 * BAGOLYKALAND.HU — Tracking configuration
 *
 * Direct gtag.js setup (GTM container exists but is empty / unused):
 * - `gaMeasurementId` drives GA4 via direct gtag.js load — this sends `page_view`
 * - `gtmId` is intentionally blank. Do NOT re-enable until a published GTM
 *   container version exists; otherwise the loader skips direct gtag.js and
 *   page_views stop firing entirely.
 * - `gAdsId` / `gAdsLabel` power Google Ads Enhanced Conversions when set
 * - `clarityId` / `metaPixelId` load their own SDKs (independent of GTM)
 *
 * With blank IDs the tracking layer stays safely inert.
 */
(function () {
  'use strict';

  var existingConfig = window.BK_TRACKING_CONFIG || {};
  var existingVendors = existingConfig.vendors || {};

  var defaultVendors = {
    gtmId: '',
    gaMeasurementId: 'G-86N523JP3E',
    gAdsId: '',
    gAdsLabel: '',
    clarityId: 'rqnf90op5b',
    metaPixelId: '9087042854758379',
  };

  window.BK_TRACKING_CONFIG = Object.assign(
    {
      siteName: 'BagolykaLand',
      consentCookieName: 'bk_cookie_consent',
      consentCookieDays: 365,
      requireConsent: true,
      showBannerWithoutVendors: false,
      cookiePolicyUrl: '/adatkezelesi-tajekoztato/',
      crossDomainDomains: ['bagolykaland.hu', 'www.bagolykaland.hu'],
      debug: false,
    },
    existingConfig
  );

  window.BK_TRACKING_CONFIG.vendors = Object.assign(
    {},
    defaultVendors,
    existingVendors
  );
})();
