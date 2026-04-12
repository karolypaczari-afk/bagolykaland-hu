// @ts-check
/**
 * 23 — Link Target Rules (static file analysis)
 *
 * Validates that internal links do not unexpectedly open new tabs and that
 * external links using a new tab include noopener protection.
 */
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./helpers/pages');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '../..');

function resolveHtmlPath(pagePath) {
  return path.join(ROOT, pagePath);
}

function isInternalHref(href) {
  return (
    href.startsWith('/') ||
    href.startsWith('#') ||
    href.startsWith('./') ||
    href.startsWith('../') ||
    (href.includes('bagolykaland.hu') && !href.startsWith('mailto:') && !href.startsWith('tel:'))
  );
}

test.describe('@a11y 23 — Link Target Rules', () => {
  for (const pageEntry of PAGES) {
    test(`${pageEntry.name} — link target + rel rules`, () => {
      const html = fs.readFileSync(resolveHtmlPath(pageEntry.filePath), 'utf-8');
      const $ = cheerio.load(html);

      // Internal links must not use target="_blank"
      const internalViolations = [];
      $('a[target="_blank"]').each((_, element) => {
        const href = $(element).attr('href') || '';
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        if (isInternalHref(href)) {
          const fileExts = /\.(png|jpe?g|gif|webp|svg|pdf|docx?|xlsx?|zip|mp[34])(\?.*)?$/i;
          if (fileExts.test(href)) return;

          internalViolations.push({
            href,
            text: ($(element).text() || '').trim().substring(0, 80),
          });
        }
      });

      expect(
        internalViolations,
        `Internal links with target="_blank":\n${JSON.stringify(internalViolations, null, 2)}`
      ).toHaveLength(0);

      // External links in new tabs must include rel protection
      const externalViolations = [];
      $('a[href][target="_blank"]').each((_, element) => {
        const href = $(element).attr('href') || '';
        if (!href.startsWith('http://') && !href.startsWith('https://')) return;
        if (href.includes('bagolykaland.hu')) return;

        const rel = $(element).attr('rel') || '';
        const hasNoopener = rel.includes('noopener');
        const hasNoreferrer = rel.includes('noreferrer');

        if (!hasNoopener || !hasNoreferrer) {
          externalViolations.push({
            href,
            text: ($(element).text() || '').trim().substring(0, 80),
            rel,
          });
        }
      });

      expect(
        externalViolations,
        `External target="_blank" links missing rel protection:\n${JSON.stringify(externalViolations, null, 2)}`
      ).toHaveLength(0);
    });
  }
});
