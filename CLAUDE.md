# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Skills

Use the `Skill` tool to invoke these skills at the appropriate moments:

| Skill | Mikor használd |
|-------|---------------|
| `frontend-design` | Új oldal, szekció vagy UI komponens tervezésekor / építésekor |
| `hungarian-localization` | Magyar szöveg íráskor, ellenőrzéskor vagy fordításkor |

---

## Quick Commands

```bash
npm run serve          # Start local server at http://127.0.0.1:8080
npm run dev            # Eleventy watch mode (rebuilds .njk → .html on save)
npm run build          # Eleventy + minify .src.css/.src.js → production output
npm run build:css      # Minify CSS only
npm run build:js       # Minify JS only
npm run watch          # Auto-rebuild on .src.* file changes
npm run check          # Biome + HTML-validate + Stylelint (all linters)
npm test               # Full Playwright test suite (all pages, chromium + iOS webkit)
npm run test:quick     # Quick subset — homepage + smoke tests only
npm run test:fast      # FAST_MODE: homepage tests only
npm run test:smoke     # @smoke tagged tests only
npm run test:a11y      # Accessibility tests only
npm run test:seo       # SEO validation tests
npm run test:nav       # Mobile nav tests
npm run test:responsive  # Responsive layout tests
npm run test:security  # Security header tests
npm run test:images    # Image optimization tests
npm run test:visual    # Visual regression tests
npm run visual:update  # Update visual regression snapshots
npm run report         # Open Playwright HTML report
npm run optimize:images      # Convert _dev/input/ → img/ as WebP
npm run optimize:images:dry  # Dry-run (preview only)
```

Run a single test file:
```bash
npx playwright test _dev/tests/05-components.spec.js
npx playwright test _dev/tests/09-seo.spec.js --headed
```

Linters individually:
```bash
npm run biome:check        # JSON config files
npm run htmlvalidate:check # HTML validation
npm run lint:css           # CSS linting
```

---

## Architecture

**Eleventy static site generator → plain HTML/CSS/JS output. No framework, no WordPress.**

- Eleventy input and output are both `.` (project root)
- Only `.njk` files are processed (`templateFormats: ['njk']`)
- Source `.njk` and generated `.html` both live inside `pages/`
- `.htaccess` mod_rewrite maps clean public URLs (`/rolunk/`) to files on disk (`/pages/rolunk/index.html`)
- Homepage: `index.njk` → `index.html` at root
- Deploy: push to `master` on GitHub → Hostinger webhook auto-deploys

### URL Routing

Public URLs have **no `/pages/` prefix** — visitors see `/rolunk/`, `/blog/`, etc.

This works via three pieces:
1. **`pages/pages.11tydata.js`** — `eleventyComputed.permalink` keeps `/pages/` in the output path so HTML lands in `pages/`
2. **`pages/pages.11tydata.js`** — `eleventyComputed.canonical` strips `/pages/` so SEO URLs are clean
3. **`.htaccess`** — `RewriteRule` maps `/slug/` → `/pages/slug/` when a matching file exists; skips real root-level assets (css/, js/, img/, etc.)

### Source vs. Compiled Files (build is active)

The minification pipeline is **already running**. Both `.src.*` and compiled files exist side by side:

| Edit this | Produces | Tool |
|-----------|----------|------|
| `css/style.src.css` | `css/style.css` | clean-css |
| `js/components.src.js` | `js/components.js` | terser |
| `js/main.src.js` | `js/main.js` | terser |
| `js/cookie-consent.src.js` | `js/cookie-consent.js` | terser |
| `js/install-prompt.src.js` | `js/install-prompt.js` | terser |
| `js/tracking.src.js` | `js/tracking.js` | terser |
| `js/tracking-loader.src.js` | `js/tracking-loader.js` | terser |
| `js/lead-capture-loader.src.js` | `js/lead-capture-loader.js` | terser |

**Never edit `.css` or `.js` directly — edit `.src.*` files, then run `npm run build`.**

