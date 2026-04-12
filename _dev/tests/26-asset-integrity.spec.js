// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { PAGES } = require('./helpers/pages');

const ROOT = path.resolve(__dirname, '..', '..');
const SITE_ORIGIN = 'https://bagolykaland.hu';

function readHtml(filePath) {
  return fs.readFileSync(path.join(ROOT, filePath), 'utf-8');
}

function resolveAssetPath(htmlFilePath, assetPath) {
  if (!assetPath || assetPath.startsWith('data:') || assetPath.startsWith('#')) {
    return null;
  }

  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    const url = new URL(assetPath);
    if (url.origin !== SITE_ORIGIN) {
      return null;
    }
    return path.join(ROOT, url.pathname.replace(/^\/+/, ''));
  }

  if (assetPath.startsWith('/')) {
    return path.join(ROOT, assetPath.replace(/^\/+/, ''));
  }

  return path.resolve(path.dirname(path.join(ROOT, htmlFilePath)), assetPath);
}

function extractRefs(pageEntry) {
  const html = readHtml(pageEntry.filePath);
  const $ = cheerio.load(html);

  const cssRefs = $('link[rel="stylesheet"]')
    .map((_, el) => $(el).attr('href'))
    .get()
    .filter(Boolean);

  const jsRefs = $('script[src]')
    .map((_, el) => ({
      src: $(el).attr('src'),
      defer: $(el).is('[defer]'),
    }))
    .get()
    .filter((ref) => ref.src);

  const assetRefs = [
    ...$('link[rel="icon"]').map((_, el) => $(el).attr('href')).get(),
    ...$('link[rel="apple-touch-icon"]').map((_, el) => $(el).attr('href')).get(),
    ...$('link[rel="manifest"]').map((_, el) => $(el).attr('href')).get(),
    ...$('meta[property="og:image"]').map((_, el) => $(el).attr('content')).get(),
    ...$('meta[name="twitter:image"]').map((_, el) => $(el).attr('content')).get(),
    ...$('img[src]').map((_, el) => $(el).attr('src')).get(),
  ].filter(Boolean);

  return { cssRefs, jsRefs, assetRefs };
}

test.describe('@smoke 26 — Asset Integrity (static HTML check)', () => {
  for (const pageEntry of PAGES) {
    test(`${pageEntry.name} — asset refs exist + scripts deferred + images valid`, () => {
      const { cssRefs, jsRefs, assetRefs } = extractRefs(pageEntry);

      // CSS and JS references exist
      const refIssues = [];
      for (const ref of [...cssRefs, ...jsRefs.map((item) => item.src)]) {
        if (ref.includes('.src.')) {
          refIssues.push(`Unexpected source asset reference: ${ref}`);
          continue;
        }
        const resolved = resolveAssetPath(pageEntry.filePath, ref);
        if (resolved && !fs.existsSync(resolved)) {
          refIssues.push(ref);
        }
      }
      expect(refIssues, `Missing or invalid CSS/JS refs: ${refIssues.join(', ')}`).toEqual([]);

      // Shared scripts stay deferred
      for (const expected of [
        'components.js',
        'install-prompt.js',
        'tracking.js',
        'tracking-loader.js',
        'cookie-consent.js',
        'main.js',
        'lead-capture-loader.js',
      ]) {
        const match = jsRefs.find((ref) => ref.src.includes(expected));
        expect(match, `${expected} should be referenced`).toBeTruthy();
        expect(match && match.defer, `${expected} should be deferred`).toBe(true);
      }

      // Local image and metadata assets exist
      const missing = [];
      for (const ref of assetRefs) {
        const resolved = resolveAssetPath(pageEntry.filePath, ref);
        if (resolved && !fs.existsSync(resolved)) {
          missing.push(ref);
        }
      }
      expect(missing, `Missing local asset refs: ${missing.join(', ')}`).toEqual([]);
    });
  }

  test('all .src.css files have compiled .css counterparts', () => {
    const cssDir = path.join(ROOT, 'css');
    const srcFiles = fs.readdirSync(cssDir).filter((file) => file.endsWith('.src.css'));
    const missing = srcFiles.filter((file) => !fs.existsSync(path.join(cssDir, file.replace('.src.css', '.css'))));

    expect(missing, `Missing compiled CSS for: ${missing.join(', ')}`).toEqual([]);
  });

  test('all .src.js files have compiled .js counterparts', () => {
    const jsDir = path.join(ROOT, 'js');
    const srcFiles = fs.readdirSync(jsDir).filter((file) => file.endsWith('.src.js'));
    const missing = srcFiles.filter((file) => !fs.existsSync(path.join(jsDir, file.replace('.src.js', '.js'))));

    expect(missing, `Missing compiled JS for: ${missing.join(', ')}`).toEqual([]);
  });

  test('webapp shell files exist', () => {
    const requiredFiles = [
      'manifest.webmanifest',
      'service-worker.js',
      'img/apple-touch-icon.png',
      'img/favicon-16x16.png',
      'img/favicon-32x32.png',
      'img/favicon-192x192.png',
      'img/favicon-512x512.png',
      'js/tracking.js',
      'js/tracking-loader.js',
      'js/cookie-consent.js',
      'css/cookie-consent.css',
    ];

    const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(ROOT, file)));
    expect(missing, `Missing webapp shell files: ${missing.join(', ')}`).toEqual([]);
  });
});
