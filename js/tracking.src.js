/**
 * BAGOLYKALAND.HU — Tracking configuration
 *
 * Direct gtag.js setup (GTM container exists but is empty / unused):
 * - `gaMeasurementId` drives GA4 via direct gtag.js load — this sends `page_view`
 * - `gtmId` is intentionally blank. Do NOT re-enable until a published GTM
 *   container version exists; otherwise the loader skips direct gtag.js and
 *   page_views stop firing entirely.
 * - `gAdsId` — Google Ads customer ID prefixed with `AW-`. Set → loads the AW
 *   tag (cross-domain linker, conversion enhanced data). Customer 8433857843
 *   was created 2026-05-11 and linked to GA4 property 490802166 the same day.
 * - `gAdsLabel` — per-conversion-action label (e.g. `aBcD-EfGhIjKlM`). Until
 *   set, direct gtag conversion fires are no-ops in main.src.js — production
 *   stays safe. Drop in the label from Google Ads → Conversions → action →
 *   Tag setup → Use Google Tag Manager / Install the tag yourself → label
 *   value, and run `npm run build`.
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
    gAdsId: 'AW-8433857843',
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
