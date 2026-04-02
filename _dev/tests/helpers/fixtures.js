const base = require('@playwright/test');
const { suppressPopup } = require('./suppress-popup');

const test = base.test.extend({
  suppressedPage: async ({ page }, use) => {
    await suppressPopup(page);
    await use(page);
  },
});

module.exports = { test, expect: base.expect };
