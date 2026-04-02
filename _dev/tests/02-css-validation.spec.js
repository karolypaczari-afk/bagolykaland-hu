// @ts-check
const { test, expect } = require('@playwright/test');
const { CSS_FILES } = require('./helpers/pages');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

test.describe('02 — CSS Validation', () => {
  for (const cssFile of CSS_FILES) {
    test(`${cssFile} — parses without errors`, async ({ page }) => {
      const filePath = path.join(ROOT, cssFile);

      // Check file exists
      expect(fs.existsSync(filePath), `CSS file ${cssFile} should exist`).toBe(true);

      const cssContent = fs.readFileSync(filePath, 'utf-8');
      expect(cssContent.length, `CSS file ${cssFile} should not be empty`).toBeGreaterThan(0);

      // Load CSS into a page and check for parse errors via CSSOM
      await page.setContent(`<style id="test-css">${cssContent}</style>`);

      const parseResult = await page.evaluate(() => {
        const style = document.getElementById('test-css');
        const sheet = /** @type {HTMLStyleElement} */ (style).sheet;
        if (!sheet) return { ok: false, error: 'No stylesheet object' };

        const errors = [];
        try {
          // Access all rules — this will throw if CSS is badly malformed
          for (let i = 0; i < sheet.cssRules.length; i++) {
            // Just accessing them validates parsing
            const rule = sheet.cssRules[i];
            if (!rule) errors.push(`Rule ${i} is null`);
          }
        } catch (e) {
          errors.push(e.message);
        }

        return { ok: errors.length === 0, errors, ruleCount: sheet.cssRules.length };
      });

      expect(parseResult.ok, `CSS parse errors in ${cssFile}: ${parseResult.errors?.join(', ')}`).toBe(true);
      expect(parseResult.ruleCount, `${cssFile} should have CSS rules`).toBeGreaterThan(0);
    });
  }
});
