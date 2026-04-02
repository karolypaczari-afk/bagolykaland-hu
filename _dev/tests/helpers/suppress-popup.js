/**
 * Suppress any cookie banners or popups during tests.
 * Currently bagolykaland.hu has no popup — this is a no-op placeholder.
 * When a cookie consent banner or lead popup is added, configure it here.
 *
 * @param {import('@playwright/test').Page} page
 */
async function suppressPopup(page) {
  // Placeholder: set cookie consent accepted so future GDPR banner doesn't interfere.
  await page.context().addCookies([
    {
      name: 'bk_cookie_consent',
      value: 'accepted',
      domain: '127.0.0.1',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 86400,
    },
  ]);
}

module.exports = { suppressPopup };
