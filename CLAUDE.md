# BAGOLYKALAND.HU — Developer Guide

This is the authoritative reference for this project. Read before making changes.

---

## Quick Commands

```bash
npm run serve          # Start local server at http://127.0.0.1:8080
npm test               # Full Playwright test suite
npm run test:fast      # FAST_MODE: homepage only
npm run test:smoke     # @smoke tagged tests only
npm run test:a11y      # Accessibility tests only
npm run build          # Minify all .src.css + .src.js
npm run build:css      # CSS only
npm run watch          # Auto-rebuild on .src.* changes
npm run optimize:images  # Convert _dev/input/ → img/ as WebP
npm run report         # Open Playwright HTML report
```

---

## Architecture

**Pure static HTML/CSS/JS — no framework, no WordPress.**

Modeled after zsenibagoly.hu (sister site at `C:\claude_desktoprol\1. HTML Creation`).

### File Structure

```
/                         ← project root
├── index.html            ← homepage (depth 0)
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
├── js/
│   ├── components.js     ← header + footer injection (edit here for nav/contact/social changes)
│   ├── main.js           ← scroll animations, counters, smooth scroll
│   ├── popup.js          ← lead capture popup logic
│   ├── lead-capture-loader.js  ← deferred popup loader
│   └── tracking.js       ← GTM / GA4 / FB Pixel placeholders
└── img/                  ← all images (SEO-friendly filenames)
```

### Global Component Injection

Header and footer are NOT copy-pasted into every page. Instead:

- `js/components.js` injects them at runtime via `#site-header` / `#site-footer` divs
- `components.js` detects URL depth and adjusts relative asset paths (`basePath`):

| URL depth | Example | basePath |
|-----------|---------|----------|
| 0 (root) | `/index.html` | `''` |
| 2 | `/pages/rolunk/index.html` | `'../../'` |
| 3 | `/pages/rolunk/kedves-anya-es-apa/index.html` | `'../../../'` |

> Note: Depth 1 (`/pages/index.html`) doesn't exist — we always use a named subdir inside pages/.

### New Page Shell (depth 2 — pages/[slug]/)

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Oldal Cím – BagolykaLand Debrecen</title>
  <meta name="description" content="50-160 chars, unique per page" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://bagolykaland.hu/pages/[slug]/" />
  <meta property="og:title" content="Oldal Cím – BagolykaLand Debrecen" />
  <meta property="og:description" content="..." />
  <meta property="og:image" content="https://bagolykaland.hu/img/bagolykaland-fejleszto-foglalkozas.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="canonical" href="https://bagolykaland.hu/pages/[slug]/" />
  <link rel="icon" href="../../img/favicon.ico" type="image/x-icon" />
  <link rel="stylesheet" href="../../css/style.css" />
</head>
<body>
  <a href="#main-content" class="skip-link">Ugrás a tartalomhoz</a>
  <div id="site-header"></div>
  <main id="main-content">
    <!-- page content -->
  </main>
  <div id="site-footer"></div>
  <script src="../../js/components.js" defer></script>
  <script src="../../js/main.js" defer></script>
  <script src="../../js/lead-capture-loader.js"
          data-popup-css="../../css/popup.css"
          data-popup-src="../../js/popup.js"
          defer></script>
</body>
</html>
```

For depth 3, use `../../../` instead of `../../`.

### Tracking Codes

Placeholder stubs are in `js/tracking.js`. To activate:
1. Open `js/tracking.js`, paste real GTM / GA4 / FB Pixel IDs, uncomment blocks
2. Uncomment `<script src="js/tracking.js" defer></script>` in every HTML file (or add to components.js footer)

### Build Pipeline (activate when CSS/JS grows complex)

When ready to minify:
- Rename `css/style.css` → `css/style.src.css`
- Run `npm run build` → generates `css/style.css`
- Update HTML references with cache-busting: `css/style.css?v=YYYYMMDDHHII`
- **Never edit `.css` / `.js` directly once build is active — edit `.src.*` only**

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

## Navigation

**Only edit `js/components.js` to change nav.** The `NAV` array is the single source of truth. All dropdowns, mobile menu, and active-state highlighting are generated from it.

Current URL pattern: all subpages are under `/pages/` (e.g., `/pages/rolunk/`, `/pages/arlista/`).

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
| `favicon.ico` | TODO: add favicon |

Image rules:
- All `<img>` must have descriptive Hungarian `alt` text
- Hero images: `fetchpriority="high"`, no `loading="lazy"`
- All other images: `loading="lazy"`, include `width` + `height`
- Format: WebP preferred (run `npm run optimize:images`)

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

**5 places to update:**
1. Create `pages/[slug]/index.html` using the shell template above
2. Add to `_dev/tests/helpers/pages.js` (uncomment from planned list or add new entry)
3. Update nav in `js/components.js` if it needs a menu entry
4. Add a page-specific `og:image` if different from the default
5. Add to `sitemap.xml` when that file exists

---

## Auto-Deploy

Pushing to the `main` branch on GitHub automatically deploys to Hostinger via webhook.
- Webhook ID: 604098473 (Hostinger deploy webhook)
- GitHub repo: https://github.com/karolypaczari-afk/bagolykaland-hu

---

## Do NOT Break

1. Global component injection — every page must have `#site-header` and `#site-footer`
2. Relative asset paths — absolute paths (`/css/style.css`) break when opening files directly without a server
3. Hungarian `lang="hu"` on `<html>`
4. `<img>` width + height attributes — prevents CLS
5. `loading="lazy"` must NOT be on hero/LCP images
6. All pages must be under `pages/` (except `index.html`) — do not create root-level page directories
