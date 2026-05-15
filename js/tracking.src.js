/**
 * BAGOLYKALAND.HU — Tracking configuration
 *
 * Direct gtag.js setup (GTM container exists but is empty / unused):
 * - `gaMeasurementId` drives GA4 via direct gtag.js load — this sends `page_view`
 * - `gtmId` is intentionally blank. Do NOT re-enable until a published GTM
 *   container version exists; otherwise the loader skips direct gtag.js and
 *   page_views stop firing entirely.
 * - `gAdsId` — Google Ads customer ID prefixed with `AW-`. Set → loads the AW
 *   tag (cross-domain linker, conversion enhanced data). Active customer:
 *   `8433857843` (where the 2 active Search campaigns live). Google Ads-i
 *   conversions are NOT fired by a manual `pagead/conversion` event from this
 *   site — they arrive via GA4 Key Event import. The active conversion action
 *   is `bagolykaland.hu (web) generate_lead` (ID 7607011896, type
 *   GOOGLE_ANALYTICS_4_GENERATE_LEAD, primary_for_goal, 5000 HUF default).
 *   Wired 2026-05-15 after the dual-customer misalignment was resolved.
 * - `gAdsLabel` — intentionally blank. The 2026 GA4-import flow does NOT
 *   require a per-action label — conversions flow from GA4 to Ads through
 *   the linked-account pipeline. `fireGoogleAdsConversion()` in main.src.js
 *   stays a no-op (guarded by `if (!v.gAdsLabel) return;`). Do NOT re-add
 *   a label unless we explicitly switch back to the legacy webhely-gtag flow.
 * - `clarityId` / `metaPixelId` load their own SDKs (independent of GTM)
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