Files without `.src.*` variants (`js/popup.js`, `css/popup.css`, `css/cookie-consent.css`) are edited directly.

### Cache-Busting

`_data/buildHash.json` holds a short hash string. Templates reference it:
```
/css/style.css?v={{ buildHash }}
```
The build script (`_dev/build.js`) regenerates this hash on each build. This busts browser caches after deploys.

### Global Component Injection

Header and footer are rendered at **build time** by Eleventy — no runtime JS injection.

- `_includes/layouts/base.njk` — page shell (wraps `<html>`, `<head>`, `<body>`)
- `_includes/partials/head.njk` — `<head>` block; meta tags driven by front matter + `_data/site.json`
- `_includes/partials/header.njk` — announcement bar, site header, desktop mega-menu, mobile nav
- `_includes/partials/footer.njk` — footer columns, contact info, `{{ currentYear }}` copyright
- `_includes/partials/scripts.njk` — shared `<script>` tags with `?v={{ buildHash }}`
- Nav structure: `_data/nav.json` (single source of truth — **only edit there**)
- Contact info / social URLs: `_data/site.json`
- Asset paths use **absolute URLs** (`/css/style.css`, `/img/...`)
- `js/components.js` handles interactive behaviour only: dropdowns, hamburger, active link

### nav.json Mega-Menu Structure

Top-level nav items can have a `megaType` that controls rendering:

- `"catalog"` — grouped service/exam/program cards with icons, descriptions, badges
- `"about"` / `"knowledge"` — simpler link lists with optional featured content

Each item has: `label`, `url`, optional `icon` (WebP image path), `desc`, `badge`, `group`.
`megaExtra.sections` provides a secondary grouping with `parentLabel`/`parentUrl` for section headers.

### New Page

Create `pages/[slug]/index.njk` with front matter:

```njk
---
layout: "base.njk"
title: "Oldal Cím – BagolykaLand Debrecen"
description: "50-160 chars, unique per page"
ogImage: "https://bagolykaland.hu/img/custom.webp"  # omit to use site default
---

    <section class="page-hero" aria-labelledby="hero-heading">
      ...
    </section>

    <section class="section section-white">
      ...
    </section>
```

`permalink` and `canonical` are computed automatically by `pages.11tydata.js` — do not set them manually.

**4 places to update:**
1. Create `pages/[slug]/index.njk`
2. Add a label to `PAGE_LABELS` in `_dev/tests/helpers/pages.js`
3. Update `_data/nav.json` if it needs a menu entry (URL = `/[slug]/`, no `/pages/` prefix)
4. Add to `sitemap.xml`

Run `npm run eleventy` to generate `pages/[slug]/index.html`.

---

## Brand Colors

```css
:root {
  --clr-navy:    #1D3557;  /* Hero bg, headings */
  --clr-teal:    #2B746D;  /* Primary brand */
  --clr-coral:   #B35431;  /* CTA buttons */
  --clr-yellow:  #F5C640;  /* Accent */
  --clr-green:   #7ABF65;  /* Service accent */
  --clr-sky:     #6BA9D4;  /* Service accent */
  --clr-purple:  #9B7BC3;  /* Service accent */
  --clr-pink:    #E87BA8;  /* Service accent */
  --clr-royal:   #5B7DB0;  /* Service accent */
}
```

Each base color has `-light` and/or `-dark` variants (e.g. `--clr-teal-light: #E0F5F3`, `--clr-teal-dark: #1F5E59`). Navy has `-mid` and `-deep` variants.

Text colors: `--clr-text` (primary), `--clr-text-mid`, `--clr-text-muted`.
Backgrounds: `--clr-bg`, `--clr-bg-warm`, `--clr-bg-cream`.

Fonts: **Nunito** (headings, 700/800/900) + **Open Sans** (body, 400/600)

### Design Tokens

