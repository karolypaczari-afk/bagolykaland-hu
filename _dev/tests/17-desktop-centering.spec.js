// @ts-check
const { test, expect } = require('@playwright/test');
const { suppressPopup } = require('./helpers/suppress-popup');

/**
 * 17 — Desktop Centering & Alignment
 *
 * Ensures images, videos, and key modules are properly centered
 * on desktop viewports. Catches the class of bugs where images
 * appear left-aligned instead of centered in their parent container.
 */

const DESKTOP_WIDTH = 1200;
const DESKTOP_HEIGHT = 900;

/** Landing pages that use the V2 section-image system */
const V2_LANDING_PAGES = [
  { name: 'Hisztikezelés', path: '/pages/hisztikezeles.html' },
  { name: 'Figyelemfejlesztés', path: '/pages/figyelemfejlesztes.html' },
  { name: 'Szorongásoldás', path: '/pages/szorongasoldas.html' },
];

/** Pages with video embeds */
const VIDEO_PAGES = [
  { name: 'Hisztikezelés', path: '/pages/hisztikezeles.html' },
  { name: 'Figyelemfejlesztés', path: '/pages/figyelemfejlesztes.html' },
];

test.describe('17 — Desktop Centering & Alignment', () => {
  test.use({ viewport: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT } });

  for (const pg of V2_LANDING_PAGES) {
    test(`${pg.name} — deep-dive/bridge images centered + no obsolete classes`, async ({ page }) => {
      await suppressPopup(page);
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.nav-menu', { timeout: 5000 });

      // No obsolete image classes
      const oldDeepDiveImages = await page.$$('.v2-deep-dive-image');
      expect(oldDeepDiveImages.length, `${pg.name}: Found obsolete .v2-deep-dive-image`).toBe(0);

      const oldBridgeImages = await page.$$('.v2-bridge-image');
      expect(oldBridgeImages.length, `${pg.name}: Found obsolete .v2-bridge-image`).toBe(0);

      const obsoleteWithImage = await page.$$('.v2-deep-dive-with-image, .v2-bridge-with-image');
      expect(obsoleteWithImage.length, `${pg.name}: Found obsolete -with-image wrappers`).toBe(0);

      // Deep-dive card image centering
      const deepDiveCard = page.locator('.v2-deep-dive-card').first();
      if (await deepDiveCard.count() > 0) {
        const deepDiveImg = deepDiveCard.locator('.v2-section-image').first();
        if (await deepDiveImg.count() > 0) {
          const { cardLeft, cardRight, imgLeft, imgRight } = await page.evaluate(() => {
            const card = document.querySelector('.v2-deep-dive-card');
            const img = card?.querySelector('.v2-section-image');
            if (!card || !img) return { cardLeft: 0, cardRight: 0, imgLeft: 0, imgRight: 0 };
            const cRect = card.getBoundingClientRect();
            const iRect = img.getBoundingClientRect();
            return { cardLeft: cRect.left, cardRight: cRect.right, imgLeft: iRect.left, imgRight: iRect.right };
          });
          const asymmetry = Math.abs((imgLeft - cardLeft) - (cardRight - imgRight));
          expect(asymmetry, `Deep-dive image not centered`).toBeLessThan(5);
        }
      }

      // Bridge card image centering
      const bridgeCard = page.locator('.v2-bridge-card').first();
      if (await bridgeCard.count() > 0) {
        const bridgeImg = bridgeCard.locator('.v2-section-image').first();
        if (await bridgeImg.count() > 0) {
          const { cardLeft, cardRight, imgLeft, imgRight } = await page.evaluate(() => {
            const card = document.querySelector('.v2-bridge-card');
            const img = card?.querySelector('.v2-section-image');
            if (!card || !img) return { cardLeft: 0, cardRight: 0, imgLeft: 0, imgRight: 0 };
            const cRect = card.getBoundingClientRect();
            const iRect = img.getBoundingClientRect();
            return { cardLeft: cRect.left, cardRight: cRect.right, imgLeft: iRect.left, imgRight: iRect.right };
          });
          const asymmetry = Math.abs((imgLeft - cardLeft) - (cardRight - imgRight));
          expect(asymmetry, `Bridge image not centered`).toBeLessThan(5);
        }
      }

      // Bonus grid centering
      const grid = page.locator('.v2-bonuses-grid').first();
      if (await grid.count() > 0) {
        const { parentCenter, gridCenter } = await page.evaluate(() => {
          const g = document.querySelector('.v2-bonuses-grid');
          const parent = g?.parentElement;
          if (!g || !parent) return { parentCenter: 0, gridCenter: 0 };
          const pRect = parent.getBoundingClientRect();
          const gRect = g.getBoundingClientRect();
          return { parentCenter: (pRect.left + pRect.right) / 2, gridCenter: (gRect.left + gRect.right) / 2 };
        });
        const drift = Math.abs(parentCenter - gridCenter);
        expect(drift, `Bonus grid is off-center by ${drift}px`).toBeLessThan(5);
      }
    });
  }

  test.describe('Video embeds are centered', () => {
    for (const pg of VIDEO_PAGES) {
      test(`${pg.name} — video grid is horizontally centered on desktop`, async ({ page }) => {
        await suppressPopup(page);
        await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.nav-menu', { timeout: 5000 });

        const videoGrid = page.locator('.v2-video-grid').first();
        if (await videoGrid.count() === 0) return;

        const { parentCenter, gridCenter } = await page.evaluate(() => {
          const grid = document.querySelector('.v2-video-grid');
          const parent = grid?.parentElement;
          if (!grid || !parent) return { parentCenter: 0, gridCenter: 0 };
          const pRect = parent.getBoundingClientRect();
          const gRect = grid.getBoundingClientRect();
          return { parentCenter: (pRect.left + pRect.right) / 2, gridCenter: (gRect.left + gRect.right) / 2 };
        });

        const drift = Math.abs(parentCenter - gridCenter);
        expect(drift, `Video grid is off-center by ${drift}px`).toBeLessThan(5);
      });
    }
  });
});
