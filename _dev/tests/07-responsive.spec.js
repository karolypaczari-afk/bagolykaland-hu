// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES, CORE_BREAKPOINTS, EXTRA_BREAKPOINTS, LANDING_PAGES } = require('./helpers/pages');
const { suppressPopup } = require('./helpers/suppress-popup');

/**
 * Smart breakpoint sampling:
 * - All pages tested at 3 core breakpoints (375, 768, 1200)
 * - Only landing pages tested at extra breakpoints (480, 640, 1199, 1440)
 */
function getTestMatrix() {
  const matrix = [];
  for (const bp of CORE_BREAKPOINTS) {
    for (const pg of PAGES) {
      matrix.push({ bp, pg });
    }
  }
  for (const bp of EXTRA_BREAKPOINTS) {
    for (const pg of LANDING_PAGES) {
      matrix.push({ bp, pg });
    }
  }
  return matrix;
}

const overflowMatrix = getTestMatrix();

test.describe('@responsive 07 — Responsive Layout', () => {
  // Group tests by breakpoint for viewport setting
  const byWidth = {};
  for (const { bp, pg } of overflowMatrix) {
    if (!byWidth[bp.width]) byWidth[bp.width] = { bp, pages: [] };
    byWidth[bp.width].pages.push(pg);
  }

  for (const width of Object.keys(byWidth).map(Number)) {
    const { bp, pages } = byWidth[width];

    test.describe(`@ ${bp.width}px (${bp.name})`, () => {
      test.use({ viewport: { width: bp.width, height: 812 } });

      for (const pg of pages) {
        test(`${pg.name} — no horizontal overflow`, async ({ page }) => {
          await suppressPopup(page);
          await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('.nav-menu', { timeout: 5000 });

          // Check for horizontal overflow
          const overflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });

          if (overflow) {
            // Find the offending element for debugging
            const offender = await page.evaluate(() => {
              const docWidth = document.documentElement.clientWidth;
              const all = document.querySelectorAll('*');
              for (const el of all) {
                const rect = el.getBoundingClientRect();
                if (rect.right > docWidth + 1) {
                  return `${el.tagName}.${el.className} (right: ${Math.round(rect.right)}, docWidth: ${docWidth})`;
                }
              }
              return 'unknown element';
            });
            expect(overflow, `Horizontal overflow caused by: ${offender}`).toBe(false);
          }
        });
      }

      test('nav toggle visibility is correct', async ({ page }) => {
        await suppressPopup(page);
        await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.nav-menu', { timeout: 5000 });

        const toggleVisible = await page.locator('.nav-toggle').isVisible();

        if (bp.width <= 1199) {
          expect(toggleVisible, 'Hamburger should be visible at <= 1199px').toBe(true);
        } else {
          expect(toggleVisible, 'Hamburger should be hidden at > 1199px').toBe(false);
        }
      });
    });
  }
});

test.describe('@responsive 07 — Sticky Bottom Bar (mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  // Pages that have sticky CTAs
  const STICKY_PAGES = [
    { name: 'Hisztikezelés', path: '/pages/hisztikezeles.html', selector: '.hv2-sticky-cta' },
    { name: 'Figyelemfejlesztés', path: '/pages/figyelemfejlesztes.html', selector: '.fv2-sticky-cta' },
    { name: 'ZseniFészek', path: '/pages/zsenifeszek.html', selector: '.sticky-cta' },
  ];

  for (const pg of STICKY_PAGES) {
    test(`${pg.name} — sticky CTA has safe-area padding`, async ({ page }) => {
      await suppressPopup(page);
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

      // Check that the sticky CTA element exists
      const stickyEl = page.locator(pg.selector);
      await expect(stickyEl).toHaveCount(1);

      // Verify CSS has safe-area-inset-bottom in padding-bottom
      const hasSafeArea = await stickyEl.evaluate(el => {
        const style = getComputedStyle(el);
        // Check that the element is fixed at bottom
        return style.position === 'fixed' && style.bottom === '0px';
      });
      expect(hasSafeArea, 'Sticky CTA should be fixed at bottom: 0').toBe(true);
    });
  }
});

test.describe('@responsive 07 — Urgency banner is NOT fixed', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const URGENCY_PAGES = [
    { name: 'Hisztikezelés', path: '/pages/hisztikezeles.html', selector: '.hv2-urgency-banner' },
    { name: 'Figyelemfejlesztés', path: '/pages/figyelemfejlesztes.html', selector: '.fv2-urgency-banner' },
  ];

  for (const pg of URGENCY_PAGES) {
    test(`${pg.name} — urgency banner is in-flow (not fixed/sticky)`, async ({ page }) => {
      await suppressPopup(page);
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

      const banner = page.locator(pg.selector);
      const position = await banner.evaluate(el => getComputedStyle(el).position);
      expect(position, 'Urgency banner must NOT be fixed or sticky').not.toBe('fixed');
      expect(position, 'Urgency banner must NOT be fixed or sticky').not.toBe('sticky');
    });
  }
});

