# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Quick Commands

```bash
npm run serve          # Start local server at http://127.0.0.1:8080
npm run dev            # Eleventy watch mode (rebuilds .njk → .html on save)
npm test               # Full Playwright test suite
npm run test:fast      # FAST_MODE: homepage only
npm run test:smoke     # @smoke tagged tests only
npm run test:a11y      # Accessibility tests only
npm run check          # Biome + HTML + CSS validation
npm run build          # Eleventy + minify .src.css/.src.js
npm run build:css      # CSS only
npm run build:js       # JS only
npm run watch          # Auto-rebuild on .src.* changes
npm run optimize:images  # Convert _dev/input/ → img/ as WebP
npm run report         # Open Playwright HTML report
```

Run a single test file:
```bash
npx playwright test _dev/tests/05-components.spec.js
npx playwright test _dev/tests/09-seo.spec.js --headed
```

---

## Architecture

**Eleventy static site generator → plain HTML/CSS/JS output. No framework, no WordPress.**

Eleventy processes `.njk` templates in `pages/` and writes `.html` output alongside them (input = output = `.`).
Both source `.njk` and generated `.html` live inside `pages/`.
`.htaccess` rewrites clean public URLs (`/rolunk/`) to the actual files (`/pages/rolunk/index.html`).
The deploy pipeline (GitHub → Hostinger) is unchanged — it still serves the root directory.

### File Structure

```
/                         ← project root
├── index.njk             ← homepage source (Eleventy processes → index.html)
├── index.html            ← homepage output (generated, do not edit directly)
├── pages/                ← ALL subpages live here
│   ├── rolunk/
│   │   ├── index.html                   (depth 2)
│   │   ├── kedves-anya-es-apa/
│   │   │   └── index.html               (depth 3)
│   │   └── kedves-gyermek/
│   │       └── index.html               (depth 3)
│   ├── foglalkozasaink/
│   │   ├── index.html                   (depth 2)
│   │   ├── logopedia/index.html         (depth 3)
│   │   ├── mozgasfejlesztes/index.html  (depth 3)
│   │   ├── egyeni-fejleszto-foglalkozasok/index.html
│   │   ├── szorongasoldo-program/index.html
│   │   └── iskola-elokeszito-foglalkozas/index.html
│   ├── vizsgalatok/
│   │   ├── index.html
│   │   ├── logopediai-vizsgalat/index.html
│   │   ├── iskolaerettsegi-vizsgalat/index.html
│   │   └── komplex-reszkepesseg-vizsgalat/index.html
│   ├── ernyo-alatt-program/index.html
│   ├── kezen-fogva-online-finommotorika-fejlesztes/index.html
│   ├── eves-hetirend/index.html
│   ├── blog/index.html
│   ├── galeria/index.html
│   ├── arlista/index.html
│   ├── kapcsolat/index.html
│   └── adatkezelesi-tajekoztato/index.html
├── css/
│   └── style.css         ← global stylesheet (do NOT edit style.src.css manually if build is active)
├── _includes/
│   ├── layouts/base.njk  ← page shell (html/head/body wrapper)
│   └── partials/
│       ├── head.njk      ← <head> meta/canonical/CSS (front matter drives values)
│       ├── header.njk    ← static site header + nav (loops over _data/nav.json)
│       ├── footer.njk    ← static site footer
│       └── scripts.njk   ← shared <script> tags
├── _data/
│   ├── nav.json          ← nav structure (single source of truth for menus)
│   └── site.json         ← contact info, social URLs, site name, defaultOgImage
├── js/
│   ├── components.js     ← interactive-only: dropdowns, hamburger, active nav, navReady event
│   ├── install-prompt.js ← PWA install UI + service worker registration
│   ├── main.js           ← scroll animations, counters, smooth scroll
│   ├── popup.js          ← lead capture popup logic
│   ├── lead-capture-loader.js  ← deferred popup loader
│   ├── tracking.js       ← consent/tracking config (fill in your own IDs)
│   ├── tracking-loader.js ← loads vendors only after consent
│   └── cookie-consent.js ← cookie banner bootstrap
├── css/cookie-consent.css ← lazy-loaded cookie banner styles
├── manifest.webmanifest ← installable webapp manifest
├── service-worker.js    ← offline shell caching
└── img/                  ← all images (SEO-friendly filenames + app icons)
```

### Global Component Injection

Header and footer are rendered at **build time** by Eleventy. No runtime JS injection.

