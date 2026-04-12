// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./helpers/pages');
const { suppressPopup } = require('./helpers/suppress-popup');

/** Stat container selectors that must never overflow their parent. */
const STAT_SELECTORS = [
  '.instructor-stats',
  '.v2-instructor-stats',
  '.expert-stats',
  '.stats-grid',
  '.about-stats',
];

test.describe('@responsive 21 — Mobile Overflow & Stat Containers (375px)', () => {
  // Parallel is fine — each test uses its own page instance.
  test.use({ viewport: { width: 375, height: 812 } });

  for (const { name, path } of PAGES) {
    // Single page load: check both body overflow + stat container overflow
    test(`${name} — no overflow + stat containers fit at 375px`, async ({ page }) => {
      await suppressPopup(page);
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      // 1. Body horizontal overflow
      const bodyOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > document.body.clientWidth;
      });
      expect(bodyOverflow, `${name}: body has horizontal overflow at 375px`).toBe(false);

      // 2. Stat containers don't overflow parent
      const overflowing = await page.evaluate((selectors) => {
        const results = [];
        for (const sel of selectors) {
          const els = document.querySelectorAll(sel);
          for (const el of els) {
            const parent = el.parentElement;
            if (parent && el.scrollWidth > parent.clientWidth) {
              results.push({
                selector: sel,
                scrollWidth: el.scrollWidth,
                parentWidth: parent.clientWidth,
              });
            }
          }
        }
        return results;
      }, STAT_SELECTORS);

      expect(overflowing, `${name}: stat containers overflow their parent`).toEqual([]);
    });
  }
});
