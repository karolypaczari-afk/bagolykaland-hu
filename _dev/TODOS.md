# Bagolykaland.hu — Development TODOs

> Track all pending tasks here. Move items to DONE when completed.

---

## 🔴 Must-do before launch

- [ ] **Tracking codes** — Open `js/tracking.js`, paste real GTM / GA4 / FB Pixel IDs and uncomment the blocks. Also uncomment the `<script src="/js/tracking.js">` line in every HTML file.
- [ ] **Contact details** — In `js/components.js`, update the `CONTACT` object (address, phone, email, hours).
- [ ] **Social media URLs** — In `js/components.js`, update the `SOCIALS` array with real Facebook and Instagram profile URLs.
- [ ] **Real photos** — Replace emoji placeholders in:
  - Hero section visual (`index.html` — hero-main-card)
  - About section (`index.html` — about-image-frame)
  - Blog card thumbnails (`index.html` — blog-card-thumb ×3)
- [ ] **Favicon** — Add `img/favicon.ico` (and optionally `img/favicon.svg`, `img/apple-touch-icon.png`).
- [ ] **OG image** — Add `img/og-image.jpg` (1200×630px) for social sharing previews.
- [ ] **Real blog content** — Replace placeholder article titles/excerpts and add real dates to the blog cards on the homepage.
- [ ] **About section stats** — Confirm the "10+ év tapasztalat" and "500+ fejlesztett gyermek" numbers are accurate (in `index.html` — `data-count` attributes).

---

## 🟡 Important — build out all pages

Each page below needs its own HTML file. Use the same shell pattern:
```html
<div id="site-header"></div>
<main id="main-content"><!-- page content --></main>
<div id="site-footer"></div>
<script src="/js/components.js" defer></script>
<script src="/js/main.js" defer></script>
```

- [ ] `rolunk/index.html` — Rólunk főoldal
- [ ] `rolunk/kedves-anya-es-apa/index.html`
- [ ] `rolunk/kedves-gyermek/index.html`
- [ ] `foglalkozasaink/index.html` — Foglalkozásaink lista
- [ ] `foglalkozasaink/logopedia/index.html`
- [ ] `foglalkozasaink/mozgasfejlesztes/index.html`
- [ ] `foglalkozasaink/egyeni-fejleszto-foglalkozasok/index.html`
- [ ] `foglalkozasaink/szorongasoldo-program/index.html`
- [ ] `foglalkozasaink/iskola-elokeszito-foglalkozas/index.html`
- [ ] `vizsgalatok/index.html`
- [ ] `vizsgalatok/logopediai-vizsgalat/index.html`
- [ ] `vizsgalatok/iskolaerettsegi-vizsgalat/index.html`
- [ ] `vizsgalatok/komplex-reszkepesseg-vizsgalat/index.html`
- [ ] `ernyo-alatt-program/index.html`
- [ ] `kezen-fogva-online-finommotorika-fejlesztes/index.html`
- [ ] `eves-hetirend/index.html`
- [ ] `blog/index.html`
- [ ] `galeria/index.html`
- [ ] `arlista/index.html`
- [ ] `kapcsolat/index.html`
- [ ] `adatkezelesi-tajekoztato/index.html`

---

## 🟢 Nice-to-have / polish

- [ ] Add a real **owl SVG logo** (replace the 🦉 emoji in logo + hero)
- [ ] **Gallery page** — lightbox for photos
- [ ] **Contact page** — embed Google Maps, contact form (Formspree / Netlify Forms or similar)
- [ ] **Árlista** — styled pricing table
- [ ] **404 page** — `404.html` with friendly message
- [ ] **Cookie consent banner** — required for GDPR (tracking)
- [ ] **Sitemap** — generate `sitemap.xml` (or add a build step)
- [ ] **robots.txt** — add at root
- [ ] Review all `<title>` and `<meta description>` tags per page for SEO
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Lighthouse audit — aim for 90+ on Performance, Accessibility, SEO
- [ ] Set up **hosting** (Netlify / Cloudflare Pages / GitHub Pages — whichever fits)
- [ ] Point domain `bagolykaland.hu` to new host (coordinate DNS cutover with live WP site)

---

## ✅ Done

- [x] Project structure created (`css/`, `js/`, `_dev/`, `img/`)
- [x] `css/style.css` — full global stylesheet (design tokens, header, footer, all homepage sections, responsive)
- [x] `js/components.js` — global header + footer injection, mobile menu, dropdowns, active nav
- [x] `js/main.js` — scroll animations, counters, smooth scroll
- [x] `js/tracking.js` — tracking code placeholders (GTM, GA4, FB Pixel)
- [x] `index.html` — full homepage (hero, services, about, programs, blog preview, CTA)
- [x] GitHub repo created and initial push done
