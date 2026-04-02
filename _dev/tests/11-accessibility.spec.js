// @ts-check
const { test, expect } = require('./helpers/fixtures');
const AxeBuilder = require('@axe-core/playwright').default;
const { PAGES, SITE_SELECTORS } = require('./helpers/pages');

test.describe('@a11y 11 — Accessibility', () => {
  // axe scans are expensive DOM traversals; parallel execution mostly causes
  // runner timeouts instead of surfacing real accessibility regressions.
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60000);

  for (const pg of PAGES) {
    // Single page load: run all a11y checks (axe-core + alt text + skip link)
    test(`${pg.name} — WCAG 2.1 AA + images + skip link`, async ({ suppressedPage: page }) => {
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(SITE_SELECTORS.header, { timeout: 5000 });

      // Make all scroll-animated elements visible so axe checks their real contrast
      await page.addStyleTag({ content: `
        .animate-on-scroll,
        .card-animate,
        [class*="-reveal"] {
          opacity: 1 !important;
          transform: translateY(0) !important;
          transition: none !important;
        }
      ` });
      // Ensure closed mega-menus are fully hidden from axe
      await page.addStyleTag({ content: '.mega-menu { display: none !important; } .dropdown:hover .mega-menu, .dropdown.active .mega-menu { display: grid !important; }' });

      // 1. axe-core WCAG scan
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      const minor = results.violations.filter(
        (v) => v.impact !== 'serious' && v.impact !== 'critical'
      );

      if (minor.length > 0) {
        test.info().annotations.push({
          type: 'warning',
          description: `${minor.length} minor a11y issues: ${minor.map((v) => v.id).join(', ')}`,
        });
      }

      if (serious.length > 0) {
        const details = serious
          .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`)
          .join('\n');
        expect(serious, `Serious a11y violations:\n${details}`).toHaveLength(0);
      }

      // 2. All images have alt text
      const missingAlt = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        const missing = [];
        imgs.forEach((img) => {
          if (!img.hasAttribute('alt')) {
            missing.push(img.src);
          }
        });
        return missing;
      });
      expect(missingAlt, `Images without alt: ${missingAlt.join(', ')}`).toHaveLength(0);

      // 3. Skip link exists
      const skipLink = page.locator('.skip-link');
      await expect(skipLink).toHaveCount(1);
      const href = await skipLink.getAttribute('href');
      expect(href).toBe('#main-content');
    });
  }
});
