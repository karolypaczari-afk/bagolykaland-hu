// @ts-check
/**
 * 23 — Link Target Rules (static file analysis)
 *
 * Validates link target attributes by reading HTML files from disk.
 * No browser needed — pure static analysis with cheerio.
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

test.describe('@a11y 23 — Link Target Rules', () => {
  for (const pg of PAGES) {
    test(`${pg.name} — kepzes.zsenibagoly.hu links must NOT have target="_blank"`, () => {
      const htmlPath = resolveHtmlPath(pg.path);
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const $ = cheerio.load(html);

      const violations = [];
      $('a[href*="kepzes.zsenibagoly.hu"]').each((_, el) => {
        if ($(el).attr('target') === '_blank') {
          violations.push({
            href: $(el).attr('href'),
            text: ($(el).text() || '').trim().substring(0, 80),
          });
        }
      });

      expect(
        violations,
        `Purchase flow links with target="_blank":\n${JSON.stringify(violations, null, 2)}`
      ).toHaveLength(0);
    });

    test(`${pg.name} — internal links must NOT have target="_blank"`, () => {
      const htmlPath = resolveHtmlPath(pg.path);
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const $ = cheerio.load(html);

      const violations = [];
      $('a[target="_blank"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        // Skip external links — only check internal ones
        if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
        // Skip kepzes links (covered by separate test)
        if (href.includes('kepzes.zsenibagoly.hu')) return;

        const isInternal =
          href.startsWith('/') ||
          href.startsWith('#') ||
          href.startsWith('./') ||
          href.startsWith('../') ||
          (href.includes('zsenibagoly.hu') && !href.includes('kepzes.zsenibagoly.hu'));

        if (isInternal) {
          // Exception: GDPR/privacy links inside form labels may use target="_blank"
          const insideLabel = $(el).closest('label, .form-label, .checkbox-label, .consent-label').length > 0;
          const isGdprLink =
            href.includes('adatkezelesi') ||
            href.includes('cookie') ||
            href.includes('aszf') ||
            href.includes('szerzoi-jogi');
          if (insideLabel && isGdprLink) return;

          // Exception: downloadable file links (images, PDFs, etc.) may use target="_blank"
          const fileExts = /\.(png|jpe?g|gif|webp|svg|pdf|docx?|xlsx?|zip|mp[34])(\?.*)?$/i;
          if (fileExts.test(href) || href.includes('wp-content/uploads')) return;

          violations.push({
            href,
            text: ($(el).text() || '').trim().substring(0, 80),
          });
        }
      });

      expect(
        violations,
        `Internal links with target="_blank":\n${JSON.stringify(violations, null, 2)}`
      ).toHaveLength(0);
    });

    test(`${pg.name} — external links should have target="_blank" and rel="noopener" (warning)`, () => {
      const htmlPath = resolveHtmlPath(pg.path);
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const $ = cheerio.load(html);

      const warnings = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        // Only check external http(s) links
        if (!href.startsWith('http://') && !href.startsWith('https://')) return;
        // Skip zsenibagoly.hu domains — those are internal
        if (href.includes('zsenibagoly.hu')) return;

        const target = $(el).attr('target');
        const rel = $(el).attr('rel') || '';
        const hasBlank = target === '_blank';
        const hasNoopener = rel.includes('noopener');

        if (!hasBlank || !hasNoopener) {
          warnings.push({
            href,
            text: ($(el).text() || '').trim().substring(0, 80),
            missingBlank: !hasBlank,
            missingNoopener: !hasNoopener,
          });
        }
      });

      if (warnings.length > 0) {
        console.warn(
          `[WARNING] ${pg.name}: ${warnings.length} external link(s) missing target="_blank" or rel="noopener":\n` +
            warnings.map(w => `  - ${w.href} (blank: ${!w.missingBlank}, noopener: ${!w.missingNoopener})`).join('\n')
        );
      }
      // This is a warning, not a hard failure — no expect() assertion
    });
  }
});
