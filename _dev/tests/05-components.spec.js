// @ts-check
const { test, expect } = require('./helpers/fixtures');
const { PAGES, SITE_SELECTORS } = require('./helpers/pages');

// Cache the expected nav count so we don't need a separate homepage load per page
let expectedNavCount = null;

test.describe('@smoke 05 — Component Injection', () => {
  for (const pageEntry of PAGES) {
    test(`${pageEntry.name} — shared shell, nav count, header position, placeholders`, async ({ suppressedPage: page }) => {
      await page.goto(pageEntry.path, { waitUntil: 'domcontentloaded' });

      await page.waitForSelector(SITE_SELECTORS.header, { timeout: 5000 });
      await page.waitForSelector(SITE_SELECTORS.footer, { timeout: 5000 });
      await page.waitForSelector('.site-announcement', { timeout: 5000 });

      // — shared header, footer, announcement
      await expect(page.locator(SITE_SELECTORS.header)).toBeVisible();
      await expect(page.locator(SITE_SELECTORS.footer)).toBeVisible();
      await expect(page.locator('.site-announcement')).toContainText('Csokonai út 32');

      const hamburger = page.locator(SITE_SELECTORS.hamburger);
      await expect(hamburger).toHaveCount(1);
      await expect(hamburger).toHaveAttribute('aria-label', /[Mm]enü/);

      const logo = page.locator(SITE_SELECTORS.logo);
      await expect(logo).toBeVisible();

      const footerLinks = page.locator(SITE_SELECTORS.footerLinks);
      expect(await footerLinks.count()).toBeGreaterThanOrEqual(4);

      // — nav item count matches across pages
      const pageCount = await page.locator('.nav-list > li').count();
      if (expectedNavCount === null) {
        expectedNavCount = pageCount;
      }
      expect(pageCount, `${pageEntry.name} nav item count should match`).toBe(expectedNavCount);

      // — header stays visible below the fixed move notice
      const announcement = page.locator('.site-announcement');
      const header = page.locator(SITE_SELECTORS.header);

      const announcementBox = await announcement.boundingBox();
      const headerBox = await header.boundingBox();

      expect(announcementBox, 'Move announcement should have a bounding box').toBeTruthy();
      expect(headerBox, 'Header should have a bounding box').toBeTruthy();
      expect(headerBox.y).toBeLessThanOrEqual((announcementBox && announcementBox.height) || 80);
      expect(headerBox.height).toBeGreaterThan(40);

      const zIndex = await header.evaluate((element) => getComputedStyle(element).zIndex);
      expect(Number(zIndex)).toBeGreaterThanOrEqual(1000);

      // — placeholders replaced
      await expect(page.locator('#site-header')).toHaveCount(0);
      await expect(page.locator('#site-footer')).toHaveCount(0);
    });
  }
});
