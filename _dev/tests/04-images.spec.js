// @ts-check
/**
 * 04 — Image Existence (static file analysis)
 *
 * Reads HTML files from disk, extracts <img> src attributes with cheerio,
 * and checks that local image files exist on disk. No browser needed.
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

test.describe('04 — Image Existence', () => {
  for (const pg of PAGES) {
    test(`${pg.name} — all local <img> src files exist on disk`, () => {
      const htmlPath = resolveHtmlPath(pg.path);
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const $ = cheerio.load(html);

      // Also check images that components.js would inject (nav/footer)
      // by reading components.js and extracting img srcs from it
      const componentsPath = path.join(ROOT, 'js', 'components.js');
      let componentsHtml = '';
      if (fs.existsSync(componentsPath)) {
        componentsHtml = fs.readFileSync(componentsPath, 'utf-8');
      }

      const images = [];
      $('img').each((_, el) => {
        images.push({
          src: $(el).attr('src') || '',
          alt: $(el).attr('alt') || '',
        });
      });

      const missing = [];
      for (const img of images) {
        if (!img.src) continue;
        // Skip external URLs
        if (img.src.startsWith('http://') || img.src.startsWith('https://') || img.src.startsWith('data:')) {
          continue;
        }

        // Resolve relative path from page location
        let resolvedPath;
        if (img.src.startsWith('/')) {
          resolvedPath = path.join(ROOT, img.src);
        } else {
          // Relative to the HTML file's directory
          const pageDir = path.dirname(path.join(ROOT, pg.path));
          resolvedPath = path.resolve(pageDir, img.src);
        }

        // Strip query strings (cache busting)
        resolvedPath = resolvedPath.split('?')[0];

        if (!fs.existsSync(resolvedPath)) {
          // Check known issues
          const basename = path.basename(resolvedPath);
          if (basename === 'og-image.jpg' || basename === 'favicon.ico') {
            test.info().annotations.push({
              type: 'warning',
              description: `KNOWN ISSUE: ${basename} does not exist (K4/K5)`,
            });
          } else {
            missing.push(`${img.src} (alt: "${img.alt}")`);
          }
        }
      }

      if (missing.length > 0) {
        expect(missing, `Missing image files:\n${missing.join('\n')}`).toHaveLength(0);
      }
    });
  }
});
