// @ts-check
const { test, expect } = require('./helpers/fixtures');
const { PAGES } = require('./helpers/pages');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '../..');
const SITE_ORIGIN = 'https://bagolykaland.hu';

function readPage(pageEntry) {
  const html = fs.readFileSync(path.join(ROOT, pageEntry.filePath), 'utf-8');
  return {
    html,
    $: cheerio.load(html),
  };
}

function expectedCanonical(pageEntry) {
  return new URL(pageEntry.path === '/index.html' ? '/' : pageEntry.path, SITE_ORIGIN).href;
}

test.describe('@smoke 09 — SEO', () => {
  for (const pageEntry of PAGES) {
    test(`${pageEntry.name} — metadata basics`, () => {
      const { $ } = readPage(pageEntry);

      const title = $('title').text().trim();
      expect(title.length).toBeGreaterThan(0);
      expect(title.toUpperCase()).not.toMatch(/\b(V2|DRAFT|TEST|DEV)\b/);

      const description = $('meta[name="description"]').attr('content') || '';
      expect(description.length).toBeGreaterThanOrEqual(40);
      expect(description.length).toBeLessThanOrEqual(200);

      const robots = $('meta[name="robots"]').attr('content') || '';
      expect(robots.toLowerCase()).toContain('index');
      expect(robots.toLowerCase()).toContain('follow');

      expect($('html').attr('lang')).toBe('hu');
      expect($('meta[name="theme-color"]').attr('content')).toBeTruthy();

      const canonical = $('link[rel="canonical"]').attr('href');
      expect(canonical).toBe(expectedCanonical(pageEntry));

      const manifest = $('link[rel="manifest"]').attr('href') || '';
      expect(manifest.length).toBeGreaterThan(0);

      expect($('meta[property="og:type"]').attr('content')).toBeTruthy();
      expect($('meta[property="og:title"]').attr('content')).toBeTruthy();
      expect($('meta[property="og:description"]').attr('content')).toBeTruthy();
      expect($('meta[property="og:url"]').attr('content')).toBe(expectedCanonical(pageEntry));

      const ogImage = $('meta[property="og:image"]').attr('content') || '';
      expect(ogImage.startsWith(`${SITE_ORIGIN}/`)).toBe(true);

      expect($('meta[name="twitter:card"]').attr('content')).toBe('summary_large_image');

      const favicon = $('link[rel="icon"]').attr('href') || '';
      expect(favicon.length).toBeGreaterThan(0);
    });
  }

  test('homepage has extended social metadata and valid JSON-LD', () => {
    const homepage = PAGES.find((pageEntry) => pageEntry.filePath === 'index.html');
    expect(homepage).toBeTruthy();

    const { $ } = readPage(homepage);

    expect($('meta[name="twitter:title"]').attr('content')).toBeTruthy();
    expect($('meta[name="twitter:description"]').attr('content')).toBeTruthy();
    expect($('meta[name="twitter:image"]').attr('content')).toBeTruthy();

    const jsonLdScripts = $('script[type="application/ld+json"]');
    expect(jsonLdScripts.length).toBeGreaterThanOrEqual(1);

    let parsedSchema = false;
    jsonLdScripts.each((_, element) => {
      try {
        const data = JSON.parse($(element).html() || '');
        if (data && data['@type']) {
          parsedSchema = true;
        }
      } catch {}
    });

    expect(parsedSchema).toBe(true);
  });

  test('robots.txt is accessible and references the sitemap', async ({ suppressedPage: page }) => {
    const response = await page.goto('/robots.txt', { waitUntil: 'domcontentloaded' });
    expect(response && response.status()).toBe(200);

    const text = await page.locator('body').textContent();
    expect(text || '').toContain('Sitemap: https://bagolykaland.hu/sitemap.xml');
  });

  test('sitemap.xml is accessible and lists all production pages', async ({ suppressedPage: page }) => {
    const response = await page.goto('/sitemap.xml', { waitUntil: 'domcontentloaded' });
    expect(response && response.status()).toBe(200);

    const text = await page.locator('body').textContent();
    expect(text).toBeTruthy();

    for (const pageEntry of PAGES) {
      expect(text || '').toContain(expectedCanonical(pageEntry));
    }
  });
});
