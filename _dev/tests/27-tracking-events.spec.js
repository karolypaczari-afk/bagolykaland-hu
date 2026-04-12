// @ts-check
const { test, expect } = require('./helpers/fixtures');

test.describe('@smoke 27 — GTM Event Wiring', () => {
  test('homepage pushes CTA, mobile nav, and install events into dataLayer', async ({ suppressedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.site-header', { timeout: 5000 });

    await page.evaluate(() => {
      window.dataLayer = [];
      const mobileCta = document.querySelector('.mobile-cta');
      if (mobileCta) {
        mobileCta.addEventListener(
          'click',
          (event) => {
            event.preventDefault();
          },
          { once: true }
        );
      }
    });

    await page.click('.hamburger');
    await page.click('.mobile-cta');
    await page.click('.js-install-app');

    const events = await page.evaluate(() =>
      (window.dataLayer || []).map((entry) => entry && entry.event).filter(Boolean)
    );

    expect(events).toContain('bk_cta_click');
    expect(events).toContain('bk_mobile_nav_toggle');
    expect(events).toContain('bk_install_click');
  });

  test('contact form pushes form lifecycle events', async ({ suppressedPage: page }) => {
    await page.goto('/pages/kapcsolat/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.contact-form form', { timeout: 5000 });

    await page.evaluate(() => {
      window.dataLayer = [];
      const form = document.querySelector('.contact-form form');
      if (form) {
        form.addEventListener(
          'submit',
          (event) => {
            event.preventDefault();
          },
          { once: true }
        );
      }
    });

    await page.focus('#contact-name');
    await page.fill('#contact-name', 'Teszt Szülő');
    await page.fill('#contact-email', 'teszt@example.com');
    await page.fill('#contact-message', 'Érdeklődöm az időpontfoglalásról.');
    await page.click('.contact-form button[type="submit"]');

    const events = await page.evaluate(() =>
      (window.dataLayer || []).map((entry) => entry && entry.event).filter(Boolean)
    );

    expect(events).toContain('bk_form_start');
    expect(events).toContain('bk_form_submit');
  });

  test('cookie banner consent events can be captured for GTM', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.addInitScript(() => {
      window.BK_TRACKING_CONFIG = {
        requireConsent: true,
        showBannerWithoutVendors: true,
      };
    });

    await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#bk-cookie-consent', { timeout: 5000 });

    await page.evaluate(() => {
      window.dataLayer = [];
    });

    await page.click('[data-bk-consent="accept"]');

    const events = await page.evaluate(() =>
      (window.dataLayer || []).map((entry) => entry && entry.event).filter(Boolean)
    );

    expect(events).toContain('bk_cookie_consent_updated');

    await context.close();
  });
});
