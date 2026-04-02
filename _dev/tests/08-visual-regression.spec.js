// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES, VISUAL_BREAKPOINTS } = require('./helpers/pages');
const { suppressPopup } = require('./helpers/suppress-popup');

test.describe('@visual 08 — Visual Regression', () => {
  test.setTimeout(60000);

  for (const bp of VISUAL_BREAKPOINTS) {
    test.describe(`@ ${bp.width}px (${bp.name})`, () => {
      test.use({ viewport: { width: bp.width, height: 812 } });

      for (const pg of PAGES) {
        test(`${pg.name}`, async ({ page }) => {
          await suppressPopup(page);

          // Disable animations for stable screenshots
          await page.addInitScript(() => {
            const style = document.createElement('style');
            style.textContent = `
              *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
              }
            `;
            document.addEventListener('DOMContentLoaded', () => {
              document.head.appendChild(style);
            });
          });

          await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('.nav-menu', { timeout: 5000 });

          // Event-driven font wait instead of fixed timeout
          await page.evaluate(() => document.fonts.ready);

          const slug = pg.path.replace(/\//g, '_').replace('.html', '');
          await expect(page).toHaveScreenshot(
            `${slug}-${bp.width}px.png`,
            {
              fullPage: true,
              maxDiffPixelRatio: 0.002, // 0.2% threshold
            }
          );
        });
      }
    });
  }
});