```css
/* Spacing scale */
--sp-xs: 0.25rem  --sp-sm: 0.5rem  --sp-md: 1rem  --sp-lg: 1.5rem
--sp-xl: 2rem     --sp-2xl: 3rem   --sp-3xl: 5rem --sp-4xl: 7.5rem

/* Border radius */
--r-sm: 6px  --r-md: 12px  --r-lg: 20px  --r-xl: 28px  --r-2xl: 40px  --r-full: 9999px

/* Shadows */
--sh-xs through --sh-xl   /* neutral elevation */
--sh-color-teal/coral/yellow  /* colored accent shadows */

/* Transitions */
--t-fast: 0.15s ease  --t-mid: 0.26s  --t-slow: 0.42s  --t-spring: 0.5s (bounce)
```

---

## CSS Architecture

Edit `css/style.src.css`, run `npm run build:css`. Service cards use a per-card `--accent` variable:
```html
<article class="service-card" style="--accent:#6BA9D4;">
```

Breakpoints:
- Nav hamburger: `max-width: 900px`
- Full mobile: `max-width: 640px`

---

## Component Reference

### Service Cards — critical HTML structure

**`service-card-top` must always be an empty div.** It is a 6px colored stripe. The icon, heading, text, and link go inside `service-card-body`.

```html
<!-- CORRECT -->
<article class="service-card fade-up stagger-1" style="--accent: #6BA9D4;">
  <div class="service-card-top"></div>
  <div class="service-card-body">
    <div class="service-icon"><img src="/img/service_logopedia_ai.webp" alt="..." width="48" height="48" /></div>
    <h3>Service Title</h3>
    <p>Description text.</p>
    <a href="/foglalkozasaink/logopedia/" class="service-link btn btn-teal">Részletek →</a>
  </div>
</article>

<!-- WRONG — do not put content inside service-card-top -->
<div class="service-card-top">
  <div class="service-icon">...</div>  ← crushed to 6px, invisible
</div>
```

Rich service cards (with feature list and price, used on `foglalkozasaink/`):

```html
<div class="service-card stagger-1" style="--accent: #6BA9D4">
  <div class="service-card-top"></div>
  <div class="service-card-body">
    <div class="service-icon"><img src="..." alt="..." width="48" height="48" /></div>
    <h3>Service Title</h3>
    <p>Description.</p>
    <ul class="service-card-list">
      <li>Feature one</li>
    </ul>
    <div class="service-card-price">10.000 Ft <span>/ 60 perc</span></div>
    <a href="/foglalkozasaink/..." class="service-link btn btn-teal">Részletek →</a>
  </div>
</div>
```

Dark-background variant:
```html
<div class="service-card service-card--dark stagger-6">
  <div class="service-card-top" style="background: var(--clr-yellow)"></div>
  <div class="service-card-body">...</div>
</div>
```

### Blog Cards — use blog-grid, NOT services-grid

```html
<div class="blog-grid">
  <article class="blog-card">
    <a href="/blog/slug/" class="blog-card-link">
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

### Inner Page Components

| Class | Purpose |
|-------|---------|
| `.lead` | Large intro paragraph |
| `.content-list` | Teal-bullet styled `<ul>` |
| `.process-steps` / `.process-step` | Numbered step flow |
| `.comparison-grid` / `.comparison-card` | Side-by-side option cards |
| `.program-variants` / `.variant-card` | Program option cards with `.variant-card__badge`, `__price` |
| `.skills-grid` / `.skill-item` | 4-col skill grid |
| `.highlight-box` | Callout block |

Standard inner page layout (with sidebar):
```html
<section class="section section-white">
  <div class="container">
    <div class="page-layout">
      <div class="content-block">
        <p class="lead">...</p>
        <h2>Section heading</h2>
        <ul class="content-list"><li>Item</li></ul>
        <div class="highlight-box">Callout.</div>
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

`pages/arlista/index.njk` and `pages/kapcsolat/index.njk` have page-specific `<style>` blocks that override global component styles. Do not remove without visual testing.

---

## Navigation

**Only edit `_data/nav.json` to change nav.** Header/footer partials loop over it at build time. `js/components.src.js` handles interactive behaviour (dropdowns, hamburger, active link).

