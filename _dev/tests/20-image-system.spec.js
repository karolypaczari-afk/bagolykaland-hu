// @ts-check
/**
 * 20 — Content Image System (static file analysis)
 *
 * Focus on high-signal image guarantees for the current site:
 * - local content images have alt text
 * - local content images include width/height attributes
 * - hero/LCP images are not lazily loaded
 */
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./helpers/pages');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '../..');

function resolveHtmlPath(filePath) {
  return path.join(ROOT, filePath);
}

function isLocalImage(src) {
  return src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:');
}

test.describe('20 — Content Image System', () => {
  for (const pageEntry of PAGES) {
    test(`${pageEntry.name} — local images have alt text + width/height`, () => {
      const html = fs.readFileSync(resolveHtmlPath(pageEntry.filePath), 'utf-8');
      const $ = cheerio.load(html);
      const missingAlt = [];
      const missingDims = [];

      $('img[src]').each((_, element) => {
        const src = $(element).attr('src') || '';
        if (!isLocalImage(src)) return;

        const alt = $(element).attr('alt');
        if (typeof alt !== 'string' || alt.trim().length === 0) {
          missingAlt.push(src);
        }

        const width = $(element).attr('width');
        const height = $(element).attr('height');
        if (!width || !height) {
          missingDims.push({ src, hasWidth: Boolean(width), hasHeight: Boolean(height) });
        }
      });

      expect(missingAlt, `Images missing alt text:\n${missingAlt.join('\n')}`).toHaveLength(0);
      expect(missingDims, `Images without width/height:\n${JSON.stringify(missingDims, null, 2)}`).toHaveLength(0);
    });
  }

  test('homepage hero image is not lazily loaded', () => {
    const html = fs.readFileSync(resolveHtmlPath('index.html'), 'utf-8');
    const $ = cheerio.load(html);
    const heroImage = $('.hero img').first();

    expect(heroImage.length, 'Homepage should include a hero image').toBe(1);
    expect(heroImage.attr('loading') || '').not.toBe('lazy');
    expect(heroImage.attr('fetchpriority') || '').toBe('high');
  });
});
