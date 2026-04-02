// @ts-check
/**
 * 13 — Global Component Structure
 *
 * Static analysis of HTML files to ensure every page has the required
 * global elements: #site-nav, #site-footer, components.js, main.js,
 * Google Analytics, Microsoft Clarity, and Meta Pixel.
 *
 * These tests catch missing includes BEFORE deployment — even for newly
 * created pages.
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/** Recursively find all .html files, excluding _dev/ directory */
function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_dev' || entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'playwright-report' || entry.name === 'test-results') continue;
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html') && !entry.name.startsWith('v8kk3one7bp2yfhjq6fx0ievepeh2p')) {
      results.push(fullPath);
    }
  }
  return results;
}

const ROOT = path.resolve(__dirname, '..', '..');
const allHtmlFiles = findHtmlFiles(ROOT).map(f => ({
  abs: f,
  rel: path.relative(ROOT, f).replace(/\\/g, '/'),
}));

test.describe('@smoke 13 — Global Component Structure (static HTML check)', () => {
  for (const file of allHtmlFiles) {
    test(`${file.rel} — all global component checks`, () => {
      const html = fs.readFileSync(file.abs, 'utf-8');

      // has #site-nav placeholder
      expect(html).toContain('id="site-nav"');

      // has #site-footer placeholder
      expect(html).toContain('id="site-footer"');

      // includes components.js
      expect(html).toMatch(/components\.js/);

      // includes main.js
      expect(html).toMatch(/main\.js/);

      // includes Google Analytics (gtag.js)
      expect(html).toContain('G-TKJGRVCHCS');

      // includes Microsoft Clarity
      expect(html).toContain('clarity');
      expect(html).toContain('rku8ogc8xf');

      // includes Meta Pixel
      expect(html).toContain('facebook-pixel');

      // components.js is loaded before main.js
      const componentsIdx = html.indexOf('components.js');
      const mainIdx = html.indexOf('main.js');
      expect(componentsIdx).toBeGreaterThan(-1);
      expect(mainIdx).toBeGreaterThan(-1);
      expect(componentsIdx).toBeLessThan(mainIdx);

      // #site-nav appears before <main>
      const navIdx = html.indexOf('id="site-nav"');
      const mainTagIdx = html.indexOf('<main');
      expect(navIdx).toBeGreaterThan(-1);
      if (mainTagIdx > -1) {
        expect(navIdx).toBeLessThan(mainTagIdx);
      }

      // viewport meta has viewport-fit=cover
      expect(html).toContain('viewport-fit=cover');
    });
  }
});