- `_includes/partials/header.njk` — announcement bar, site header, desktop nav, mobile nav
- `_includes/partials/footer.njk` — footer columns, contact info, copyright year
- Nav structure lives in `_data/nav.json` — **only edit there** to change menus
- Contact info / social URLs live in `_data/site.json`
- Asset paths use **absolute URLs** (`/css/style.css`, `/img/...`) — depth no longer matters
- `js/components.js` handles interactive behaviour only: dropdowns, hamburger, active link

### New Page (any depth — pages/[slug]/)

Create `pages/[slug]/index.njk` with front matter and page content:

```njk
---
layout: "base.njk"
title: "Oldal Cím – BagolykaLand Debrecen"
description: "50-160 chars, unique per page"
canonical: "https://bagolykaland.hu/pages/[slug]/"
ogImage: "https://bagolykaland.hu/img/custom.webp"  # omit to use site default
---

    <!-- PAGE HERO -->
    <section class="page-hero" aria-labelledby="hero-heading">
      ...
    </section>

    <!-- CONTENT -->
    <section class="section section-white">
      ...
    </section>
```

Run `npm run eleventy` (or `npm run dev` for watch mode) to generate the `.html` output.

### Webapp Layer

- `manifest.webmanifest` + `service-worker.js` make the site installable and provide a lightweight offline shell
- `js/install-prompt.js` controls the install button in the shared header and shows manual instructions for iOS / in-app browsers
- App icons live in `img/`: `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `favicon-192x192.png`, `favicon-512x512.png`
- The install button is injected by `js/components.js`, so page HTML only needs the manifest/meta tags + `install-prompt.js`

### Tracking + Consent Layer

- `js/tracking.js` is now a config file, not a paste-bin of raw snippets
- Preferred path: set only `gtmId` in `window.BK_TRACKING_CONFIG.vendors`, then manage GA4 / Meta / Clarity in GTM
- Add your own IDs to `window.BK_TRACKING_CONFIG.vendors` when you're ready:
  - `gtmId`
  - `gaMeasurementId`
  - `clarityId`
  - `metaPixelId`
- `js/tracking-loader.js` stays inert until at least one vendor ID is configured
- `js/cookie-consent.js` only shows a banner when consent is required and a vendor is actually configured
- `css/cookie-consent.css` is loaded lazily by the banner, so it does not affect normal page render cost
- The site already pushes GTM-friendly custom events into `dataLayer`, including:
  - `bk_cta_click`
  - `bk_contact_click`
  - `bk_form_start`
  - `bk_form_submit`
  - `bk_mobile_nav_toggle`
  - `bk_install_click`
  - `bk_install_prompt_result`
  - `bk_app_installed`
  - `bk_cookie_banner_view`
  - `bk_cookie_consent_updated`
  - `bk_popup_*`

### Build Pipeline (activate when CSS/JS grows complex)

When ready to minify:
- Rename `css/style.css` → `css/style.src.css`
- Run `npm run build` → generates `css/style.css`
- Update HTML references with cache-busting: `css/style.css?v=YYYYMMDDHHII`
- **Never edit `.css` / `.js` directly once build is active — edit `.src.*` only**

Today the build script also normalizes the shared HTML shell:
- injects the app-install meta/icon/manifest block
- enforces `viewport-fit=cover`
- keeps the shared script order consistent across every page

---

## Brand Colors

```css
:root {
  --clr-navy:   #1D3557;  /* Hero bg, headings */
  --clr-teal:   #5BB8AD;  /* Primary brand / owl eyes */
  --clr-coral:  #E8734A;  /* CTA buttons */
  --clr-yellow: #F5C640;  /* Accent */
  --clr-green:  #7ABF65;  /* Service accent */
  --clr-sky:    #6BA9D4;  /* Service accent */
  --clr-purple: #9B7BC3;  /* Service accent */
  --clr-pink:   #E87BA8;  /* Service accent */
  --clr-royal:  #5B7DB0;  /* Service accent */
}
```

Fonts: **Nunito** (headings, 700/800/900) + **Open Sans** (body, 400/600)

---

## CSS Architecture

All styles in `css/style.css`. Service cards use a per-card `--accent` CSS variable:
```html
<article class="service-card" style="--accent:#6BA9D4;">
```

Breakpoints:
- Nav hamburger: `max-width: 900px`
- Full mobile: `max-width: 640px`

---

## Component Reference

### Service Cards — critical HTML structure

**`service-card-top` must always be an empty div.** It is a 6px colored stripe, nothing else. The icon, heading, text, and link all go inside `service-card-body`.

```html
<!-- CORRECT -->
<article class="service-card fade-up stagger-1" style="--accent: #6BA9D4;">
  <div class="service-card-top"></div>      <!-- empty — just the accent stripe -->
  <div class="service-card-body">
    <div class="service-icon">🗣️</div>
    <h3>Service Title</h3>
    <p>Description text.</p>
    <a href="/pages/..." class="service-link btn btn-teal">Részletek →</a>
  </div>
