// @ts-check
/**
 * 18 — Desktop Navigation & Megamenu
 *
 * Covers the current Eleventy header implementation:
 * - desktop/mobile nav switch at 1120px
 * - compact desktop actions around 1200px
 * - mega-panel opening, containment, and resize cleanup
 */
const { test, expect } = require('./helpers/fixtures');
const { PAGES, SITE_SELECTORS } = require('./helpers/pages');

const DESKTOP_WIDTHS = [1121, 1200, 1366, 1920];

async function measureHeaderState(page) {
  return page.evaluate(() => {
    const header = document.querySelector('.header-inner');
    const navItems = Array.from(document.querySelectorAll('.nav-list > .nav-item'));
    const install = document.querySelector('.nav-install');
    const cta = document.querySelector('.nav-cta');

    const headerBox = header ? header.getBoundingClientRect() : null;
    const installVisible = !!install && !install.hidden && getComputedStyle(install).display !== 'none';
    const ctaVisible = !!cta && getComputedStyle(cta).display !== 'none';
    const installBox = installVisible ? install.getBoundingClientRect() : null;
    const ctaBox = ctaVisible ? cta.getBoundingClientRect() : null;
    const overlap = installBox && ctaBox
      ? !(
        installBox.left >= ctaBox.right ||
        ctaBox.left >= installBox.right ||
        installBox.top >= ctaBox.bottom ||
        ctaBox.top >= installBox.bottom
      )
      : false;

    const offenders = navItems
      .map((item) => {
        const box = item.getBoundingClientRect();
        return {
          text: item.textContent.replace(/\s+/g, ' ').trim(),
          left: Math.round(box.left),
          right: Math.round(box.right),
        };
      })
      .filter((item) => headerBox && item.right > Math.round(headerBox.right) + 1);

    return {
      overlap,
      installVisible,
      ctaVisible,
      headerRight: headerBox ? Math.round(headerBox.right) : null,
      offenders,
    };
  });
}

// Nav layout is rendered by Eleventy — identical on every page. Sample 3 pages
// (homepage + deepest nesting + longest title) across all widths to catch layout bugs.
const NAV_SAMPLE_PAGES = PAGES.filter((pg) =>
  ['index.html', 'foglalkozasaink/index.html', 'vizsgalatok/komplex-reszkepesseg-vizsgalat/index.html'].includes(pg.filePath)
);

test.describe('@responsive 18 — Desktop nav layout is stable', () => {
  for (const width of DESKTOP_WIDTHS) {
    test.describe(`@ ${width}px`, () => {
      test.use({ viewport: { width, height: 900 } });

      for (const pg of NAV_SAMPLE_PAGES) {
        test(`${pg.name} — desktop nav fits without overlap`, async ({ suppressedPage: page }) => {
          await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector(SITE_SELECTORS.header, { timeout: 5000 });
          await page.waitForTimeout(400);

          await expect(page.locator(SITE_SELECTORS.desktopNav)).toBeVisible();
          await expect(page.locator(SITE_SELECTORS.hamburger)).toBeHidden();

          const headerState = await measureHeaderState(page);
          expect(headerState.offenders, `Nav items overflow header at ${width}px`).toHaveLength(0);
          expect(headerState.overlap, `CTA and install button overlap at ${width}px`).toBe(false);

          const hasHorizontalOverflow = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
          );
          expect(hasHorizontalOverflow).toBe(false);
        });
      }
    });
  }
});

test.describe('18 — Megamenu interactions', () => {
  test.use({ viewport: { width: 1200, height: 900 } });

  test('Homepage — combined services mega panel opens on hover and stays in viewport', async ({ suppressedPage: page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.nav-link[aria-haspopup]', { timeout: 5000 });

    const servicesToggle = page.locator('.nav-link[aria-haspopup]', { hasText: 'Szolgáltatásaink' }).first();
    const servicesPanel = page.locator('.mega-panel--catalog').first();

    await servicesToggle.hover();
    await expect(servicesPanel).toBeVisible({ timeout: 2000 });

    const box = await servicesPanel.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1201);
      expect(box.y).toBeGreaterThanOrEqual(0);
    }

    await expect(servicesPanel.locator('.mega-catalog-section')).toHaveCount(3);
    await expect(servicesPanel.locator('.mega-nav__link--catalog')).toHaveCount(10);
  });

  test('Service detail page highlights the combined parent desktop section', async ({ suppressedPage: page }) => {
    await page.goto('/foglalkozasaink/logopedia/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.nav-link[aria-haspopup]', { timeout: 5000 });

    const servicesToggle = page.locator('.nav-link[aria-haspopup]', { hasText: 'Szolgáltatásaink' }).first();
    await expect(servicesToggle).toHaveClass(/active/);
  });

  test('ArrowDown opens the combined mega panel and focuses its first link', async ({ suppressedPage: page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.nav-link[aria-haspopup]', { timeout: 5000 });

    const servicesToggle = page.locator('.nav-link[aria-haspopup]', { hasText: 'Szolgáltatásaink' }).first();
    await servicesToggle.focus();
    await page.keyboard.press('ArrowDown');

    const servicesPanel = page.locator('.mega-panel--catalog').first();
    await expect(servicesPanel).toBeVisible();
    await expect(servicesPanel.locator('a[href]').first()).toBeFocused();
  });
});

test.describe('18 — Nav state resets cleanly across breakpoints', () => {
  test('Open mobile nav closes when resizing to desktop', async ({ suppressedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(SITE_SELECTORS.hamburger, { timeout: 5000 });

    const hamburger = page.locator(SITE_SELECTORS.hamburger);
    const mobileNav = page.locator(SITE_SELECTORS.mobileNav);

    await hamburger.click();
    await expect(mobileNav).toHaveClass(/open/);

    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(300);

    await expect(page.locator(SITE_SELECTORS.desktopNav)).toBeVisible();
    await expect(mobileNav).not.toHaveClass(/open/);
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('');
  });

  test('Open desktop mega panel closes when resizing to mobile', async ({ suppressedPage: page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.nav-link[aria-haspopup]', { timeout: 5000 });

    const servicesToggle = page.locator('.nav-link[aria-haspopup]', { hasText: 'Szolgáltatásaink' }).first();
    await servicesToggle.click();
    await expect(page.locator('.mega-panel--catalog').first()).toBeVisible();

    await page.setViewportSize({ width: 768, height: 812 });
    await page.waitForTimeout(300);

    await expect(page.locator(SITE_SELECTORS.hamburger)).toBeVisible();

    const navState = await page.evaluate(() => ({
      openItems: document.querySelectorAll('.nav-item.open').length,
      backdropActive: document.getElementById('mega-backdrop')?.classList.contains('active') || false,
    }));

    expect(navState.openItems).toBe(0);
    expect(navState.backdropActive).toBe(false);
  });
});
