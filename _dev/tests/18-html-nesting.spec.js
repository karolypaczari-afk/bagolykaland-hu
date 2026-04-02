/**
 * 18 — HTML Nesting Validation
 * Prevents broken div nesting that causes layout issues
 * (e.g., hero images falling outside CSS grid containers).
 */
const { test, expect } = require('./helpers/fixtures');
const { PAGES } = require('./helpers/pages');

for (const pg of PAGES) {
  test(`@smoke 18 — HTML Nesting › ${pg.name} — hero grid children are inside grid`, async ({ suppressedPage: page }) => {
    await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

    // Check: .v2-hero-image must be a direct child of .v2-hero-grid (if both exist)
    const heroImageOutsideGrid = await page.evaluate(() => {
      const images = document.querySelectorAll('.v2-hero-image');
      const errors = [];
      images.forEach(img => {
        const parent = img.parentElement;
        if (!parent || !parent.classList.contains('v2-hero-grid')) {
          errors.push(
            `.v2-hero-image parent is <${parent ? parent.tagName.toLowerCase() : 'null'} class="${parent ? parent.className : ''}">, expected .v2-hero-grid`
          );
        }
      });
      return errors;
    });

    expect(heroImageOutsideGrid, 'Hero image must be direct child of .v2-hero-grid').toHaveLength(0);

    // Check: .v2-hero-content must be a direct child of .v2-hero-grid (if both exist)
    const heroContentOutsideGrid = await page.evaluate(() => {
      const contents = document.querySelectorAll('.v2-hero-content');
      const errors = [];
      contents.forEach(el => {
        const parent = el.parentElement;
        if (!parent || !parent.classList.contains('v2-hero-grid')) {
          errors.push(
            `.v2-hero-content parent is <${parent ? parent.tagName.toLowerCase() : 'null'} class="${parent ? parent.className : ''}">, expected .v2-hero-grid`
          );
        }
      });
      return errors;
    });

    expect(heroContentOutsideGrid, 'Hero content must be direct child of .v2-hero-grid').toHaveLength(0);
  });

  test(`@smoke 18 — HTML Nesting › ${pg.name} — no orphaned elements between grid children`, async ({ suppressedPage: page }) => {
    await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

    // Check: .v2-hero-grid should only contain .v2-hero-content and .v2-hero-image as direct children
    const orphanedChildren = await page.evaluate(() => {
      const grids = document.querySelectorAll('.v2-hero-grid');
      const errors = [];
      grids.forEach(grid => {
        const children = Array.from(grid.children);
        children.forEach(child => {
          const isContent = child.classList.contains('v2-hero-content');
          const isImage = child.classList.contains('v2-hero-image');
          if (!isContent && !isImage) {
            errors.push(
              `Unexpected child in .v2-hero-grid: <${child.tagName.toLowerCase()} class="${child.className}">`
            );
          }
        });
      });
      return errors;
    });

    expect(orphanedChildren, 'v2-hero-grid should only contain v2-hero-content and v2-hero-image').toHaveLength(0);
  });
}
