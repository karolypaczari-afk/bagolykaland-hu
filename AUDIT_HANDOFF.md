# Audit Handoff

Last updated: 2026-04-02

## Changelog for this checkpoint

- Refreshed the remaining stale Playwright audit specs so they match the current `bagolykaland.hu` page structure:
  - `_dev/tests/06-mobile-nav.spec.js`
  - `_dev/tests/09-seo.spec.js`
  - `_dev/tests/11-accessibility.spec.js`
  - `_dev/tests/22-text-overflow.spec.js`
  - `_dev/tests/26-asset-integrity.spec.js`
- Added root crawlability files:
  - `robots.txt`
  - `sitemap.xml`
- Tightened shared contrast tokens in `css/style.css` and added targeted layout fixes for:
  - legal-content/privacy table styling
  - mobile team-card overflow on `/pages/rolunk/`
  - gallery grid behavior on small screens
  - service-link contrast on themed surfaces
- Removed low-contrast inline text/link colors from the pricing, contact, service-detail, and diagnostic-detail pages touched in this pass.
- Updated the privacy page structure so accessibility checks evaluate the final rendered content instead of animated/transitional states.

## Verified so far

- Broken-link static scan: passed.
- `_dev/tests/03-links.spec.js`: passed in Chromium with `--workers=1`.
- `_dev/tests/06-mobile-nav.spec.js`: passed in Chromium.
- `_dev/tests/07-responsive.spec.js`: passed in Chromium.
- `_dev/tests/11-accessibility.spec.js`: passed in Chromium.
- `_dev/tests/16-image-optimization.spec.js`: passed in Chromium with `--workers=1`.
- `_dev/tests/21-overflow.spec.js`: passed in Chromium.

## Remaining TODOs

1. Run `_dev/tests/22-text-overflow.spec.js` in Chromium without forcing single-worker mode.
   The previous attempt timed out at the shell level because that suite covers 147 viewport/page combinations.
2. Run `_dev/tests/09-seo.spec.js` in Chromium to verify the rewritten metadata, `robots.txt`, and `sitemap.xml` checks.
3. Run `_dev/tests/26-asset-integrity.spec.js` in Chromium to verify the rewritten local asset/reference checks.
4. If any of the three remaining suites fail, fix those issues and rerun only the affected suites before the next release checkpoint.

## Notes for the next session

- `robots.txt` and `sitemap.xml` now exist at the repo root.
- The interrupted local Playwright `http-server` processes were stopped before this checkpoint commit.
- Leave `_dev/errors/` untouched unless there is a separate task for it.
