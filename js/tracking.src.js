/**
 * BAGOLYKALAND.HU — Tracking configuration
 *
 * GTM-first setup:
 * - `gtmId` drives the whole stack; configure GA4 + Google Ads INSIDE GTM
 * - `gaMeasurementId` is a fallback for direct gtag.js load (skipped when gtmId is set
 *   to prevent duplicate pageviews — GTM already fires the GA4 config tag)
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
    gtmId: 'GTM-M6H5WKVM',
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
