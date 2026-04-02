// @ts-check
/**
 * 26 — Asset Integrity
 *
 * Static analysis of HTML files to ensure:
 * - All local CSS/JS references have ?v= cache-busting query strings
 * - No .src.css or .src.js files are referenced directly (must use minified)
 * - tracking-loader.js is loaded in <head> so consent + queues are available early
 * - facebook-pixel.js and tiktok-pixel.js wrappers are referenced locally
 * - All referenced local CSS/JS files exist on disk
 * - Every .src.css has a corresponding .css, every .src.js has a corresponding .js
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { PAGES } = require('./helpers/pages');

const ROOT = path.resolve(__dirname, '..', '..');

/** Extract all local CSS <link> and JS <script> references from HTML */
function extractLocalRefs(html) {
  const cssRefs = [];
  const jsRefs = [];

  // CSS: <link rel="stylesheet" href="..."> and preload-as-style patterns
  const cssRegex = /href="([^"]*\.css(?:\?[^"]*)?)"/g;
  let m;
  while ((m = cssRegex.exec(html)) !== null) {
    const href = m[1];
    // Skip external URLs
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) continue;
    cssRefs.push({ raw: href, path: href.split('?')[0], hasVersion: href.includes('?v=') });
  }

  // JS: <script src="...">
  const jsRegex = /<script[^>]+src="([^"]*\.js(?:\?[^"]*)?)"/g;
  while ((m = jsRegex.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) continue;
    jsRefs.push({
      raw: src,
      path: src.split('?')[0],
      hasVersion: src.includes('?v='),
      inHead: html.indexOf(m[0]) < html.indexOf('</head>'),
      isAsync: m[0].includes(' async'),
      isDefer: m[0].includes(' defer'),
    });
  }

  return { cssRefs, jsRefs };
}

/** Resolve a relative path from an HTML file to an absolute filesystem path */
function resolveRef(htmlPath, refPath) {
  const htmlDir = path.dirname(path.join(ROOT, htmlPath));
  return path.resolve(htmlDir, refPath);
}

test.describe('@smoke 26 — Asset Integrity (static HTML check)', () => {
  for (const page of PAGES) {
    const htmlPath = page.path.startsWith('/') ? page.path.slice(1) : page.path;

    test(`${page.name} — all local CSS/JS refs have ?v= cache busting`, () => {
      const html = fs.readFileSync(path.join(ROOT, htmlPath), 'utf-8');
      const { cssRefs, jsRefs } = extractLocalRefs(html);

      const missingVersion = [];
      for (const ref of [...cssRefs, ...jsRefs]) {
        if (!ref.hasVersion) {
          missingVersion.push(ref.raw);
        }
      }
      expect(missingVersion, `Missing ?v= on: ${missingVersion.join(', ')}`).toEqual([]);
    });

    test(`${page.name} — no .src.css or .src.js referenced directly`, () => {
      const html = fs.readFileSync(path.join(ROOT, htmlPath), 'utf-8');
      const { cssRefs, jsRefs } = extractLocalRefs(html);

      const srcRefs = [...cssRefs, ...jsRefs].filter(r => r.path.includes('.src.'));
      expect(srcRefs.map(r => r.raw), 'Should not reference .src.* files directly').toEqual([]);
    });

    test(`${page.name} — all referenced CSS/JS files exist`, () => {
      const html = fs.readFileSync(path.join(ROOT, htmlPath), 'utf-8');
      const { cssRefs, jsRefs } = extractLocalRefs(html);

      const missing = [];
      for (const ref of [...cssRefs, ...jsRefs]) {
        const absPath = resolveRef(htmlPath, ref.path);
        if (!fs.existsSync(absPath)) {
          missing.push(ref.path);
        }
      }
      expect(missing, `Missing files: ${missing.join(', ')}`).toEqual([]);
    });

    test(`${page.name} — shared tracking bootstrap and wrappers are referenced`, () => {
      const html = fs.readFileSync(path.join(ROOT, htmlPath), 'utf-8');
      const { jsRefs } = extractLocalRefs(html);

      const loader = jsRefs.find(r => r.path.includes('tracking-loader'));
      expect(loader, 'tracking-loader.js should be referenced').toBeTruthy();
      expect(loader.inHead, 'tracking-loader.js should be in <head>').toBe(true);
      expect(loader.isDefer, 'tracking-loader.js should not use defer').toBe(false);

      for (const name of ['facebook-pixel', 'tiktok-pixel']) {
        const wrapper = jsRefs.find(r => r.path.includes(name));
        expect(wrapper, `${name}.js should be referenced`).toBeTruthy();
      }
    });
  }

  test('all .src.css files have corresponding minified .css', () => {
    const cssDir = path.join(ROOT, 'css');
    const srcFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.src.css'));
    const missing = [];
    for (const src of srcFiles) {
      const minified = src.replace('.src.css', '.css');
      if (!fs.existsSync(path.join(cssDir, minified))) {
        missing.push(src);
      }
    }
    expect(missing, `Missing minified CSS for: ${missing.join(', ')}`).toEqual([]);
  });

  test('all .src.js files have corresponding minified .js', () => {
    const jsDir = path.join(ROOT, 'js');
    const srcFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.src.js'));
    const missing = [];
    for (const src of srcFiles) {
      const minified = src.replace('.src.js', '.js');
      if (!fs.existsSync(path.join(jsDir, minified))) {
        missing.push(src);
      }
    }
    expect(missing, `Missing minified JS for: ${missing.join(', ')}`).toEqual([]);
  });
});
