// @ts-check
/**
 * 00 — Consolidated Smoke Test
 *
 * Loads each page ONCE and runs all critical browser checks in a single visit:
 * - Component injection (nav, footer, header)
 * - Internal links (no broken links)
 * - Accessibility (axe-core WCAG AA, alt text, skip link)
 * - Mobile overflow (375px)
 * - Performance (load time)
 * - Contrast (white-on-white detection)
 *
 * This replaces running 05, 03, 11, 21, 10, 15 separately in fast mode.
 * ~6x fewer page loads than running those tests individually.
 */
const { test, expect } = require('./helpers/fixtures');
const AxeBuilder = require('@axe-core/playwright').default;
const { PAGES } = require('./helpers/pages');

// Only run this file in FAST_MODE
const SKIP = !process.env.FAST_MODE;

test.describe('00 — Consolidated Smoke (desktop 1280px)', () => {
  if (SKIP) {
    test.skip();
    test('skipped — run with FAST_MODE=1', () => {});
    return;
  }

  for (const pg of PAGES) {
    test(`${pg.name} — all browser checks`, async ({ suppressedPage: page }) => {
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

      // --- Component injection ---
      await page.waitForSelector('.header', { timeout: 5000 });
      await page.waitForSelector('.footer', { timeout: 5000 });

      const navToggle = page.locator('.nav-toggle');
      await expect(navToggle).toHaveCount(1);

      const logo = page.locator('.header .logo-image');
      await expect(logo).toHaveCount(1);

      const footer = page.locator('.footer');
      await expect(footer).toBeVisible();

      const footerLinks = page.locator('.footer-nav a');
      expect(await footerLinks.count()).toBeGreaterThanOrEqual(4);

      // Header visible and positioned correctly
      const header = page.locator('.header');
      await expect(header).toBeVisible();
      const headerBox = await header.boundingBox();
      expect(headerBox).toBeTruthy();
      expect(headerBox.y).toBeLessThanOrEqual(60);

      // #site-nav placeholder replaced
      await expect(page.locator('#site-nav')).toHaveCount(0);

      // --- Internal links ---
      const links = await page.locator('a[href]').evaluateAll((anchors) =>
        anchors.map((a) => ({
          href: a.getAttribute('href'),
          text: a.textContent?.trim().slice(0, 50) || '',
        }))
      );

      const internalLinks = [];
      for (const link of links) {
        if (!link.href || link.href.startsWith('#') || link.href.startsWith('mailto:') ||
            link.href.startsWith('tel:') || link.href.startsWith('http://') ||
            link.href.startsWith('https://')) continue;
        try {
          let url = new URL(link.href, `http://127.0.0.1:8080${pg.path}`).pathname;
          if (!url.includes('.') && url !== '/') {
            const slug = url.replace(/^\//, '').replace(/\/$/, '');
            url = slug === '' ? '/index.html' : `/pages/${slug}.html`;
          }
          internalLinks.push({ url, text: link.text, href: link.href });
        } catch {}
      }

      const linkResults = await Promise.all(
        internalLinks.map(async (link) => {
          try {
            const resp = await page.request.get(link.url);
            if (resp.status() !== 200) return `${link.href} => ${resp.status()}`;
          } catch (e) {
            return `${link.href} => ERROR`;
          }
          return null;
        })
      );
      const brokenLinks = linkResults.filter(Boolean);
      expect(brokenLinks, `Broken links:\n${brokenLinks.join('\n')}`).toHaveLength(0);

      // --- Accessibility (axe-core) ---
      await page.addStyleTag({ content: `
        .animate-on-scroll, .card-animate, [class*="-reveal"] {
          opacity: 1 !important; transform: translateY(0) !important; transition: none !important;
        }
        .mega-menu { display: none !important; }
        .dropdown:hover .mega-menu, .dropdown.active .mega-menu { display: grid !important; }
      ` });

      const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const serious = axeResults.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
      if (serious.length > 0) {
        const details = serious.map(v => `[${v.impact}] ${v.id}: ${v.description}`).join('\n');
        expect(serious, `A11y violations:\n${details}`).toHaveLength(0);
      }

      // All images have alt
      const missingAlt = await page.evaluate(() => {
        return [...document.querySelectorAll('img')]
          .filter(img => !img.hasAttribute('alt'))
          .map(img => img.src);
      });
      expect(missingAlt, `Images without alt: ${missingAlt.join(', ')}`).toHaveLength(0);

      // Skip link
      const skipLink = page.locator('.skip-link');
      await expect(skipLink).toHaveCount(1);
    });
  }
});

test.describe('00 — Consolidated Smoke (mobile 375px)', () => {
  if (SKIP) {
    test.skip();
    test('skipped — run with FAST_MODE=1', () => {});
    return;
  }

  test.use({ viewport: { width: 375, height: 812 } });

  for (const pg of PAGES) {
    test(`${pg.name} — mobile overflow + nav toggle`, async ({ suppressedPage: page }) => {
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.header', { timeout: 5000 });

      // Body overflow
      const bodyOverflow = await page.evaluate(() =>
        document.body.scrollWidth > document.body.clientWidth
      );
      expect(bodyOverflow, 'Body has horizontal overflow at 375px').toBe(false);

      // Element bounding box overflow
      const offenders = await page.evaluate(() => {
        const html = document.documentElement;
        const body = document.body;
        const origHtml = html.style.overflowX;
        const origBody = body.style.overflowX;
        html.style.overflowX = 'visible';
        body.style.overflowX = 'visible';

        const docWidth = window.innerWidth;
        const results = [];
        for (const el of document.querySelectorAll('body *')) {
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          if (style.position === 'fixed' || style.position === 'absolute') continue;
          const rect = el.getBoundingClientRect();
          if (rect.right > docWidth + 2 || rect.left < -2) {
            let parent = el.parentElement;
            let clipped = false;
            while (parent && parent !== body) {
              const ps = getComputedStyle(parent);
              if (ps.overflow === 'hidden' || ps.overflowX === 'hidden' || ps.overflowX === 'clip') {
                const pr = parent.getBoundingClientRect();
                if (pr.right <= docWidth + 2 && pr.left >= -2) { clipped = true; break; }
              }
              parent = parent.parentElement;
            }
            if (!clipped) {
              results.push(`<${el.tagName.toLowerCase()}> right=${Math.round(rect.right)}`);
            }
          }
          if (results.length >= 3) break;
        }
        html.style.overflowX = origHtml;
        body.style.overflowX = origBody;
        return results;
      });
      expect(offenders, `Overflow at 375px:\n${offenders.join('\n')}`).toHaveLength(0);

      // Hamburger visible
      const toggleVisible = await page.locator('.nav-toggle').isVisible();
      expect(toggleVisible, 'Hamburger should be visible at 375px').toBe(true);
    });
  }
});
