// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES, SITE_SELECTORS } = require('./helpers/pages');
const { suppressPopup } = require('./helpers/suppress-popup');

function resolveInternalHref(href, pagePath) {
  const url = new URL(href, `http://127.0.0.1:8080${pagePath}`);
  const internalHosts = new Set(['127.0.0.1', 'localhost', 'bagolykaland.hu', 'www.bagolykaland.hu']);
  return internalHosts.has(url.hostname) ? `${url.pathname}${url.search}` : null;
}

test.describe('03 — Broken Links', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60000);

  for (const pg of PAGES) {
    test(`${pg.name} — internal links return 200`, async ({ page, request }) => {
      await suppressPopup(page);
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(SITE_SELECTORS.header, { timeout: 5000 });

      const links = await page.locator('a[href]').evaluateAll((anchors) =>
        anchors.map((a) => ({
          href: a.getAttribute('href'),
          text: a.textContent?.trim().slice(0, 50) || '',
        }))
      );

      const externalLinks = [];
      const internalLinks = [];

      for (const link of links) {
        if (!link.href || link.href.startsWith('#') || link.href.startsWith('mailto:') ||
            link.href.startsWith('tel:') || link.href.startsWith('javascript:')) {
          continue;
        }

        // Internal link — collect for concurrent checking
        try {
          const url = resolveInternalHref(link.href, pg.path);
          if (!url) {
            externalLinks.push(link);
            continue;
          }
          internalLinks.push({ url, text: link.text, href: link.href });
        } catch (e) {
          internalLinks.push({ url: null, text: link.text, href: link.href, error: e.message });
        }
      }

      // Check all internal links concurrently
      const results = [];
      for (const link of internalLinks) {
        if (!link.url) {
          results.push(`${link.href} => ERROR: ${link.error} ("${link.text}")`);
          continue;
        }
        try {
          const response = await request.get(link.url);
          if (response.status() !== 200) {
            results.push(`${link.href} => ${response.status()} ("${link.text}")`);
          }
        } catch (e) {
          results.push(`${link.href} => ERROR: ${e.message} ("${link.text}")`);
        }
      }

      const broken = results.filter(Boolean);

      if (externalLinks.length > 0) {
        test.info().annotations.push({
          type: 'info',
          description: `${externalLinks.length} external links found (not checked)`,
        });
      }

      if (broken.length > 0) {
        expect(broken, `Broken internal links:\n${broken.join('\n')}`).toHaveLength(0);
      }
    });
  }
});
