// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES, CORE_BREAKPOINTS, EXTRA_BREAKPOINTS, LANDING_PAGES } = require('./helpers/pages');
const { suppressPopup } = require('./helpers/suppress-popup');

// Exclude nav container list items because hidden dropdown panels inflate scrollWidth
// even when no text is visibly overflowing.
const TEXT_SELECTORS = 'p, h1, h2, h3, h4, h5, h6, span, a, li:not(.nav-item):not(.mobile-nav-item), button, label, td, th';

async function collectOverflowIssues(page, viewportWidth) {
  return page.evaluate(({ selectors, viewportWidth }) => {
    const problems = [];

    const docScrollWidth = document.documentElement.scrollWidth;
    if (docScrollWidth > viewportWidth) {
      problems.push({
        type: 'page-overflow',
        selector: 'document',
        text: '',
        scrollWidth: docScrollWidth,
        clientWidth: viewportWidth,
      });
    }

    const els = document.querySelectorAll(selectors);
    for (const el of els) {
      const htmlEl = /** @type {HTMLElement} */ (el);
      const style = getComputedStyle(htmlEl);
      const rect = htmlEl.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) continue;
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (parseFloat(style.opacity) === 0) continue;
      if (style.position === 'absolute' || style.position === 'fixed') continue;
      if (style.textOverflow === 'ellipsis' && style.overflow === 'hidden') continue;
      if (htmlEl.closest('[aria-hidden="true"], [inert]')) continue;

      if (htmlEl.scrollWidth > htmlEl.clientWidth + 1) {
        let selector = htmlEl.tagName.toLowerCase();
        if (htmlEl.id) {
          selector += '#' + htmlEl.id;
        } else if (htmlEl.className && typeof htmlEl.className === 'string') {
          selector += '.' + htmlEl.className.trim().split(/\s+/).join('.');
        }

        problems.push({
          type: 'element-overflow',
          selector,
          text: (htmlEl.textContent || '').trim().substring(0, 80),
          scrollWidth: htmlEl.scrollWidth,
          clientWidth: htmlEl.clientWidth,
        });
      }
    }

    return problems;
  }, { selectors: TEXT_SELECTORS, viewportWidth });
}

test.describe('@responsive 22 — Text Overflow Prevention', () => {
  // Test all pages at core breakpoints, landing pages also at extra breakpoints.
  // Each test checks all applicable breakpoints in a single page context to reduce navigations.
  for (const pg of PAGES) {
    const isLanding = !pg.filePath.startsWith('blog/');
    const breakpoints = isLanding ? [...CORE_BREAKPOINTS, ...EXTRA_BREAKPOINTS] : CORE_BREAKPOINTS;

    test(`${pg.name} — no text overflow at ${breakpoints.length} breakpoints`, async ({ page }) => {
      await suppressPopup(page);

      const allIssues = [];
      for (const bp of breakpoints) {
        await page.setViewportSize({ width: bp.width, height: 900 });
        await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

        const issues = await collectOverflowIssues(page, bp.width);
        if (issues.length > 0) {
          allIssues.push({ breakpoint: `${bp.name} (${bp.width}px)`, issues });
        }
      }

      const msg = allIssues.length > 0
        ? `Text overflow detected:\n${JSON.stringify(allIssues, null, 2)}`
        : '';

      expect(allIssues, msg).toHaveLength(0);
    });
  }
});
