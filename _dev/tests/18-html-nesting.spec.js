/**
 * 18 — HTML Nesting Validation
 * Prevents broken div nesting that causes layout issues
 * (e.g., hero images falling outside CSS grid containers).
 */
const { test, expect } = require('./helpers/fixtures');
const { PAGES } = require('./helpers/pages');

for (const pg of PAGES) {
  test(`@smoke 18 — HTML Nesting › ${pg.name} — hero grid nesting is valid`, async ({ suppressedPage: page }) => {
    await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

    // Only check pages that actually use v2-hero-grid
    const hasGrid = await page.locator('.v2-hero-grid').count();
    if (hasGrid === 0) return;

    // .v2-hero-image and .v2-hero-content must be direct children of .v2-hero-grid
    const errors = await page.evaluate(() => {
      const issues = [];
      const grids = document.querySelectorAll('.v2-hero-grid');

      grids.forEach(grid => {
        // Check images
        document.querySelectorAll('.v2-hero-image').forEach(img => {
          if (img.parentElement !== grid) {
            issues.push(`.v2-hero-image parent is <${img.parentElement?.tagName.toLowerCase()}>, expected .v2-hero-grid`);
          }
        });
        // Check content
        document.querySelectorAll('.v2-hero-content').forEach(el => {
          if (el.parentElement !== grid) {
            issues.push(`.v2-hero-content parent is <${el.parentElement?.tagName.toLowerCase()}>, expected .v2-hero-grid`);
          }
        });
        // Check for orphaned children
        Array.from(grid.children).forEach(child => {
          if (!child.classList.contains('v2-hero-content') && !child.classList.contains('v2-hero-image')) {
            issues.push(`Unexpected child in .v2-hero-grid: <${child.tagName.toLowerCase()} class="${child.className}">`);
          }
        });
      });

      return issues;
    });

    expect(errors, 'Hero grid nesting issues').toHaveLength(0);
  });
}
