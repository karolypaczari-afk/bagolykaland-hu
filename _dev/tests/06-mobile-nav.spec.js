// @ts-check
const { test, expect } = require('./helpers/fixtures');
const { PAGES, SITE_SELECTORS } = require('./helpers/pages');

// All mobile nav tests run at 375px width
test.use({ viewport: { width: 375, height: 812 } });

test.describe('06 — Mobile Nav (all pages)', () => {
  // Test nav visibility on EVERY page — this catches the "disappearing menu" bug
  for (const pg of PAGES) {
    test(`${pg.name} — hamburger visible + menu opens`, async ({ suppressedPage: page }) => {
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(SITE_SELECTORS.hamburger, { timeout: 5000 });

      const toggle = page.locator(SITE_SELECTORS.hamburger);
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');

      // Open the menu and verify links
      const navMenu = page.locator(SITE_SELECTORS.mobileNav);
      await toggle.click();
      await expect(navMenu).toHaveClass(/open/);
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      const visibleLinks = navMenu.locator('a');
      expect(await visibleLinks.count()).toBeGreaterThanOrEqual(4);
    });
  }
});

test.describe('06 — Mobile Nav (interaction tests)', () => {
  test.beforeEach(async ({ suppressedPage: page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(SITE_SELECTORS.hamburger, { timeout: 5000 });
    await expect(page.locator(SITE_SELECTORS.mobileNav)).toHaveAttribute('aria-hidden', 'true');
  });

  test('clicking hamburger opens the menu', async ({ suppressedPage: page }) => {
    const toggle = page.locator(SITE_SELECTORS.hamburger);
    const navMenu = page.locator(SITE_SELECTORS.mobileNav);

    await toggle.click();
    await expect(navMenu).toHaveClass(/open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('clicking hamburger again closes the menu', async ({ suppressedPage: page }) => {
    const toggle = page.locator(SITE_SELECTORS.hamburger);
    const navMenu = page.locator(SITE_SELECTORS.mobileNav);

    await toggle.click();
    await expect(navMenu).toHaveClass(/open/);

    await toggle.click();
    await expect(navMenu).not.toHaveClass(/open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('ESC key closes the menu', async ({ suppressedPage: page }) => {
    const toggle = page.locator(SITE_SELECTORS.hamburger);
    const navMenu = page.locator(SITE_SELECTORS.mobileNav);

    await toggle.click();
    await expect(navMenu).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(navMenu).not.toHaveClass(/open/);
  });

  test('scroll is locked when menu is open', async ({ suppressedPage: page }) => {
    const toggle = page.locator(SITE_SELECTORS.hamburger);

    await toggle.click();
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');
  });

  test('scroll is unlocked when menu closes', async ({ suppressedPage: page }) => {
    const toggle = page.locator(SITE_SELECTORS.hamburger);

    await toggle.click();
    await toggle.click(); // close
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('');
  });

  test('dropdown toggle opens submenu on mobile', async ({ suppressedPage: page }) => {
    const toggle = page.locator(SITE_SELECTORS.hamburger);
    await toggle.click();

    const dropdownToggle = page.locator('.mobile-nav-item button').first();
    await dropdownToggle.click();

    const dropdown = page.locator('.mobile-nav-item').first();
    await expect(dropdown).toHaveClass(/open/);
  });
});

// Desktop nav visibility is covered by 18-desktop-nav.spec.js across multiple widths.
