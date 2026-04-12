// @ts-check
/**
 * 13 — Global Component Structure
 *
 * Static analysis of HTML files to ensure every page includes the shared
 * component mounts, app-install shell and tracking scaffold.
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir) {
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['.git', '_dev', 'node_modules', 'playwright-report', 'test-results'].includes(entry.name)) {
        continue;
      }
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }

  return results;
}

const ROOT = path.resolve(__dirname, '..', '..');
const htmlFiles = findHtmlFiles(ROOT).map((filePath) => ({
  abs: filePath,
  rel: path.relative(ROOT, filePath).replace(/\\/g, '/'),
}));

test.describe('@smoke 13 — Global Component Structure (static HTML check)', () => {
  for (const file of htmlFiles) {
    test(`${file.rel} includes the shared site shell`, () => {
      const html = fs.readFileSync(file.abs, 'utf-8');

      expect(html).toContain('id="site-header"');
      expect(html).toContain('id="site-footer"');
      expect(html).toContain('viewport-fit=cover');
      expect(html).toContain('theme-color');
      expect(html).toContain('manifest.webmanifest');

      expect(html).toMatch(/components\.js/);
      expect(html).toMatch(/install-prompt\.js/);
      expect(html).toMatch(/tracking\.js/);
      expect(html).toMatch(/tracking-loader\.js/);
      expect(html).toMatch(/cookie-consent\.js/);
      expect(html).toMatch(/main\.js/);

      const headerIdx = html.indexOf('id="site-header"');
      const mainIdx = html.indexOf('<main');
      const footerIdx = html.indexOf('id="site-footer"');
      const componentsIdx = html.indexOf('components.js');
      const installIdx = html.indexOf('install-prompt.js');
      const trackingIdx = html.indexOf('tracking.js');
      const trackingLoaderIdx = html.indexOf('tracking-loader.js');
      const consentIdx = html.indexOf('cookie-consent.js');
      const mainScriptIdx = html.indexOf('main.js');

      expect(headerIdx).toBeGreaterThan(-1);
      expect(footerIdx).toBeGreaterThan(-1);
      if (mainIdx > -1) {
        expect(headerIdx).toBeLessThan(mainIdx);
        expect(footerIdx).toBeGreaterThan(mainIdx);
      }

      expect(componentsIdx).toBeGreaterThan(-1);
      expect(installIdx).toBeGreaterThan(-1);
      expect(trackingIdx).toBeGreaterThan(-1);
      expect(trackingLoaderIdx).toBeGreaterThan(-1);
      expect(consentIdx).toBeGreaterThan(-1);
      expect(mainScriptIdx).toBeGreaterThan(-1);

      expect(componentsIdx).toBeLessThan(installIdx);
      expect(installIdx).toBeLessThan(trackingIdx);
      expect(trackingIdx).toBeLessThan(trackingLoaderIdx);
      expect(trackingLoaderIdx).toBeLessThan(consentIdx);
      expect(consentIdx).toBeLessThan(mainScriptIdx);
    });
  }
});
