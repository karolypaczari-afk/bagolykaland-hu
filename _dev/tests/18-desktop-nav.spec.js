// @ts-check
/**
 * 18 — Desktop Navigation
 *
 * Ensures the desktop nav works correctly at all desktop viewport widths,
 * especially at the 1200px boundary where the hamburger disappears.
 * Catches overflow, clipping, and dropdown issues before deployment.
 */
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./helpers/pages');
const { suppressPopup } = require('./helpers/suppress-popup');

// Desktop widths to test: boundary (1200), medium (1366), and wide (1920)
const DESKTOP_WIDTHS = [1200, 1280, 1366, 1920];

test.describe('@responsive 18 — Desktop Nav — items visible at all widths', () => {
  for (const width of DESKTOP_WIDTHS) {
    test.describe(`@ ${width}px`, () => {
      test.use({ viewport: { width, height: 900 } });

      for (const pg of PAGES) {
        test(`${pg.name} — all nav items visible`, async ({ page }) => {
          await suppressPopup(page);
          await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('.nav-menu', { timeout: 5000 });

          // Hamburger must be hidden on desktop
          const toggle = page.locator('.nav-toggle');
          await expect(toggle).toBeHidden();

          // Nav menu must be visible
          const navMenu = page.locator('.nav-menu');
          await expect(navMenu).toBeVisible();

          // Every top-level nav link must be visible and within viewport
          const navLinks = navMenu.locator(':scope > li:not(.nav-close-wrapper)');
          const count = await navLinks.count();
          expect(count).toBeGreaterThanOrEqual(5);

          for (let i = 0; i < count; i++) {
            const li = navLinks.nth(i);
            await expect(li).toBeVisible();

            // Check the item is within the viewport (not clipped)
            const box = await li.boundingBox();
            expect(box).not.toBeNull();
            if (box) {
              expect(box.x).toBeGreaterThanOrEqual(0);
              expect(box.x + box.width).toBeLessThanOrEqual(width + 1); // +1 for rounding
            }
          }
        });
      }
    });
  }
});

test.describe('18 — Desktop Nav — no horizontal overflow', () => {
  for (const width of DESKTOP_WIDTHS) {
    test.describe(`@ ${width}px`, () => {
      test.use({ viewport: { width, height: 900 } });

      test(`Homepage — header does not cause horizontal scroll`, async ({ page }) => {
        await suppressPopup(page);
        await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.nav-menu', { timeout: 5000 });

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(overflow).toBe(false);
      });
    });
  }
});

test.describe('18 — Desktop Nav — dropdown hover', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Képzéseink mega-menu opens on hover and is within viewport', async ({ page }) => {
    await suppressPopup(page);
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dropdown-toggle', { timeout: 5000 });

    const dropdown = page.locator('.dropdown').first();
    const megaMenu = dropdown.locator('.mega-menu');

    // Initially hidden
    await expect(megaMenu).toBeHidden();

    // Hover to open
    await dropdown.hover();
    await expect(megaMenu).toBeVisible({ timeout: 2000 });

    // Check mega-menu is within viewport
    const box = await megaMenu.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1440 + 1);
      expect(box.y).toBeGreaterThanOrEqual(0);
    }

    // Check mega-menu has course items
    const items = megaMenu.locator('.mega-item');
    expect(await items.count()).toBeGreaterThanOrEqual(12);
  });

  test('Mega-menu at 1200px — opens on hover and fits viewport', async ({ page, browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
    const narrowPage = await ctx.newPage();
    await suppressPopup(narrowPage);
    await narrowPage.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await narrowPage.waitForSelector('.dropdown-toggle', { timeout: 5000 });

    const dropdown = narrowPage.locator('.dropdown').first();
    const megaMenu = dropdown.locator('.mega-menu');

    await dropdown.hover();
    await expect(megaMenu).toBeVisible({ timeout: 2000 });

    const box = await megaMenu.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1201);
    }

    await ctx.close();
  });
});

test.describe('18 — Desktop Nav — nav-menu fits within header', () => {
  for (const width of DESKTOP_WIDTHS) {
    test.describe(`@ ${width}px`, () => {
      test.use({ viewport: { width, height: 900 } });

      test(`nav-menu does not overflow header`, async ({ page }) => {
        await suppressPopup(page);
        await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.nav-menu', { timeout: 5000 });

        const headerBox = await page.locator('.header').boundingBox();
        const navMenuBox = await page.locator('.nav-menu').boundingBox();

        expect(headerBox).not.toBeNull();
        expect(navMenuBox).not.toBeNull();

        if (headerBox && navMenuBox) {
          // Nav menu right edge should not exceed header right edge
          expect(navMenuBox.x + navMenuBox.width).toBeLessThanOrEqual(
            headerBox.x + headerBox.width + 1
          );
        }
      });
    });
  }
});
