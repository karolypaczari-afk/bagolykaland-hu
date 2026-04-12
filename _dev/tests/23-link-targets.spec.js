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
    test(`${pageEntry.name} — internal links must not use target="_blank"`, () => {
      const html = fs.readFileSync(resolveHtmlPath(pageEntry.filePath), 'utf-8');
      const $ = cheerio.load(html);
      const violations = [];

      $('a[target="_blank"]').each((_, element) => {
        const href = $(element).attr('href') || '';
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        if (isInternalHref(href)) {
          const fileExts = /\.(png|jpe?g|gif|webp|svg|pdf|docx?|xlsx?|zip|mp[34])(\?.*)?$/i;
          if (fileExts.test(href)) return;

          violations.push({
            href,
            text: ($(element).text() || '').trim().substring(0, 80),
          });
        }
      });

      expect(
        violations,
        `Internal links with target="_blank":\n${JSON.stringify(violations, null, 2)}`
      ).toHaveLength(0);
    });

    test(`${pageEntry.name} — external links opened in new tabs include rel protection`, () => {
      const html = fs.readFileSync(resolveHtmlPath(pageEntry.filePath), 'utf-8');
      const $ = cheerio.load(html);
      const violations = [];

      $('a[href][target="_blank"]').each((_, element) => {
        const href = $(element).attr('href') || '';
        if (!href.startsWith('http://') && !href.startsWith('https://')) return;
        if (href.includes('bagolykaland.hu')) return;

        const rel = $(element).attr('rel') || '';
        const hasNoopener = rel.includes('noopener');
        const hasNoreferrer = rel.includes('noreferrer');

        if (!hasNoopener || !hasNoreferrer) {
          violations.push({
            href,
            text: ($(element).text() || '').trim().substring(0, 80),
            rel,
          });
        }
      });

      expect(
        violations,
        `External target="_blank" links missing rel protection:\n${JSON.stringify(violations, null, 2)}`
      ).toHaveLength(0);
    });
  }
});