Public URLs are clean: `/rolunk/`, `/arlista/` — no `/pages/` prefix. `.htaccess` handles the rewrite.

---

## Tracking + Consent Layer

- `js/tracking.src.js` — config file with `window.BK_TRACKING_CONFIG.vendors`
- Preferred: set `gtmId` only, manage GA4 / Meta / Clarity in GTM
- Available vendor keys: `gtmId`, `gaMeasurementId`, `clarityId`, `metaPixelId`
- `js/tracking-loader.src.js` stays inert until at least one vendor ID is configured
- `js/cookie-consent.src.js` only shows a banner when consent is needed + a vendor is configured
- `css/cookie-consent.css` is lazily loaded by the banner
- GTM-friendly custom events pushed to `dataLayer`: `bk_cta_click`, `bk_contact_click`, `bk_form_start`, `bk_form_submit`, `bk_mobile_nav_toggle`, `bk_install_click`, `bk_install_prompt_result`, `bk_app_installed`, `bk_cookie_banner_view`, `bk_cookie_consent_updated`, `bk_popup_*`

---

## Popup System

Lead capture popup: `js/popup.js` + `css/popup.css`, loaded deferred by `js/lead-capture-loader.src.js`.

- Triggers: exit-intent (desktop mouseleave), timed delay (10-15s), scroll 30-50%
- Fields: keresztnév + email
- Cookie key prefix: `bk_popup_dismissed_`
- MailerLite group IDs: set in `js/popup.js` (`ML_GROUPS` — currently TODO placeholders)
- MailerLite API key: set `window.BK_ML = { API_KEY: 'your-key' }` before popup.js loads

---

## Webapp Layer

- `manifest.webmanifest` + `service-worker.js` → installable PWA with offline shell
- `js/install-prompt.src.js` controls install button + iOS/in-app browser manual instructions
- App icons in `img/`: `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `favicon-192x192.png`, `favicon-512x512.png`

---

## Images

All images in `img/` with SEO-friendly Hungarian filenames, WebP preferred.

Rules:
- All `<img>` must have descriptive Hungarian `alt` text
- Hero/LCP images: `fetchpriority="high"`, **no** `loading="lazy"`
- All other images: `loading="lazy"`, include `width` + `height`
- **Never use WordPress URLs** (`/wp-content/uploads/...`)
- Run `npm run optimize:images` to convert `_dev/input/` → `img/` as WebP

---

## SEO Requirements (every page)

```html
<html lang="hu">
<title>Leíró Cím – BagolykaLand Debrecen</title>
<meta name="description" content="50-160 chars, unique">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://bagolykaland.hu/[slug]/">
<meta property="og:url" content="https://bagolykaland.hu/[slug]/">
<meta property="og:image" content="https://bagolykaland.hu/img/...">
<meta name="twitter:card" content="summary_large_image">
```

Canonical and og:url are auto-computed by `pages.11tydata.js` — never include `/pages/` in public URLs.

---

## Link Rules

| Destination | `target` | `rel` |
|-------------|----------|-------|
| Internal pages | none | — |
| External sites | `_blank` | `noopener noreferrer` |

---

## Pricing Format

Hungarian: thousand separator is **period** (`.`), decimal is **comma** (`,`).
- Correct: `10.000 Ft`, `28.000 Ft/hó`, `42.000 Ft`

---

## Testing

Playwright config (`playwright.config.js`):
- Tests in `_dev/tests/` (27+ spec files)
- Two browser projects: `chromium` (main) + `webkit-ios` (iPhone 13 — runs `00-ios-smoke.spec.js` only)
- Auto-starts `http-server` on port 8080
- Base URL: `http://127.0.0.1:8080`

---

## Pre-Push Checklist

**Always double-build before committing for a push.** One `npm run build` ships HTML with a 1-step-stale cache-buster — Eleventy reads `_data/buildHash.json` *before* `_dev/build.js` writes the new hash, so the HTML references the previous build's hash even as `buildHash.json` itself updates. A second Eleventy pass picks up the fresh hash:

```bash
npm run build && npx @11ty/eleventy && git add -A && git commit -m "..." && git push
```

What this does:
1. `npm run build`: Rebuilds Eleventy + minifies `.src.css` / `.src.js` → production files, then writes a **new** `_data/buildHash.json`
2. `npx @11ty/eleventy`: Re-renders HTML so `?v={{ buildHash }}` references match the freshly-written hash
3. Browsers fetch new CSS/JS on next visit (cache-busted)

Without the second pass, visitors may see the new HTML referencing an *older* `?v=` string — functionally the current JS still serves (the `?v=` is just a query string, not a fingerprint route), but repeat visitors whose browser cached the prior-deploy `?v=X` will keep using that cached copy for up to the asset TTL.

## Auto-Deploy

Push to `master` → GitHub webhook → Hostinger auto-deploy.
- GitHub repo: https://github.com/karolypaczari-afk/bagolykaland-hu
- Webhook deploys preserve gitignored files (e.g. `api/capi-config.php`, `api/smtp-config.php`, `api/admin-config.php`) — they live only on the server and survive deploys
- Verify a deploy landed: `curl -s https://bagolykaland.hu/ | grep -oE "\?v=[a-z0-9]+" | sort -u` → should match local `_data/buildHash.json`

---

## Hostinger server access (when gitignored files need to change)

Secrets live in `_dev/hostinger-ssh.env` (gitignored). The BagolyKaland public_html root is `/home/u758116828/domains/bagolykaland.hu/public_html/`. For single-file uploads (new `api/*-config.php`, emergency fixes), use the Hostinger File Manager or a one-shot `scp`. The Claude Code sandbox blocks scripted password-based SSH (paramiko, sshpass, askpass workarounds all trip "Production Deploy pathway"), so either:

- Ask the user to paste a one-line `scp -P 65002 <file> u758116828@72.62.153.157:<path>` into PowerShell (interactive password prompt), **or**
- Upload through hPanel → Files → File Manager (30 seconds, no shell).

The same SSH account manages 10+ sibling sites on this Hostinger seat (zsenibagoly.hu, kepzes.zsenibagoly.hu, zsenimazsolak.hu, etc.) — same credentials, different `domains/<name>/public_html/` roots.

---

## Meta Ads workspace

`_dev/meta-ads/CLAUDE.md` (gitignored, local-only) has the BagolyKaland ad account ID (`act_1172672534867644`), Pixel ID (`9087042854758379`), Business Manager ID, lifetime campaign snapshot, and Meta MCP tool playbook. Use the `mcp__meta-ads__*` tools for account access — do NOT read a Meta token from a sibling project's `.env`. Live campaigns = real spend: never create / resume / pause without explicit user confirmation.

---

## Parallel session hazards

When multiple Claude sessions edit this repo concurrently:
- Before `git add -A` or `git add img/` / `git add pages/`, run `git log --diff-filter=D --follow -- <path>` for untracked files — a recent delete commit is an intentional cleanup, don't re-add.
- After any push, `git fetch origin master` + `git log --oneline origin/master..HEAD`  — if the other session pushed ahead, reconcile (usually just keep their decisions and re-sync) rather than force-push over them.

---

## Do NOT Break

1. Edit `.njk` source files in `pages/`, NEVER generated `.html` — Eleventy overwrites them
2. Edit `.src.*` files, NEVER compiled `.css`/`.js` — build overwrites them
3. Asset paths use **absolute URLs** (`/css/style.css`, `/img/...`) — no `../../` relative paths
4. Public URLs have NO `/pages/` prefix — e.g. `/rolunk/` not `/pages/rolunk/`
5. Hungarian `lang="hu"` on `<html>`
6. `<img>` must have `width` + `height` attributes — prevents CLS
7. `loading="lazy"` must NOT be on hero/LCP images
8. `service-card-top` must always be empty — never put content inside it (6px stripe)
9. Never use BEM class names without first adding CSS for them to `style.src.css`
10. Always run `npm run build` before pushing — regenerates buildHash so browsers fetch fresh assets