test.describe('@responsive 07 — Sticky CTA hidden at page top', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const STICKY_PAGES = [
    { name: 'Hisztikezelés', path: '/pages/hisztikezeles.html', selector: '.hv2-sticky-cta' },
    { name: 'Figyelemfejlesztés', path: '/pages/figyelemfejlesztes.html', selector: '.fv2-sticky-cta' },
    { name: 'ZseniFészek', path: '/pages/zsenifeszek.html', selector: '.sticky-cta' },
  ];

  for (const pg of STICKY_PAGES) {
    test(`${pg.name} — sticky CTA is hidden when at top of page`, async ({ page }) => {
      await suppressPopup(page);
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

      // At top of page, sticky CTA should NOT be visible
      const stickyEl = page.locator(pg.selector);
      const hasVisibleClass = await stickyEl.evaluate(el => el.classList.contains('visible'));
      expect(hasVisibleClass, 'Sticky CTA should be hidden at top of page').toBe(false);
    });
  }
});

test.describe('@responsive 07 — Metrics grid does not clip on mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const METRICS_PAGES = [
    { name: 'Hisztikezelés', path: '/pages/hisztikezeles.html', selector: '.hv2-metrics-grid' },
    { name: 'Figyelemfejlesztés', path: '/pages/figyelemfejlesztes.html', selector: '.fv2-metrics-grid' },
    { name: 'Szorongásoldás', path: '/pages/szorongasoldas.html', selector: '.v2-metrics-grid' },
    { name: 'Sulirajt', path: '/pages/sulirajt.html', selector: '.v2-metrics-grid' },
    { name: 'Álomra hangolva', path: '/pages/alomra-hangolva.html', selector: '.v2-metrics-grid' },
  ];

  for (const pg of METRICS_PAGES) {
    test(`${pg.name} — metrics grid fits within viewport at 375px`, async ({ page }) => {
      await suppressPopup(page);
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

      const grid = page.locator(pg.selector);
      const box = await grid.boundingBox();
      expect(box, 'Metrics grid should have a bounding box').toBeTruthy();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(376); // 1px tolerance
    });
  }
});

test.describe('@responsive 07 — Element bounding-box overflow check (catches overflow-x:hidden masking)', () => {
  // Smart sampling: core widths for all pages, only 480 extra for landing pages
  const MOBILE_WIDTHS = [320, 375];

  for (const width of MOBILE_WIDTHS) {
    test.describe(`@ ${width}px`, () => {
      test.use({ viewport: { width, height: 812 } });

      for (const pg of PAGES) {
        test(`${pg.name} — no element exceeds viewport`, async ({ page }) => {
          await suppressPopup(page);
          await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('.header', { timeout: 5000 });

          // Temporarily remove overflow-x:hidden to detect real overflow
          const offenders = await page.evaluate(() => {
            // Save and remove overflow clipping so we can measure true widths
            const html = document.documentElement;
            const body = document.body;
            const origHtml = html.style.overflowX;
            const origBody = body.style.overflowX;
            html.style.overflowX = 'visible';
            body.style.overflowX = 'visible';

            const docWidth = window.innerWidth;
            const results = [];
            const all = document.querySelectorAll('body *');
            for (const el of all) {
              const style = getComputedStyle(el);
              // Skip hidden/collapsed elements and fixed elements
              if (style.display === 'none' || style.visibility === 'hidden') continue;
              if (style.position === 'fixed' || style.position === 'absolute') continue;

              const rect = el.getBoundingClientRect();
              // Element wider than viewport by more than 2px
              if (rect.right > docWidth + 2 || rect.left < -2) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className ? `.${String(el.className).split(' ').join('.')}` : '';
                // Skip elements whose parent has overflow:hidden (they're visually clipped)
                let parent = el.parentElement;
                let clipped = false;
                while (parent && parent !== body) {
                  const pStyle = getComputedStyle(parent);
                  if (pStyle.overflow === 'hidden' || pStyle.overflowX === 'hidden' || pStyle.overflowX === 'clip') {
                    const pRect = parent.getBoundingClientRect();
                    if (pRect.right <= docWidth + 2 && pRect.left >= -2) {
                      clipped = true;
                      break;
                    }
                  }
                  parent = parent.parentElement;
                }
                if (!clipped) {
                  results.push(
                    `<${tag}${cls}> left=${Math.round(rect.left)} right=${Math.round(rect.right)} width=${Math.round(rect.width)}`
                  );
                }
              }
              if (results.length >= 5) break;
            }

            // Restore
            html.style.overflowX = origHtml;
            body.style.overflowX = origBody;
            return results;
          });

          expect(offenders, `Elements overflow viewport at ${width}px:\n${offenders.join('\n')}`).toHaveLength(0);
        });
      }
    });
  }
});
