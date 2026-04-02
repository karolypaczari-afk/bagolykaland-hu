// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./helpers/pages');
const { suppressPopup } = require('./helpers/suppress-popup');

test.describe('03 — Broken Links', () => {
  for (const pg of PAGES) {
    test(`${pg.name} — internal links return 200`, async ({ page, request }) => {
      await suppressPopup(page);
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.nav-menu', { timeout: 5000 });

      const links = await page.locator('a[href]').evaluateAll((anchors) =>
        anchors.map((a) => ({
          href: a.getAttribute('href'),
          text: a.textContent?.trim().slice(0, 50) || '',
        }))
      );

      const externalLinks = [];
      const internalLinks = [];

      for (const link of links) {
        if (!link.href || link.href.startsWith('#') || link.href.startsWith('mailto:') || link.href.startsWith('tel:')) {
          continue;
        }

        // External links — flag but don't fail
        if (link.href.startsWith('http://') || link.href.startsWith('https://')) {
          externalLinks.push(link);
          continue;
        }

        // Internal link — collect for concurrent checking
        try {
          let url = new URL(link.href, `http://127.0.0.1:8080${pg.path}`).pathname;
          // Map extensionless URLs to .html (mirrors Apache .htaccess rewrite rules)
          if (!url.includes('.') && url !== '/') {
            const slug = url.replace(/^\//, '').replace(/\/$/, '');
            url = slug === '' ? '/index.html' : `/pages/${slug}.html`;
          }
          internalLinks.push({ url, text: link.text, href: link.href });
        } catch (e) {
          internalLinks.push({ url: null, text: link.text, href: link.href, error: e.message });
        }
      }

      // Check all internal links concurrently
      const results = await Promise.all(
        internalLinks.map(async (link) => {
          if (!link.url) {
            return `${link.href} => ERROR: ${link.error} ("${link.text}")`;
          }
          try {
            const response = await request.get(link.url);
            if (response.status() !== 200) {
              return `${link.href} => ${response.status()} ("${link.text}")`;
            }
          } catch (e) {
            return `${link.href} => ERROR: ${e.message} ("${link.text}")`;
          }
          return null;
        })
      );

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
