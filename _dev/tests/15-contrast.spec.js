// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./helpers/pages');
const { suppressPopup } = require('./helpers/suppress-popup');

/**
 * Compute relative luminance of an sRGB colour.
 * Formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function luminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG contrast ratio between two luminance values (always >= 1). */
function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse a CSS colour string (rgb/rgba) into {r,g,b,a}.
 * Handles: rgb(r, g, b), rgba(r, g, b, a), rgb(r g b), rgb(r g b / a)
 */
function parseColor(str) {
  if (!str || str === 'transparent' || str === 'rgba(0, 0, 0, 0)') return null;
  const m = str.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)(?:[, /]+([0-9.]+))?\)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}

/**
 * Blend a foreground colour (with alpha) over a background colour.
 * Returns final {r, g, b}.
 */
function blendAlpha(fg, bg) {
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

// Minimum WCAG AA ratios
const AA_NORMAL = 4.5; // normal text (< 18pt or < 14pt bold)
const AA_LARGE = 3.0; // large text (>= 18pt or >= 14pt bold)

// ── Selectors to audit per-page ──
// These are text-bearing elements that have historically had contrast issues.
const CRITICAL_SELECTORS = [
  '.hero-claim',
  '.hero-badge',
  '.hero-subtitle',
  '.about-role',
  '.instructor-role',
  '.optin-subtitle',
  '.persona-tier-tag',
  '.pricing-badge',
  '.value-number',
  '.card-badge-external',
  '.countdown-unit',
  '.footer-bottom p',
  '.footer-tagline',
  '.footer-copy',
  '.section-tag',
  '.stat-desc',
  '.v2-pull-quote p',
  '.v2-pull-quote span',
  '.csali-pillar-number',
  '.comparison-card.highlight',
  '.comparison-card.highlight h3',
  '.comparison-card.highlight .comp-price',
  '.stat-number',
  '.stat-label',
  '.v2-instructor-stat-number',
  '.expert-stat .number',
  '.global-sticky-cta-text',
  '.persona-quote',
  '.persona-bullets li',
  '.mega-item',
  '.section-subtitle',
  '.faq-item .faq-answer',
  '.cookie-btn-reject',
  '.zb-popup-close',
  '.form-group label',
];

test.describe('@a11y 15 — Colour Contrast (WCAG AA)', () => {
  test.use({ viewport: { width: 1200, height: 800 } });

  // ── Per-page: white-on-white + critical AA contrast + footer readability (single page load) ──
  for (const pg of PAGES) {
    test(`${pg.name} — contrast checks (white-on-white + critical AA + footer)`, async ({ page }) => {
      await suppressPopup(page);
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

      // 1. White-on-white check
      const problems = await page.evaluate(() => {
        const issues = [];
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT,
          null,
        );
        let node;
        while ((node = walker.nextNode())) {
          const el = /** @type {HTMLElement} */ (node);
          const text = (el.textContent || '').trim();
          if (!text) continue;
          const childText = Array.from(el.children).map(c => c.textContent || '').join('');
          if (text === childText && el.children.length > 0) continue;

          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          if (parseFloat(style.opacity) === 0) continue;

          const fgStr = style.color;
          const fgMatch = fgStr.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);
          if (!fgMatch) continue;
          const fg = { r: +fgMatch[1], g: +fgMatch[2], b: +fgMatch[3] };

          if (fg.r < 200 || fg.g < 200 || fg.b < 200) continue;

          let bgStr = null;
          let hasGradient = false;
          let current = el;
          while (current && current !== document.documentElement) {
            const cs = getComputedStyle(current);
            const bgImage = cs.backgroundImage;
            if (bgImage && bgImage !== 'none' && bgImage.includes('gradient')) {
              hasGradient = true;
              break;
            }
            const bc = cs.backgroundColor;
            if (bc && bc !== 'transparent' && bc !== 'rgba(0, 0, 0, 0)') {
              const alphaMatch = bc.match(/rgba\(\d+[, ]+\d+[, ]+\d+[, /]+([0-9.]+)\)/);
              if (alphaMatch && parseFloat(alphaMatch[1]) < 0.5) {
                current = current.parentElement;
                continue;
              }
              bgStr = bc;
              break;
            }
            current = current.parentElement;
          }
          if (hasGradient) continue;
          if (!bgStr) bgStr = 'rgb(255, 255, 255)';

          const bgMatch = bgStr.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);
          if (!bgMatch) continue;
          const bg = { r: +bgMatch[1], g: +bgMatch[2], b: +bgMatch[3] };

          if (bg.r > 200 && bg.g > 200 && bg.b > 200) {
            issues.push({
              text: text.substring(0, 60),
              selector: el.className ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase(),
              fg: fgStr,
              bg: bgStr,
            });
          }
        }
        return issues;
      });

      expect(problems, `White-on-white text found: ${JSON.stringify(problems, null, 2)}`).toHaveLength(0);

      // 2. Critical elements WCAG AA contrast
      const results = await page.evaluate((selectors) => {
        const data = [];
        for (const sel of selectors) {
          const els = document.querySelectorAll(sel);
          for (const el of els) {
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            if (style.display === 'none' || style.visibility === 'hidden') continue;

            const opacity = parseFloat(style.opacity);

            let bg = null;
            let hasGradient = false;
            const isSemiTransparent = (bc) => {
              const am = bc.match(/rgba\(\d+[, ]+\d+[, ]+\d+[, /]+([0-9.]+)\)/);
              return am && parseFloat(am[1]) < 0.5;
            };
            const ownBgImage = style.backgroundImage;
            if (ownBgImage && ownBgImage !== 'none' && ownBgImage.includes('gradient')) {
              hasGradient = true;
            }
            const ownBg = style.backgroundColor;
            if (!hasGradient && ownBg && ownBg !== 'transparent' && ownBg !== 'rgba(0, 0, 0, 0)' && !isSemiTransparent(ownBg)) {
              bg = ownBg;
            }
            if (!bg && !hasGradient) {
              let current = el.parentElement;
              while (current && current !== document.documentElement) {
                const cs = getComputedStyle(current);
                const bgImage = cs.backgroundImage;
                if (bgImage && bgImage !== 'none' && bgImage.includes('gradient')) {
                  hasGradient = true;
                  break;
                }
                const bc = cs.backgroundColor;
                if (bc && bc !== 'transparent' && bc !== 'rgba(0, 0, 0, 0)') {
                  if (isSemiTransparent(bc)) {
                    current = current.parentElement;
                    continue;
                  }
                  bg = bc;
                  break;
                }
                current = current.parentElement;
              }
            }
            if (hasGradient) continue;
            if (!bg) bg = 'rgb(255, 255, 255)';

            data.push({
              selector: sel,
              color: style.color,
              backgroundColor: bg,
              ownBackground: style.backgroundColor,
              opacity,
              fontSize: parseFloat(style.fontSize),
              fontWeight: style.fontWeight,
              text: (el.textContent || '').trim().substring(0, 50),
            });
          }
        }
        return data;
      }, CRITICAL_SELECTORS);

      const failures = [];
      for (const r of results) {
        const fg = parseColor(r.color);
        const bg = parseColor(r.backgroundColor);
        if (!fg || !bg) continue;

        let effectiveFg = fg;
        if (r.opacity < 1) {
          effectiveFg = { ...fg, a: fg.a * r.opacity };
        }

        const blended = blendAlpha(effectiveFg, bg);
        const fgLum = luminance(blended.r, blended.g, blended.b);
        const bgLum = luminance(bg.r, bg.g, bg.b);
        const ratio = contrastRatio(fgLum, bgLum);

        const isLargeText = r.fontSize >= 24 || (r.fontSize >= 18.66 && parseInt(r.fontWeight) >= 700);
        const threshold = isLargeText ? AA_LARGE : AA_NORMAL;

        if (ratio < threshold) {
          failures.push({
            selector: r.selector,
            text: r.text,
            ratio: ratio.toFixed(2),
            required: threshold,
            fg: r.color,
            bg: r.backgroundColor,
            opacity: r.opacity,
          });
        }
      }

      expect(failures, `Contrast failures:\n${JSON.stringify(failures, null, 2)}`).toHaveLength(0);

      // 3. Footer text readability
      const footerTexts = await page.evaluate(() => {
        const ftResults = [];
        const footer = document.querySelector('footer');
        if (!footer) return ftResults;

        const textEls = footer.querySelectorAll('p, a, span');
        for (const el of textEls) {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const text = (el.textContent || '').trim();
          if (!text) continue;

          let bg = null;
          let current = el;
          while (current && current !== document.documentElement) {
            const cs = getComputedStyle(current);
            if (cs.backgroundColor && cs.backgroundColor !== 'transparent' && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
              bg = cs.backgroundColor;
              break;
            }
            current = current.parentElement;
          }

          ftResults.push({
            color: style.color,
            bg: bg || 'rgb(255, 255, 255)',
            opacity: parseFloat(style.opacity),
            text: text.substring(0, 40),
            selector: el.className ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase(),
          });
        }
        return ftResults;
      });

      for (const ft of footerTexts) {
        const fg = parseColor(ft.color);
        const bg = parseColor(ft.bg);
        if (!fg || !bg) continue;

        let effectiveFg = fg;
        if (ft.opacity < 1) {
          effectiveFg = { ...fg, a: fg.a * ft.opacity };
        }
        const blended = blendAlpha(effectiveFg, bg);
        const fgLum = luminance(blended.r, blended.g, blended.b);
        const bgLum = luminance(bg.r, bg.g, bg.b);
        const ratio = contrastRatio(fgLum, bgLum);

        expect(
          ratio,
          `Footer "${ft.text}" (${ft.selector}) contrast ${ratio.toFixed(2)} below 3:1`
        ).toBeGreaterThanOrEqual(AA_LARGE);
      }
    });
  }

  // ── Homepage-specific: hero claims must NOT use white text on light bg ──
  test('Homepage — hero claims are readable (not white-on-transparent)', async ({ page }) => {
    await suppressPopup(page);
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const claims = await page.$$eval('.hero-claim', (els) =>
      els.map(el => {
        const style = getComputedStyle(el);
        return {
          color: style.color,
          background: style.backgroundColor,
          text: el.textContent.trim(),
        };
      })
    );

    for (const claim of claims) {
      // Foreground must NOT be white/near-white unless background is dark
      const fgMatch = claim.color.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);
      const bgMatch = claim.background.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);
      if (fgMatch && bgMatch) {
        const fgLight = +fgMatch[1] > 200 && +fgMatch[2] > 200 && +fgMatch[3] > 200;
        const bgLight = +bgMatch[1] > 200 && +bgMatch[2] > 200 && +bgMatch[3] > 200;
        expect(
          fgLight && bgLight,
          `Hero claim "${claim.text}" has white text on light background (fg: ${claim.color}, bg: ${claim.background})`
        ).toBe(false);
      }
    }
  });

  // ── Homepage-specific: about-role uses readable colour ──
  test('Homepage — .about-role has sufficient contrast', async ({ page }) => {
    await suppressPopup(page);
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const aboutRole = await page.$('.about-role');
    if (aboutRole) {
      const info = await aboutRole.evaluate((el) => {
        const style = getComputedStyle(el);
        let bg = null;
        let current = el.parentElement;
        while (current) {
          const cs = getComputedStyle(current);
          if (cs.backgroundColor && cs.backgroundColor !== 'transparent' && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            bg = cs.backgroundColor;
            break;
          }
          current = current.parentElement;
        }
        return { color: style.color, bg: bg || 'rgb(255, 255, 255)' };
      });

      const fg = parseColor(info.color);
      const bg = parseColor(info.bg);
      if (fg && bg) {
        const fgLum = luminance(fg.r, fg.g, fg.b);
        const bgLum = luminance(bg.r, bg.g, bg.b);
        const ratio = contrastRatio(fgLum, bgLum);
        expect(ratio, `.about-role contrast ratio ${ratio.toFixed(2)} is below 4.5:1`).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    }
  });

  // ── Badges/tags must not use white text on pastel backgrounds ──
  const BADGE_PAGES = [
    { name: 'Homepage', path: '/index.html', selector: '.persona-tier-tag' },
    { name: 'Szorongásoldás', path: '/pages/szorongasoldas.html', selector: '.pricing-badge' },
    { name: 'Szorongásoldás', path: '/pages/szorongasoldas.html', selector: '.value-number' },
  ];

  for (const bp of BADGE_PAGES) {
    test(`${bp.name} — ${bp.selector} meets contrast requirements`, async ({ page }) => {
      await suppressPopup(page);
      await page.goto(bp.path, { waitUntil: 'domcontentloaded' });

      const elements = await page.$$(bp.selector);
      for (const el of elements) {
        const info = await el.evaluate((e) => {
          const style = getComputedStyle(e);
          return {
            color: style.color,
            bg: style.backgroundColor,
            fontSize: parseFloat(style.fontSize),
            fontWeight: style.fontWeight,
          };
        });

        const fg = parseColor(info.color);
        const bg = parseColor(info.bg);
        if (fg && bg) {
          const blended = bg.a < 1 ? blendAlpha(bg, { r: 255, g: 255, b: 255 }) : bg;
          const fgLum = luminance(fg.r, fg.g, fg.b);
          const bgLum = luminance(blended.r, blended.g, blended.b);
          const ratio = contrastRatio(fgLum, bgLum);
          const isLarge = info.fontSize >= 24 || (info.fontSize >= 18.66 && parseInt(info.fontWeight) >= 700);
          const threshold = isLarge ? AA_LARGE : AA_NORMAL;
          expect(
            ratio,
            `${bp.selector} contrast ${ratio.toFixed(2)} below ${threshold}:1`
          ).toBeGreaterThanOrEqual(threshold);
        }
      }
    });
  }

  // ── Form input borders must be visually distinct from background ──
  const FORM_PAGES = [
    { name: 'Kapcsolat', path: '/pages/kapcsolat.html' },
    { name: 'Homepage', path: '/index.html' },
  ];
  for (const fp of FORM_PAGES) {
    test(`${fp.name} — form input borders are visible (not same as background)`, async ({ page }) => {
      await suppressPopup(page);
      await page.goto(fp.path, { waitUntil: 'domcontentloaded' });

      const inputs = await page.$$('.form-group input, .form-group textarea');
      for (const input of inputs) {
        const info = await input.evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            borderColor: style.borderColor,
            backgroundColor: style.backgroundColor,
          };
        });
        expect(
          info.borderColor,
          `Form input border (${info.borderColor}) matches background (${info.backgroundColor}) — invisible border`
        ).not.toBe(info.backgroundColor);
      }
    });
  }

  // ── Disabled button state must exist in stylesheet ──
  test('Disabled button styles are defined', async ({ page }) => {
    await suppressPopup(page);
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    // Inject a disabled button and verify it gets correct styles
    const disabledStyles = await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.disabled = true;
      btn.textContent = 'Test';
      document.body.appendChild(btn);
      const style = getComputedStyle(btn);
      const result = {
        cursor: style.cursor,
        opacity: parseFloat(style.opacity),
        pointerEvents: style.pointerEvents,
      };
      btn.remove();
      return result;
    });

    expect(disabledStyles.cursor, 'Disabled button should have not-allowed cursor').toBe('not-allowed');
    expect(disabledStyles.opacity, 'Disabled button should have reduced opacity').toBeLessThan(1);
    expect(disabledStyles.pointerEvents, 'Disabled button should have pointer-events: none').toBe('none');
  });
});