</article>

<!-- WRONG — do not put content inside service-card-top -->
<div class="service-card-top">
  <div class="service-icon">🗣️</div>  ← this crushes to 6px, invisible
  <h3>Title</h3>                        ← same
</div>
```

Rich service cards (with feature list and price, used on `foglalkozasaink/`):

```html
<div class="service-card stagger-1" style="--accent: #6BA9D4">
  <div class="service-card-top"></div>
  <div class="service-card-body">
    <div class="service-icon">🗣️</div>
    <h3>Service Title</h3>
    <p>Description.</p>
    <ul class="service-card-list">
      <li>Feature one</li>
      <li>Feature two</li>
    </ul>
    <div class="service-card-price">10.000 Ft <span>/ 60 perc</span></div>
    <a href="/pages/..." class="service-link btn btn-teal">Részletek →</a>
  </div>
</div>
```

Dark-background variant (last card on `foglalkozasaink/`):
```html
<div class="service-card service-card--dark stagger-6">
  <div class="service-card-top" style="background: var(--clr-yellow)"></div>
  <div class="service-card-body">...</div>
</div>
```

### Blog Cards — use blog-grid, NOT services-grid

Blog post lists use `.blog-grid` + `.blog-card`, **not** `.services-grid` + `.service-card`.

```html
<div class="blog-grid">
  <article class="blog-card">
    <a href="/pages/blog/slug/" class="blog-card-link">
      <div class="blog-thumb">
        <img src="..." alt="..." width="400" height="260" loading="lazy" />
      </div>
      <div class="blog-body">
        <div class="blog-meta"><span class="blog-tag">Kategória</span></div>
        <h3>Post title</h3>
        <p>Excerpt text.</p>
        <span class="blog-read-more">Olvasd el →</span>
      </div>
    </a>
  </article>
</div>
```

### Inner Page Components (content/detail pages)

All the following classes are defined globally in `css/style.css`:

| Class | Purpose | Used on |
|-------|---------|---------|
| `.lead` | Large intro paragraph (1.1rem) | All detail pages |
| `.content-list` | Teal-bullet styled `<ul>` | All detail pages |
| `.process-steps` / `.process-step` | Numbered step flow | `egyeni-fejleszto-foglalkozasok/` |
| `.process-step__number` / `.process-step__content` | Step number circle + body | Same |
| `.comparison-grid` / `.comparison-card` / `.comparison-card--featured` | Side-by-side option cards | `mozgasfejlesztes/` |
| `.comparison-card__price` | Price line at bottom of comparison card | Same |
| `.program-variants` / `.variant-card` / `.variant-card--featured` | Program option cards | `iskola-elokeszito-foglalkozas/` |
| `.variant-card__badge` / `.variant-card__price` | Badge + price on variant cards | Same |
| `.skills-grid` / `.skill-item` / `.skill-item__icon` | 4-col skill grid | Same |

Standard inner page layout (with sidebar):
```html
<section class="section section-white">
  <div class="container">
    <div class="page-layout">           <!-- 1fr 340px grid -->
      <div class="content-block">
        <p class="lead">...</p>
        <h2>Section heading</h2>
        <ul class="content-list">
          <li>Item with teal bullet</li>
        </ul>
        <div class="highlight-box">Important callout text.</div>
      </div>
      <aside class="sidebar">
        <div class="sidebar-card">
          <h4>Ár</h4>
          <div class="sidebar-price">10.000 Ft</div>
          <div class="sidebar-price-note">/ 60 perc</div>
        </div>
      </aside>
    </div>
  </div>
