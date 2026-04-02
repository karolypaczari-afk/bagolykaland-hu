// @ts-check
/**
 * 00 iOS — Targeted WebKit smoke
 *
 * Purpose:
 * - Keep fast mode lightweight while still checking real iOS/WebKit rendering.
 * - Catch top-frame runtime errors that Chromium can miss.
 * - Verify shared chrome and critical media embeds exist on representative pages.
 *
 * Runs only in the dedicated `webkit-ios` Playwright project.
 */
const { test, expect } = require('./helpers/fixtures');
const { IOS_SMOKE_PAGES } = require('./helpers/pages');

const KNOWN_LOCALHOST_RUNTIME_PATTERNS = [
  /frame with origin "https:\/\/player\.vimeo\.com"/i,
  /protocols must match/i,
];

test.describe('@smoke 00 iOS — WebKit critical render', () => {
  for (const pg of IOS_SMOKE_PAGES) {
    test(`${pg.name} — iPhone Safari/WebKit smoke`, async ({ suppressedPage: page, browserName }) => {
      test.skip(browserName !== 'webkit');

      const runtimeErrors = [];
      page.on('pageerror', (err) => {
        runtimeErrors.push(err.message);
      });

      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.header', { timeout: 5000 });
      await page.waitForSelector('.footer', { timeout: 5000 });

      await expect(page.locator('.nav-toggle')).toBeVisible();

      const bodyOverflow = await page.evaluate(() =>
        document.body.scrollWidth > document.body.clientWidth
      );
      expect(bodyOverflow, 'Body has horizontal overflow on iPhone width').toBe(false);

      const mediaFrame = page.locator('iframe[data-src*="player.vimeo.com/video/"], iframe[src*="player.vimeo.com/video/"]').first();
      if (await mediaFrame.count()) {
        await mediaFrame.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1200);

        const embedState = await mediaFrame.evaluate((el) => ({
          src: el.getAttribute('src') || '',
          dataSrc: el.getAttribute('data-src') || '',
          title: el.getAttribute('title') || '',
        }));

        expect(
          embedState.src.includes('player.vimeo.com/video/') || embedState.dataSrc.includes('player.vimeo.com/video/'),
          `Expected Vimeo embed on ${pg.path}, got ${JSON.stringify(embedState)}`
        ).toBe(true);
      }

      await page.waitForTimeout(5500);

      const actionableErrors = runtimeErrors.filter((message) =>
        !KNOWN_LOCALHOST_RUNTIME_PATTERNS.some((pattern) => pattern.test(message))
      );

      expect(
        actionableErrors,
        `iOS/WebKit runtime errors on ${pg.path}:\n${actionableErrors.join('\n')}`
      ).toEqual([]);
    });
  }
});
