// @ts-check
const { test, expect } = require('./helpers/fixtures');
const { PAGES } = require('./helpers/pages');

test.describe('10 — Performance', () => {
  // Performance assertions need isolated runs; parallel page loads mostly measure
  // local test-runner contention rather than the page itself.
  test.describe.configure({ mode: 'serial' });

  for (const pg of PAGES) {
    test(`${pg.name} — loads under 3s`, async ({ suppressedPage: page }) => {
      const start = Date.now();
      await page.goto(pg.path, { waitUntil: 'load' });
      const loadTime = Date.now() - start;

      expect(loadTime, `Page took ${loadTime}ms to load (max 3000ms)`).toBeLessThan(3000);

      // Also check DOMContentLoaded via Performance API (no extra page load needed)
      const dcl = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0];
        return timing ? Math.round(timing.domContentLoadedEventEnd - timing.startTime) : null;
      });

      if (dcl !== null) {
        expect(dcl, `DOMContentLoaded took ${dcl}ms (max 1500ms)`).toBeLessThan(1500);
      }
    });
  }
});
