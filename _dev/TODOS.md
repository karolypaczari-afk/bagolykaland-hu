# Bagolykaland.hu — Development TODOs

> Track all pending tasks here. Move items to DONE when completed.

---

## 🔴 Must-do before launch

- [ ] **Tracking codes** — Open `js/tracking.js`, paste real GTM / GA4 / FB Pixel IDs and uncomment the blocks. Also add `<script src="../../js/tracking.js" defer></script>` to every HTML file (or add it via `components.js` footer injection).
- [ ] **MailerLite connection** — In `js/popup.js`, replace `TODO_*_GROUP_ID` values in `ML_GROUPS` with real MailerLite group IDs. Set the API key by adding `window.BK_ML = { API_KEY: 'YOUR_KEY' }` before the popup loads (e.g., in a `js/mailerlite-config.js`).
- [ ] **Social media URLs** — In `js/components.js`, update `SOCIAL_FB` and `SOCIAL_IG` variables with real Facebook and Instagram profile URLs.
- [ ] **Favicon** — Add `img/favicon.ico` (and optionally `img/favicon.svg`, `img/apple-touch-icon.png`).
- [ ] **OG image** — Create `img/og-image.jpg` at 1200×630px for social sharing previews. Currently using the hero photo.
- [ ] **Contact page form** — In `pages/kapcsolat/index.html`, wire up the contact form to a backend (Formspree / Netlify Forms / EmailJS or similar).
- [ ] **Google Maps** — Add embedded map to the contact page with the actual Debrecen address.
- [ ] **About section stats** — Confirm "15+ év tapasztalat" and "500+ fejlesztett gyermek" numbers are accurate in `index.html`.

---

## 🟡 Content / polish

- [ ] **Real blog content** — Add real blog articles to `pages/blog/`. Currently placeholder cards only.
- [ ] **Gallery photos** — Add more real photos to `pages/galeria/`. Add lightbox functionality.
- [ ] **Cookie consent banner** — Required for GDPR (tracking is blocked until consent). Recommend Cookiebot or custom.
- [ ] **Sitemap** — Generate `sitemap.xml` (or set up build step). All /pages/* URLs.
- [ ] **robots.txt** — Create at root: allow all, reference sitemap.
- [ ] **404 page** — `404.html` with friendly owl message and navigation links.
- [ ] **Image optimization** — Run `npm run optimize:images` to convert img/ to WebP. Update HTML to use WebP with JPG fallback.
- [ ] **SEO per-page review** — Verify all `<title>` and `<meta description>` tags are unique and descriptive.
- [ ] **WebP logo** — Convert `img/logo.jpg` to `img/logo.webp` for faster loading.

---

## 🟢 Deployment

- [x] **GitHub repo** — https://github.com/karolypaczari-afk/bagolykaland-hu (private)
- [x] **Auto-deploy webhook** — Hostinger webhook configured. Pushing to `main` auto-deploys.
- [ ] **Point domain** — DNS cutover: point `bagolykaland.hu` to new Hostinger host (coordinate with live WP site)
- [ ] **Hosting test** — Verify site works correctly on live Hostinger server before DNS cutover
- [ ] **SSL certificate** — Confirm HTTPS is active on Hostinger

---

## 🔧 Build pipeline (activate when CSS/JS grows complex)

- [ ] Rename `css/style.css` → `css/style.src.css` and run `npm run build`
- [ ] Update HTML `<link>` to `css/style.css?v=YYYYMMDDHHII`
- [ ] Same for JS files (rename to `.src.js`, let build generate minified output)
- [ ] Set up `npm run watch` in dev workflow

---

## ✅ Done

- [x] Project structure created (`css/`, `js/`, `_dev/`, `img/`, `pages/`)
- [x] `css/style.css` — full global stylesheet (brand colors, all sections, responsive)
- [x] `css/popup.css` — lead capture popup styles (BagolykaLand branding)
- [x] `js/components.js` — global header + footer injection, nav, mobile menu, dropdowns
- [x] `js/main.js` — scroll animations, counters, smooth scroll
- [x] `js/popup.js` — lead capture popup (exit-intent, timed, scroll; keresztnév + email fields; MailerLite)
- [x] `js/lead-capture-loader.js` — deferred popup loader
- [x] `js/tracking.js` — tracking code placeholders (GTM, GA4, FB Pixel)
- [x] `index.html` — full homepage (hero, features, services, about, programs, testimonials, blog preview, CTA)
- [x] `pages/rolunk/index.html` — Rólunk főoldal
- [x] `pages/rolunk/kedves-anya-es-apa/index.html`
- [x] `pages/rolunk/kedves-gyermek/index.html`
- [x] `pages/foglalkozasaink/index.html` — Foglalkozásaink lista
- [x] `pages/foglalkozasaink/logopedia/index.html`
- [x] `pages/foglalkozasaink/mozgasfejlesztes/index.html`
- [x] `pages/foglalkozasaink/egyeni-fejleszto-foglalkozasok/index.html`
- [x] `pages/foglalkozasaink/szorongasoldo-program/index.html`
- [x] `pages/foglalkozasaink/iskola-elokeszito-foglalkozas/index.html`
- [x] `pages/vizsgalatok/index.html`
- [x] `pages/vizsgalatok/logopediai-vizsgalat/index.html`
- [x] `pages/vizsgalatok/iskolaerettsegi-vizsgalat/index.html`
- [x] `pages/vizsgalatok/komplex-reszkepesseg-vizsgalat/index.html`
- [x] `pages/blog/index.html` — Blog főoldal (5 real blog posts)
- [x] `pages/galeria/index.html` — Galéria
- [x] `pages/arlista/index.html` — Árlista (full pricing table)
- [x] `pages/kapcsolat/index.html` — Kapcsolat (contact form placeholder)
- [x] `pages/ernyo-alatt-program/index.html`
- [x] `pages/kezen-fogva-online-finommotorika-fejlesztes/index.html`
- [x] `pages/eves-hetirend/index.html` (with schedule image)
- [x] `pages/adatkezelesi-tajekoztato/index.html`
- [x] Images copied from WP backup to `img/` with SEO-friendly filenames
- [x] All nav URLs updated to `/pages/` prefix
- [x] Auto-deploy GitHub webhook → Hostinger configured
- [x] CLAUDE.md updated with current architecture
- [x] GitHub repo initial push done
- [x] 26 Playwright test specs adapted from zsenibagoly.hu
- [x] `_dev/tests/helpers/` — pages.js, fixtures.js, suppress-popup.js
- [x] `package.json` — test + build + watch scripts
- [x] `playwright.config.js` — chromium + webkit-ios projects
- [x] `_dev/build.js` — CSS/JS minifier
- [x] `_dev/scripts/optimize-images.js` — WebP converter
