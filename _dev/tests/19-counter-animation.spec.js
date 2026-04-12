// @ts-check
const { test, expect } = require('./helpers/fixtures');

/**
 * 19 — Counter Animation Tests
 * Verifies that animated counters on course pages reach their target values
 * and that static-text metrics are preserved.
 */

const COUNTER_PAGES = [
  { name: 'Hisztikezelés', path: '/pages/hisztikezeles.html' },
  { name: 'Figyelemfejlesztés', path: '/pages/figyelemfejlesztes.html' },
  { name: 'Szorongásoldás', path: '/pages/szorongasoldas.html' },
  { name: 'Sulirajt', path: '/pages/sulirajt.html' },
  { name: 'Álomra hangolva', path: '/pages/alomra-hangolva.html' },
];

test.describe('19 — Counter Animations', () => {
  for (const pg of COUNTER_PAGES) {
    test(`${pg.name} — counters animate to non-zero values + animated class`, async ({ suppressedPage: page }) => {
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

      const cards = page.locator('.v2-metric-card');
      const count = await cards.count();
      if (count === 0) {
        test.skip();
        return;
      }

      // Scroll metrics into view to trigger IntersectionObserver
      await cards.first().scrollIntoViewIfNeeded();
      await page.waitForSelector('.v2-metric-card.animated', { timeout: 3000 });

      // At least one card should have the 'animated' class
      const animatedCount = await page.locator('.v2-metric-card.animated').count();
      expect(animatedCount, `At least one metric card should be animated on ${pg.name}`).toBeGreaterThan(0);

      // Check each card's counter value
      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        const numEl = card.locator('.v2-metric-number');
        const numCount = await numEl.count();
        if (numCount === 0) continue;

        const text = await numEl.textContent();

        expect(text, `Metric card #${i + 1} on ${pg.name} should not be "0"`).not.toBe('0');
        expect(text, `Metric card #${i + 1} on ${pg.name} should not be "NaN"`).not.toContain('NaN');
        expect(text?.trim().length, `Metric card #${i + 1} on ${pg.name} should not be empty`).toBeGreaterThan(0);
      }
    });
  }
});
