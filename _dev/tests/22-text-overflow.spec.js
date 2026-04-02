// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES, CORE_BREAKPOINTS, EXTRA_BREAKPOINTS, LANDING_PAGES } = require('./helpers/pages');
const { suppressPopup } = require('./helpers/suppress-popup');

/**
 * Text Overflow Prevention
 *
 * Smart breakpoint sampling:
 * - All pages tested at 3 core breakpoints (375, 768, 1200)
 * - Only landing pages tested at extra breakpoints (480, 640, 1199, 1440)
 */

// Selectors for all common text-bearing elements
const TEXT_SELECTORS = 'p, h1, h2, h3, h4, h5, h6, span, a, li, button, label, td, th';

test.describe('@responsive 22 — Text Overflow Prevention', () => {
  // Core breakpoints: all pages
  for (const bp of CORE_BREAKPOINTS) {
    for (const pg of PAGES) {
      test(`${pg.name} @ ${bp.name} (${bp.width}px) — no text overflow`, async ({ page }) => {
        await page.setViewportSize({ width: bp.width, height: 900 });
        await suppressPopup(page);
        await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

        const issues = await page.evaluate(({ selectors, viewportWidth }) => {
          const problems = [];

          // 1. Check for page-level horizontal overflow
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

          // 2. Walk all visible text elements and check for element-level overflow
          const els = document.querySelectorAll(selectors);
          for (const el of els) {
            const htmlEl = /** @type {HTMLElement} */ (el);
            const style = getComputedStyle(htmlEl);
            const rect = htmlEl.getBoundingClientRect();

            if (rect.width === 0 || rect.height === 0) continue;
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            if (parseFloat(style.opacity) === 0) continue;
            if (style.textOverflow === 'ellipsis' && style.overflow === 'hidden') continue;

            if (htmlEl.scrollWidth > htmlEl.clientWidth + 1) {
              let selector = htmlEl.tagName.toLowerCase();
              if (htmlEl.id) {
                selector += '#' + htmlEl.id;
              } else if (htmlEl.className && typeof htmlEl.className === 'string') {
                selector += '.' + htmlEl.className.trim().split(/\s+/).join('.');
              }

              const text = (htmlEl.textContent || '').trim().substring(0, 80);

              problems.push({
                type: 'element-overflow',
                selector,
                text,
                scrollWidth: htmlEl.scrollWidth,
                clientWidth: htmlEl.clientWidth,
              });
            }
          }

          return problems;
        }, { selectors: TEXT_SELECTORS, viewportWidth: bp.width });

        const msg = issues.length > 0
          ? `Text overflow detected (${issues.length} issue${issues.length > 1 ? 's' : ''}):\n` +
            JSON.stringify(issues, null, 2)
          : '';

        expect(issues, msg).toHaveLength(0);
      });
    }
  }

  // Extra breakpoints: landing pages only
  for (const bp of EXTRA_BREAKPOINTS) {
    for (const pg of LANDING_PAGES) {
      test(`${pg.name} @ ${bp.name} (${bp.width}px) — no text overflow`, async ({ page }) => {
        await page.setViewportSize({ width: bp.width, height: 900 });
        await suppressPopup(page);
        await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

        const issues = await page.evaluate(({ selectors, viewportWidth }) => {
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
            if (style.textOverflow === 'ellipsis' && style.overflow === 'hidden') continue;

            if (htmlEl.scrollWidth > htmlEl.clientWidth + 1) {
              let selector = htmlEl.tagName.toLowerCase();
              if (htmlEl.id) {
                selector += '#' + htmlEl.id;
              } else if (htmlEl.className && typeof htmlEl.className === 'string') {
                selector += '.' + htmlEl.className.trim().split(/\s+/).join('.');
              }

              const text = (htmlEl.textContent || '').trim().substring(0, 80);

              problems.push({
                type: 'element-overflow',
                selector,
                text,
                scrollWidth: htmlEl.scrollWidth,
                clientWidth: htmlEl.clientWidth,
              });
            }
          }

          return problems;
        }, { selectors: TEXT_SELECTORS, viewportWidth: bp.width });

        const msg = issues.length > 0
          ? `Text overflow detected (${issues.length} issue${issues.length > 1 ? 's' : ''}):\n` +
            JSON.stringify(issues, null, 2)
          : '';

        expect(issues, msg).toHaveLength(0);
      });
    }
  }
});