</section>
```

### Pages with Local `<style>` Blocks

`pages/arlista/index.html` and `pages/kapcsolat/index.html` have page-specific `<style>` blocks because they override global component styles (e.g., `.pricing-row` flexbox vs grid). This is intentional — do not remove these local blocks without testing visually.

---

## Navigation

**Only edit `_data/nav.json` to change nav.** It is the single source of truth for menus. The header/footer partials loop over it at build time. `js/components.js` handles interactive behaviour only (dropdowns, hamburger, active link).

URL pattern: public URLs are clean root-level paths (e.g., `/rolunk/`, `/arlista/`) — no `/pages/` prefix visible to users. `.htaccess` rewrites handle the mapping to `pages/` on disk.

---

## Popup System

Lead capture popup: `js/popup.js` + `css/popup.css`, loaded deferred by `js/lead-capture-loader.js`.

- Triggers: exit-intent (desktop mouseleave), timed delay (10-15s), scroll 30-50%
- Fields: keresztnév + email
- Cookie key prefix: `bk_popup_dismissed_`
- MailerLite group IDs: set in `js/popup.js` in the `ML_GROUPS` object (currently TODO placeholders)
- MailerLite API key: set `window.BK_ML = { API_KEY: 'your-key' }` before popup.js loads

---

## Images

All images live in `img/` with SEO-friendly Hungarian filenames:

| File | Usage |
|------|-------|
| `logo.jpg` | Site logo (injected by components.js) |
| `bagolykaland-fejleszto-foglalkozas.jpg` | Hero / OG image |
| `bagolykaland-gyerekek-fejlesztes.jpg` | About section |
| `bagolykaland-kiscsoportos-foglalkozas.jpg` | Services |
| `bagolykaland-egyeni-fejlesztes.jpg` | Services |
| `bagolykaland-mozgasfejlesztes.png` | Mozgásfejlesztés page |
| `bagolykaland-iskola-elokeszito.png` | Iskola-előkészítő page |
| `bagolykaland-jatekok-eszkozok.jpg` | General/gallery |
| `bagolykaland-csapat-bolglarka.jpg` | Team section |
| `bagolykaland-eves-hetirend-2023-2024.jpg` | Schedule page |
| `bagolykaland-blog-*.jpg` | Blog thumbnails (5 files) |
| `og-image.jpg` | TODO: create 1200×630 OG image |
| `favicon-16x16.png` / `favicon-32x32.png` | Browser tab icons |
| `apple-touch-icon.png` | iOS home-screen icon |
| `favicon-192x192.png` / `favicon-512x512.png` | Manifest / install icons |

Image rules:
- All `<img>` must have descriptive Hungarian `alt` text
- Hero images: `fetchpriority="high"`, no `loading="lazy"`
- All other images: `loading="lazy"`, include `width` + `height`
- Format: WebP preferred (run `npm run optimize:images`)
- **Never use WordPress URLs** (`/wp-content/uploads/...`) — the old site is gone

---

## SEO Requirements (every page)

```html
<html lang="hu">
<title>Leíró Cím – BagolykaLand Debrecen</title>
<meta name="description" content="50-160 chars, unique">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://bagolykaland.hu/pages/[slug]/">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:type" content="website">
<meta property="og:url" content="https://bagolykaland.hu/pages/[slug]/">
<meta property="og:image" content="https://bagolykaland.hu/img/bagolykaland-fejleszto-foglalkozas.jpg">
<meta name="twitter:card" content="summary_large_image">
```

---

## Link Rules

| Destination | `target` | `rel` |
|-------------|----------|-------|
| Internal pages | none | — |
| External sites (Facebook, Instagram, gov, etc.) | `_blank` | `noopener noreferrer` |
| Privacy policy links | `_blank` | `noopener noreferrer` |

---

## Pricing Format

Hungarian number format: thousand separator is **period** (`.`), decimal is **comma** (`,`).
- Correct: `10.000 Ft`, `28.000 Ft/hó`, `42.000 Ft`

---

## Adding a New Page

**4 places to update:**
1. Create `pages/[slug]/index.njk` using the front matter template above — permalink and canonical are computed automatically
2. Add a label to `PAGE_LABELS` in `_dev/tests/helpers/pages.js` (page is auto-discovered, this just improves test names)
3. Update `_data/nav.json` if it needs a menu entry (URL = `/[slug]/`, no `/pages/` prefix)
4. Add to `sitemap.xml` when that file exists

Then run `npm run eleventy` to generate the HTML at `pages/[slug]/index.html`.

---

## Auto-Deploy

Pushing to the `main` branch on GitHub automatically deploys to Hostinger via webhook.
- Webhook ID: 604098473 (Hostinger deploy webhook)
- GitHub repo: https://github.com/karolypaczari-afk/bagolykaland-hu

---

## Do NOT Break

1. Edit source `.njk` files in `pages/`, NEVER the generated `.html` files — they are overwritten by Eleventy
2. All asset paths in templates use **absolute URLs** (`/css/style.css`, `/img/...`) — no `../../` relative paths
3. Page URLs have NO `/pages/` prefix — e.g. `/rolunk/` not `/pages/rolunk/`
4. Hungarian `lang="hu"` on `<html>`
5. `<img>` width + height attributes — prevents CLS
6. `loading="lazy"` must NOT be on hero/LCP images
7. `service-card-top` must always be empty — never put content inside it (it is a 6px stripe)
8. Never use BEM class names (e.g. `card__icon`, `card__price`) without first adding CSS for them to `style.css`
