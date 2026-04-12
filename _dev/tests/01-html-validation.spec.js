// @ts-check
/**
 * 01 — HTML Validation (static file analysis)
 *
 * Reads HTML files from disk and validates structure using cheerio.
 * No browser needed — pure static analysis.
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

test.describe('@smoke 01 — HTML Validation', () => {
  for (const pg of PAGES) {
    test(`${pg.name} — valid HTML structure`, () => {
      const htmlPath = resolveHtmlPath(pg.filePath);
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const $ = cheerio.load(html);

      // Check DOCTYPE (cheerio preserves it — check raw string)
      expect(html, 'Page should have HTML5 DOCTYPE').toMatch(/<!DOCTYPE\s+html>/i);

      // Check lang attribute
      const lang = $('html').attr('lang');
      expect(lang, 'html element should have lang attribute').toBeTruthy();

      // Check charset meta
      expect($('meta[charset]').length, 'Should have exactly one charset meta').toBe(1);

      // Check viewport meta
      expect($('meta[name="viewport"]').length, 'Should have exactly one viewport meta').toBe(1);

      // Check title exists and is non-empty
      const title = $('title').text();
      expect(title.length, 'Page should have a non-empty title').toBeGreaterThan(0);

      // Check no duplicate IDs
      const ids = {};
      const duplicates = [];
      $('[id]').each((_, el) => {
        const id = $(el).attr('id');
        if (ids[id]) {
          duplicates.push(id);
        }
        ids[id] = true;
      });
      expect(duplicates, `Duplicate IDs found: ${duplicates.join(', ')}`).toHaveLength(0);

      // Check for valid body and head
      expect($('body').length, 'Page should have a body').toBe(1);
      expect($('head').length, 'Page should have a head').toBe(1);
    });
  }
});
