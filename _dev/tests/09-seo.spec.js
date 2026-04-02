// @ts-check
/**
 * 09 — SEO (static file analysis)
 *
 * Validates SEO requirements by reading HTML files from disk.
 * Browser-based tests only for llms.txt and sitemap.xml (need HTTP).
 */
const { test, expect } = require('./helpers/fixtures');
const { PAGES } = require('./helpers/pages');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '../..');

function resolveHtmlPath(pagePath) {
  return path.join(ROOT, pagePath);
}

test.describe('@smoke 09 — SEO', () => {
  for (const pg of PAGES) {
    test(`${pg.name} — all SEO checks`, () => {
      const htmlPath = resolveHtmlPath(pg.path);
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const $ = cheerio.load(html);

      // has <title>
      const title = $('title').text();
      expect(title.length).toBeGreaterThan(0);

      // title does not contain internal naming
      const forbidden = ['V2', 'DRAFT', 'TEST', 'DEV'];
      for (const word of forbidden) {
        expect(title.toUpperCase()).not.toContain(word);
      }

      // has meta description with valid length (50-160 chars)
      const desc = $('meta[name="description"]');
      expect(desc.length).toBe(1);
      const descContent = desc.attr('content');
      expect(descContent && descContent.length).toBeGreaterThanOrEqual(50);
      expect(descContent.length).toBeLessThanOrEqual(160);

      // has meta robots
      expect($('meta[name="robots"]').length).toBe(1);

      // has meta keywords
      const keywords = $('meta[name="keywords"]');
      expect(keywords.length).toBe(1);
      const kwContent = keywords.attr('content');
      expect(kwContent && kwContent.length).toBeGreaterThan(5);

      // has canonical URL
      const canonical = $('link[rel="canonical"]');
      expect(canonical.length).toBe(1);
      const href = canonical.attr('href');
      expect(href).toMatch(/^https:\/\/zsenibagoly\.hu\//);

      // has lang="hu" attribute (exact match)
      const lang = $('html').attr('lang');
      expect(lang).toBe('hu');

      // has facebook-domain-verification meta tag
      const fbVerify = $('meta[name="facebook-domain-verification"]');
      expect(fbVerify.length).toBe(1);
      expect(fbVerify.attr('content')).toBe('v8kk3one7bp2yfhjq6fx0ievepeh2p');

      // has Open Graph tags
      expect($('meta[property="og:title"]').length).toBe(1);
      expect($('meta[property="og:description"]').length).toBe(1);
      expect($('meta[property="og:type"]').length).toBe(1);
      expect($('meta[property="og:url"]').length).toBe(1);
      expect($('meta[property="og:image"]').length).toBe(1);

      // has og:locale
      const ogLocale = $('meta[property="og:locale"]');
      expect(ogLocale.length).toBe(1);
      expect(ogLocale.attr('content')).toBe('hu_HU');

      // has og:image:width and og:image:height
      expect($('meta[property="og:image:width"]').length).toBe(1);
      expect($('meta[property="og:image:height"]').length).toBe(1);
      expect($('meta[property="og:image:alt"]').length).toBe(1);

      // has og:image with content
      const ogContent = $('meta[property="og:image"]').attr('content');
      expect(ogContent).toBeTruthy();
      expect(ogContent.length).toBeGreaterThan(10);

      // has Twitter card tags
      const card = $('meta[name="twitter:card"]');
      expect(card.length).toBe(1);
      expect(card.attr('content')).toBe('summary_large_image');
      expect($('meta[name="twitter:title"]').length).toBe(1);
      expect($('meta[name="twitter:description"]').length).toBe(1);
      expect($('meta[name="twitter:image"]').length).toBe(1);
      expect($('meta[name="twitter:image:alt"]').length).toBe(1);

      // has dns-prefetch resource hints
      const dnsPrefetchHrefs = [];
      $('link[rel="dns-prefetch"]').each((_, el) => {
        dnsPrefetchHrefs.push($(el).attr('href'));
      });
      expect(dnsPrefetchHrefs).toContain('https://www.googletagmanager.com');
      expect(dnsPrefetchHrefs).toContain('https://www.clarity.ms');
      expect(dnsPrefetchHrefs).toContain('https://connect.facebook.net');

      // has structured data (JSON-LD)
      const jsonLdEls = $('script[type="application/ld+json"]');
      expect(jsonLdEls.length).toBeGreaterThanOrEqual(1);

      // has BreadcrumbList schema
      let hasBreadcrumb = false;
      jsonLdEls.each((_, el) => {
        const text = $(el).html();
        try {
          const data = JSON.parse(text);
          if (data['@type'] === 'BreadcrumbList') {
            hasBreadcrumb = true;
          }
        } catch {}
      });
      expect(hasBreadcrumb).toBe(true);
    });
  }

  // Standalone tests — these still need browser (HTTP requests)
  test('llms.txt is accessible and contains Zsenibagoly', async ({ suppressedPage: page }) => {
    const response = await page.goto('/llms.txt', { waitUntil: 'domcontentloaded' });
    expect(response.status()).toBe(200);
    const text = await page.locator('body').textContent();
    expect(text).toContain('Zsenibagoly');
  });

  test('sitemap.xml contains all production pages', async ({ suppressedPage: page }) => {
    await page.goto('/sitemap.xml', { waitUntil: 'domcontentloaded' });
    const text = await page.locator('body').textContent();
    const expectedUrls = [
      'zsenibagoly.hu/',
      'zsenibagoly.hu/hisztikezeles',
      'zsenibagoly.hu/figyelemfejlesztes',
      'zsenibagoly.hu/szorongasoldas',
      'zsenibagoly.hu/sulirajt',
      'zsenibagoly.hu/zsenifeszek',
      'zsenibagoly.hu/kapcsolat',
      'zsenibagoly.hu/rolunk',
      'zsenibagoly.hu/hisztikezeles-csali',
      'zsenibagoly.hu/alomra-hangolva',
      'zsenibagoly.hu/hisztikezeles-gyakorlati-videok',
      'zsenibagoly.hu/szorongasoldas-gyakorlati-peldak',
      'zsenibagoly.hu/sikeres-sulirajt-iskolaerettseg-elvarasai',
      'zsenibagoly.hu/figyelemfejlesztes-jolly-joker',
      'zsenibagoly.hu/akcio',
    ];
    for (const url of expectedUrls) {
      expect(text).toContain(url);
    }
  });
});
