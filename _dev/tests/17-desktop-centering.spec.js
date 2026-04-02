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
  test.describe('Section images in deep-dive and bridge cards', () => {
    for (const pg of V2_LANDING_PAGES) {
      test(`${pg.name} — deep-dive/bridge images use v2-section-image class`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT },
        });
        const page = await context.newPage();
        await suppressPopup(page);
        await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.nav-menu', { timeout: 5000 });

        // Check deep-dive card images use standardized class
        const deepDiveImages = await page.$$('.v2-deep-dive-card .v2-section-image');
        const oldDeepDiveImages = await page.$$('.v2-deep-dive-image');

        expect(
          oldDeepDiveImages.length,
          `${pg.name}: Found obsolete .v2-deep-dive-image class — should use .v2-section-image`
        ).toBe(0);

        // Check bridge card images use standardized class
        const bridgeImages = await page.$$('.v2-bridge-card .v2-section-image');
        const oldBridgeImages = await page.$$('.v2-bridge-image');

        expect(
          oldBridgeImages.length,
          `${pg.name}: Found obsolete .v2-bridge-image class — should use .v2-section-image`
        ).toBe(0);

        await context.close();
      });

      test(`${pg.name} — deep-dive card image is horizontally centered`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT },
        });
        const page = await context.newPage();
        await suppressPopup(page);
        await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.nav-menu', { timeout: 5000 });

        const card = page.locator('.v2-deep-dive-card').first();
        if (await card.count() === 0) return;

        const img = card.locator('.v2-section-image').first();
        if (await img.count() === 0) return;

        const { cardLeft, cardRight, imgLeft, imgRight } = await page.evaluate(() => {
          const card = document.querySelector('.v2-deep-dive-card');
          const img = card?.querySelector('.v2-section-image');
          if (!card || !img) return { cardLeft: 0, cardRight: 0, imgLeft: 0, imgRight: 0 };
          const cRect = card.getBoundingClientRect();
          const iRect = img.getBoundingClientRect();
          return {
            cardLeft: cRect.left,
            cardRight: cRect.right,
            imgLeft: iRect.left,
            imgRight: iRect.right,
          };
        });

        // Image should span card width (flush/bleed) or be centered
        // The v2-section-image in deep-dive bleeds to edges, so margins should be symmetric
        const leftMargin = imgLeft - cardLeft;
        const rightMargin = cardRight - imgRight;
        const asymmetry = Math.abs(leftMargin - rightMargin);

        expect(
          asymmetry,
          `Deep-dive image is not centered: left margin ${leftMargin}px, right margin ${rightMargin}px`
        ).toBeLessThan(5);

        await context.close();
      });

      test(`${pg.name} — bridge card image is horizontally centered`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT },
        });
        const page = await context.newPage();
        await suppressPopup(page);
        await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.nav-menu', { timeout: 5000 });

        const card = page.locator('.v2-bridge-card').first();
        if (await card.count() === 0) return;

        const img = card.locator('.v2-section-image').first();
        if (await img.count() === 0) return;

        const { cardLeft, cardRight, imgLeft, imgRight } = await page.evaluate(() => {
          const card = document.querySelector('.v2-bridge-card');
          const img = card?.querySelector('.v2-section-image');
          if (!card || !img) return { cardLeft: 0, cardRight: 0, imgLeft: 0, imgRight: 0 };
          const cRect = card.getBoundingClientRect();
          const iRect = img.getBoundingClientRect();
          return {
            cardLeft: cRect.left,
            cardRight: cRect.right,
            imgLeft: iRect.left,
            imgRight: iRect.right,
          };
        });

        const leftMargin = imgLeft - cardLeft;
        const rightMargin = cardRight - imgRight;
        const asymmetry = Math.abs(leftMargin - rightMargin);

        expect(
          asymmetry,
          `Bridge image is not centered: left margin ${leftMargin}px, right margin ${rightMargin}px`
        ).toBeLessThan(5);

        await context.close();
      });
    }
  });

  test.describe('Video embeds are centered', () => {
    for (const pg of VIDEO_PAGES) {
      test(`${pg.name} — video grid is horizontally centered on desktop`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT },
        });
        const page = await context.newPage();
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
          return {
            parentCenter: (pRect.left + pRect.right) / 2,
            gridCenter: (gRect.left + gRect.right) / 2,
          };
        });

        const drift = Math.abs(parentCenter - gridCenter);
        expect(
          drift,
          `Video grid is off-center by ${drift}px`
        ).toBeLessThan(5);

        await context.close();
      });
    }
  });

  test.describe('No obsolete image wrapper classes in HTML', () => {
    for (const pg of V2_LANDING_PAGES) {
      test(`${pg.name} — no v2-deep-dive-with-image or v2-bridge-with-image classes`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT },
        });
        const page = await context.newPage();
        await suppressPopup(page);
        await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

        const obsoleteWithImage = await page.$$('.v2-deep-dive-with-image, .v2-bridge-with-image');
        expect(
          obsoleteWithImage.length,
          `${pg.name}: Found obsolete -with-image grid wrapper classes that break desktop centering`
        ).toBe(0);

        await context.close();
      });
    }
  });

  test.describe('Bonus images are centered in grid', () => {
    for (const pg of V2_LANDING_PAGES) {
      test(`${pg.name} — bonus grid is centered on desktop`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT },
        });
        const page = await context.newPage();
        await suppressPopup(page);
        await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.nav-menu', { timeout: 5000 });

        const grid = page.locator('.v2-bonuses-grid').first();
        if (await grid.count() === 0) return;

        const { parentCenter, gridCenter } = await page.evaluate(() => {
          const grid = document.querySelector('.v2-bonuses-grid');
          const parent = grid?.parentElement;
          if (!grid || !parent) return { parentCenter: 0, gridCenter: 0 };
          const pRect = parent.getBoundingClientRect();
          const gRect = grid.getBoundingClientRect();
          return {
            parentCenter: (pRect.left + pRect.right) / 2,
            gridCenter: (gRect.left + gRect.right) / 2,
          };
        });

        const drift = Math.abs(parentCenter - gridCenter);
        expect(
          drift,
          `Bonus grid is off-center by ${drift}px`
        ).toBeLessThan(5);

        await context.close();
      });
    }
  });
});
