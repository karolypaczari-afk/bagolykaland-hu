// @ts-check
/**
 * 20 — Content Image System (static file analysis)
 *
 * Validates image styling rules by reading HTML from disk with cheerio.
 * No browser needed — checks for inline styles and missing attributes.
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

test.describe('20 — Content Image System', () => {

  // -- No inline styles on content images --
  for (const pg of PAGES) {
    test(`${pg.name} — no inline styles on content images`, () => {
      const htmlPath = resolveHtmlPath(pg.path);
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const $ = cheerio.load(html);

      const violations = [];
      $('img[style]').each((_, el) => {
        const style = $(el).attr('style') || '';
        // Allow tracking pixels and hidden images
        if (style.includes('display:none') || style.includes('display: none')) return;
        // Allow tiny tracking imgs (1x1)
        const w = $(el).attr('width');
        const h = $(el).attr('height');
        if (w === '1' && h === '1') return;
        violations.push({
          src: ($(el).attr('src') || '').substring(0, 80),
          style: style.substring(0, 120),
        });
      });

      expect(
        violations,
        `Images with inline styles:\n${JSON.stringify(violations, null, 2)}`
      ).toHaveLength(0);
    });
  }

  // -- No inline styles on image wrapper divs --
  for (const pg of PAGES) {
    test(`${pg.name} — no inline text-align/max-width on image wrappers`, () => {
      const htmlPath = resolveHtmlPath(pg.path);
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const $ = cheerio.load(html);

      const violations = [];
      $('div[style]').each((_, el) => {
        const style = $(el).attr('style') || '';
        const hasImg = $(el).find('img').length > 0;
        if (!hasImg) return;
        if (style.includes('text-align') || style.includes('max-width') || style.includes('border-radius')) {
          const imgSrc = $(el).find('img').first().attr('src') || '';
          violations.push({
            style: style.substring(0, 120),
            imgSrc: imgSrc.substring(0, 60),
          });
        }
      });

      expect(
        violations,
        `Wrapper divs with inline image styles:\n${JSON.stringify(violations, null, 2)}`
      ).toHaveLength(0);
    });
  }

  // -- Content-img class images must have width/height attributes --
  for (const pg of PAGES) {
    test(`${pg.name} — .content-img images have width and height attributes`, () => {
      const htmlPath = resolveHtmlPath(pg.path);
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const $ = cheerio.load(html);

      const missing = [];
      $('img.content-img').each((_, el) => {
        const w = $(el).attr('width');
        const h = $(el).attr('height');
        if (!w || !h) {
          missing.push({
            src: ($(el).attr('src') || '').substring(0, 80),
            hasWidth: !!w,
            hasHeight: !!h,
          });
        }
      });

      expect(
        missing,
        `content-img images without width/height:\n${JSON.stringify(missing, null, 2)}`
      ).toHaveLength(0);
    });
  }
});
