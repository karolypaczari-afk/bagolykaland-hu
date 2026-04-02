// @ts-check
const { test, expect } = require('./helpers/fixtures');
const { PAGES } = require('./helpers/pages');

test.describe('@smoke 05 — Component Injection', () => {
  for (const page of PAGES) {
    test(`${page.name} has nav and footer after JS runs`, async ({ suppressedPage: p }) => {
      await p.goto(page.path, { waitUntil: 'domcontentloaded' });

      // Wait for components.js to inject nav
      await p.waitForSelector('.nav-menu', { timeout: 5000 });
      await p.waitForSelector('.footer', { timeout: 5000 });

      // Nav checks
      const navToggle = p.locator('.nav-toggle');
      await expect(navToggle).toHaveCount(1);
      await expect(navToggle).toHaveAttribute('aria-label', /[Mm]enü/);

      const logo = p.locator('.header .logo-image');
      await expect(logo).toHaveCount(1);

      // Footer checks
      const footer = p.locator('.footer');
      await expect(footer).toBeVisible();

      const footerLinks = p.locator('.footer-nav a');
      expect(await footerLinks.count()).toBeGreaterThanOrEqual(4);
    });
  }

  // Verify the stable top-level nav shape is identical on every page.
  for (const pg of PAGES) {
    test(`${pg.name} — top-level nav link count matches expected`, async ({ suppressedPage: p }) => {
      // Get expected count from Homepage
      await p.goto(PAGES[0].path, { waitUntil: 'domcontentloaded' });
      await p.waitForSelector('.nav-menu', { timeout: 5000 });
      const expected = await p.locator('.nav-menu > li > a').count();

      // Now check this page
      await p.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await p.waitForSelector('.nav-menu', { timeout: 5000 });
      const count = await p.locator('.nav-menu > li > a').count();
      expect(count, `${pg.name} top-level nav link count (${count}) should match Homepage (${expected})`).toBe(expected);
    });
  }

  // Mega-menu links can hydrate after first paint; verify they eventually appear.
  for (const pg of PAGES) {
    test(`${pg.name} — mega-menu links hydrate after nav injection`, async ({ suppressedPage: p }) => {
      await p.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await p.waitForSelector('.nav-menu', { timeout: 5000 });
      await p.waitForFunction(
        () => document.querySelectorAll('.nav-menu .mega-menu a').length >= 20,
        null,
        { timeout: 5000 }
      );

      const megaLinks = await p.locator('.nav-menu .mega-menu a').count();
      expect(megaLinks).toBeGreaterThanOrEqual(20);
    });
  }

  // Ensure header is visible (not hidden by z-index or overflow issues)
  for (const page of PAGES) {
    test(`${page.name} header is visible and not obscured`, async ({ suppressedPage: p }) => {
      await p.goto(page.path, { waitUntil: 'domcontentloaded' });
      await p.waitForSelector('.header', { timeout: 5000 });

      const header = p.locator('.header');
      await expect(header).toBeVisible();

      // Verify header is position:fixed and at top of viewport
      const headerBox = await header.boundingBox();
      expect(headerBox, 'Header should have a bounding box').toBeTruthy();
      expect(headerBox.y).toBeLessThanOrEqual(60); // allow urgency banner offset
      expect(headerBox.height).toBeGreaterThan(40);

      // Verify z-index is high enough
      const zIndex = await header.evaluate(el => getComputedStyle(el).zIndex);
      expect(Number(zIndex)).toBeGreaterThanOrEqual(1000);
    });
  }

  // Verify no page has a leftover empty #site-nav div (injection must replace it)
  for (const page of PAGES) {
    test(`${page.name} — #site-nav placeholder is replaced`, async ({ suppressedPage: p }) => {
      await p.goto(page.path, { waitUntil: 'domcontentloaded' });
      await p.waitForSelector('.header', { timeout: 5000 });

      const siteNavDiv = p.locator('#site-nav');
      await expect(siteNavDiv).toHaveCount(0);
    });
  }
});
