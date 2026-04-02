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

### Global Component Injection

Header and footer are NOT copy-pasted into every page. Instead:

- `js/components.js` injects them at runtime
- Every page has: `<div id="site-header"></div>` and `<div id="site-footer"></div>`
- `components.js` detects URL depth and adjusts asset paths:
  - Depth 0 (root `/index.html`) → `basePath = ''`
  - Depth 1 (`/rolunk/index.html`) → `basePath = '../'`
  - Depth 2 (`/rolunk/kedves-anya-es-apa/index.html`) → `basePath = '../../'`

### New Page Shell

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page Title – Bagolykaland</title>
  <meta name="description" content="50-160 chars, unique per page" />
  <link rel="canonical" href="https://bagolykaland.hu/page-slug/" />
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" />
  <!-- TODO: tracking codes -->
  <link rel="stylesheet" href="../css/style.css" />  <!-- adjust depth -->
</head>
<body>
  <div id="site-header"></div>
  <main id="main-content">
    <!-- page content -->
  </main>
  <div id="site-footer"></div>
  <script src="../js/components.js" defer></script>
  <script src="../js/main.js" defer></script>
</body>
</html>
```

### Tracking Codes

Placeholder tracking stubs are in `js/tracking.js`. To activate:
1. Uncomment the relevant block in `js/tracking.js`
2. Replace the TODO placeholder IDs with real ones
3. Uncomment `<script src="js/tracking.js" defer></script>` in every HTML file

### Build Pipeline (future)

When CSS/JS becomes complex enough to minify:
- Rename `css/style.css` → `css/style.src.css`
- Run `npm run build` → generates `css/style.css`
- Update HTML references to use `css/style.css?v=YYYYMMDDHHII` for cache busting
- **Never edit `.css` or `.js` directly once build is active — edit `.src.*` only**

---

## CSS Architecture

All styles are in `css/style.css` (global). Design tokens use CSS custom properties:

```css
:root {
  --clr-primary:       #2d6a4f;  /* Forest green */
  --clr-primary-light: #52b788;
  --clr-primary-dark:  #1b4332;
  --clr-secondary:     #f4a261;  /* Warm orange/peach */
  --clr-accent:        #e9c46a;  /* Golden yellow */
  --clr-bg:            #fef9f0;  /* Warm cream */
  --clr-bg-alt:        #f0f7f2;  /* Light mint green */
  --font-heading:      'Nunito', sans-serif;
  --font-body:         'Open Sans', sans-serif;
}
```

**Breakpoints:**
- Mobile-first
- Tablet: `max-width: 768px`
- Nav hamburger: `max-width: 900px`
- Full mobile: `max-width: 640px`

---

## Navigation

To add/remove/rename nav items — **only edit `js/components.js`**. The `NAV` array at the top is the single source of truth. All dropdowns and the mobile menu are generated from it.

---

## SEO Requirements (every page)

```html
<html lang="hu">
<title>Descriptive Title — Bagolykaland</title>
<meta name="description" content="50-160 chars, unique">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://bagolykaland.hu/path/">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:type" content="website">
<meta property="og:url" content="https://bagolykaland.hu/path/">
<meta property="og:image" content="https://bagolykaland.hu/img/og-image.jpg">
<meta property="og:locale" content="hu_HU">
<meta name="twitter:card" content="summary_large_image">
```

---

## Image Guidelines

- Format: **WebP** (use `_dev/scripts/optimize-images.js`)
- Hero images: `width` + `height` attributes, **no** `loading="lazy"`, `fetchpriority="high"`
- Below-fold images: `loading="lazy"` required, include `width` + `height` to prevent CLS
- All `<img>` must have descriptive Hungarian `alt` text
- OG image: `img/og-image.jpg` at 1200×630px

---

## Link Rules

| Destination | `target` | `rel` |
|-------------|----------|-------|
| Internal pages | none | — |
| External sites (Facebook, Instagram, gov, etc.) | `_blank` | `noopener noreferrer` |
| Privacy policy in form labels | `_blank` | `noopener noreferrer` |

---

## Tests

26 Playwright specs in `_dev/tests/`. Specs are adapted from zsenibagoly.hu.

When a new page is built, add it to `_dev/tests/helpers/pages.js`.

---

## Do NOT Break

1. Global component injection pattern — every page must have `#site-header` and `#site-footer`
2. Relative asset paths — absolute paths (`/css/style.css`) break when opening files directly
3. Hungarian `lang="hu"` on `<html>`
4. `<img>` width + height attributes — required to prevent CLS
5. `loading="lazy"` on hero images — **don't add it** (breaks LCP)

---

## Pricing Format (Hungarian)

- Thousand separator: **period** (`.`) — e.g., `5.970 Ft` not `5,970 Ft`

---

## Adding a New Page

**5 places to update:**
1. Create `[section]/index.html` using the page shell above
2. Add to `_dev/tests/helpers/pages.js` (uncomment from planned list)
3. Update nav in `js/components.js` if it needs to appear in the menu
4. Add `og:image` specific to the page if different from default
5. Update sitemap (once that's built)
