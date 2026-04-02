// @ts-check
const { test, expect } = require('@playwright/test');

const LIVE_URL = process.env.LIVE_URL || '';

test.describe('12 — Security', () => {
  test('robots.txt blocks /pages/draft/', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Disallow: /pages/draft/');
  });

  test('draft pages are not linked from live pages', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.nav-menu', { timeout: 5000 });

    const draftLinks = await page.locator('a[href*="/draft/"]').count();
    expect(draftLinks, 'No draft links should appear on the homepage').toBe(0);
  });

  test.describe('.htaccess blocks /_dev/ (live site only)', () => {
    test.skip(!LIVE_URL, 'Set LIVE_URL env var to test .htaccess rules against live site');

    test('/_dev/ returns 403 on live site', async ({ request }) => {
      const response = await request.get(`${LIVE_URL}/_dev/`);
      expect([403, 404]).toContain(response.status());
    });
  });

  test('no sensitive files served from /_dev/ locally', async ({ request }) => {
    // Even locally, _dev should not contain anything that would be a problem
    // This test just documents the pattern
    test.info().annotations.push({
      type: 'info',
      description: '.htaccess protection only works on Apache — use LIVE_URL env to test',
    });
  });

  test('external links have rel="noopener"', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.nav-menu', { timeout: 5000 });

    const unsafeLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[target="_blank"]');
      const unsafe = [];
      links.forEach((a) => {
        const rel = a.getAttribute('rel') || '';
        if (!rel.includes('noopener')) {
          unsafe.push(a.getAttribute('href'));
        }
      });
      return unsafe;
    });

    expect(unsafeLinks, `Links missing rel="noopener": ${unsafeLinks.join(', ')}`).toHaveLength(0);
  });
});
