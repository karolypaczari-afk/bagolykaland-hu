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

**Direct gtag.js is the source of truth for GA4.** GTM container `GTM-M6H5WKVM` exists but has **0 published versions** — it is NOT in use. `gtmId` is intentionally blank in `js/tracking.src.js` so the loader loads `gtag.js` with `G-86N523JP3E` directly and fires `page_view`. Do NOT set `gtmId` again until someone publishes a real GTM version (empty container = silent analytics).

### Vendor config (`window.BK_TRACKING_CONFIG.vendors` in `js/tracking.src.js`)

| Key | Current | Purpose |
|-----|---------|---------|
| `gtmId` | *(empty — disabled)* | GTM-M6H5WKVM exists but has no published version. Leave blank until GTM is actually built out, otherwise the loader suppresses direct `gtag.js` and page_views stop. |
| `gaMeasurementId` | `G-86N523JP3E` | **Active.** Loaded directly by `tracking-loader` (since `gtmId` is blank) → sends `page_view` and drives GA4 / Google Ads Enhanced Conversions via `gtag('set','user_data',...)`. |
| `gAdsId` | *(empty)* | Google Ads conversion ID (`AW-xxx`). Scaffold ready — plug in, no other changes needed. |
| `gAdsLabel` | *(empty)* | Optional — primary conversion label. |
| `clarityId` | `rqnf90op5b` | Microsoft Clarity — loads its own SDK independently of GTM. |
| `metaPixelId` | `9087042854758379` | Meta Pixel — its own SDK, plus CAPI relay via `meta-enhance.src.js`. |

### Files

- `js/tracking.src.js` — vendor config + defaults
- `js/tracking-loader.src.js` — consent-gated bootstrap. Exposes `window.BKTracking`
- `js/meta-enhance.src.js` — Meta Pixel enrichment (CAPI, Advanced Matching, dedup eventIDs). Persists SHA-256 hashes into `localStorage` (`bk_meta_em_hash`, `bk_meta_ph_hash`, `bk_meta_fn_hash`, `bk_meta_ln_hash`) after any form submit — **these hashes are reused by Google Ads Enhanced Conversions, no extra tagging needed**
- `js/cookie-consent.src.js` — opt-out banner (consent granted by default on first visit, persists on scroll/click/button)
- `css/cookie-consent.css` — lazy-loaded by the banner

### Consent Mode v2 (set in `_includes/partials/head.njk`)

Opt-out model — all four storage flags `granted` by default. Extras:
- `wait_for_update: 500` — lets async banner updates reach tags before they fire
- `url_passthrough: true` — preserves `gclid` / `gbraid` / `wbraid` across nav when cookies blocked
- `ads_data_redaction: false` — full attribution kept (ad_storage is granted)

### Enhanced Conversions (Google Ads)

`BKTracking.pushEnhancedConversionsData(force)` reads the stored SHA-256 email/phone hashes (same source as Meta Advanced Matching) and pushes them via `gtag('set', 'user_data', {sha256_email_address, sha256_phone_number})`. Works with both GTM-managed tags and direct gtag.js. Auto-refreshed 250ms after form submit in `main.src.js` so the conversion event carries fresh identity.

### Clarity (beyond basic snippet)

After load, `configureClarity()` runs automatically:
- `clarity('set', 'page_type', ...)` + `clarity('set', 'program', ...)` — filter recordings by page type / program
- `clarity('identify', bk_ext_id)` — same external user ID as CAPI/Meta → lets you join Clarity recordings with funnel data
- `clarity('upgrade', 'high_intent_landing')` on high-intent pages (camp, szorongásoldó, kézen-fogva, kapcsolat, árlista, vizsgálatok, foglalkozások) — these survive Clarity's 100k/day sampling cap

### Preconnect vs dns-prefetch

`preconnect` is used in `head.njk` for domains that actually load on first paint (`googletagmanager.com`, `clarity.ms`, `connect.facebook.net`). `dns-prefetch` for secondary tracking beacons (`google-analytics.com`, `stats.g.doubleclick.net`, etc.).

### dataLayer custom events

GTM-friendly `bk_*` events already pushed: `bk_cta_click`, `bk_contact_click`, `bk_form_start`, `bk_form_submit`, `bk_mobile_nav_toggle`, `bk_install_click`, `bk_install_prompt_result`, `bk_app_installed`, `bk_cookie_banner_view`, `bk_cookie_consent_updated`, `bk_popup_*`, `bk_program_signup`.

### Meta event funnel (browser pixel + CAPI, shared `event_id` → dedup)

| Event | Fires when | Browser | Server |
|---|---|---|---|
| `PageView` | every page | `fbq('track', 'PageView')` | `api/meta-capi-relay.php` |
| `ViewContent` | high-intent LP (camp, szorongásoldó, kézen-fogva) | `meta-enhance.src.js` VIEW_CONTENT_MAP | relay |
| `InitiateCheckout` | first focus/input on any lead form | `meta-enhance.src.js` | relay |
| `CampApplication` | successful `/nyari-tabor/` form submit | `main.src.js:95` `fbq('trackCustom', 'CampApplication')` | `api/contact.php` → `meta-capi.php` `bk_meta_capi_send('CampApplication')` |
| `Lead` | other program/exam signups | `main.src.js` | `api/contact.php` |
| `Contact` | generic contact form | `main.src.js` | `api/contact.php` |

The current nyári tábor ad set optimizes on `CampApplication` via a custom conversion embedded in `promoted_object.pixel_rule`. Diagnose campaign-missing-conversions questions by splitting them: (a) did the event reach Meta? — check `api/logs/capi.log` for `http=200`; (b) did the campaign get credit? — check campaign performance actions. These are different questions; a lead from organic traffic is invisible to campaign insights but still appears in Events Manager.

### "Never break" rules

1. **GTM is currently disabled (`gtmId: ''`).** If you set it again without publishing a real GTM container version, page_views stop (loader skips direct gtag.js when `gtmId` is truthy). Check `https://tagmanager.google.com/` versions count before re-enabling.
2. Google Ads conversions: when `gAdsId` is added, use direct gtag.js (same path as GA4) OR publish a GTM container — not both.
3. `meta-enhance` hashes in `localStorage` are the authoritative source for Enhanced Conversions user-provided data — don't add a separate hashing path for Google Ads.
4. Pixel event names are case-sensitive. `CampApplication` ≠ `campapplication` ≠ `CAMPAPPLICATION`. Changing the event name in one place (JS, PHP, ad set rule) without the others silently breaks optimization.

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

Single `npm run build` is sufficient. The script runs `node _dev/build.js && npx @11ty/eleventy` in that order:

1. `_dev/build.js` minifies `.src.css` / `.src.js` and writes a fresh `_data/buildHash.json`
2. Eleventy then renders HTML with the just-written hash, so `?v={{ buildHash }}` matches the deployed assets

```bash
npm run build && git add -A && git commit -m "..." && git push
```

(Historical note: earlier the order was reversed — Eleventy ran first, reading the *previous* hash, so a second Eleventy pass was required. Fixed by flipping the script order.)

## Auto-Deploy

Push to `master` → GitHub webhook → Hostinger auto-deploy.
- GitHub repo: https://github.com/karolypaczari-afk/bagolykaland-hu
- Webhook deploys preserve gitignored files (e.g. `api/capi-config.php`, `api/smtp-config.php`, `api/admin-config.php`) — they live only on the server and survive deploys
- Verify a deploy landed: `curl -s https://bagolykaland.hu/ | grep -oE "\?v=[a-z0-9]+" | sort -u` → should match local `_data/buildHash.json`

---

## Hostinger server access

`public_html` root: `/home/u758116828/domains/bagolykaland.hu/public_html/`. The same `u758116828` account manages 10+ sibling sites (zsenibagoly.hu, kepzes.zsenibagoly.hu, zsenimazsolak.hu, etc.) — same SSH target, different `domains/<name>/public_html/` roots.

### Non-interactive SSH (preferred — works from Claude Code sandbox)

As of 2026-04-20 an ed25519 pubkey is uploaded to the Hostinger account (hPanel → Advanced → SSH Access → Manage SSH Keys). Local setup on the user's machine:
- Private key: `~/.ssh/id_bagoly_ed25519` (NTFS-ACL locked, never commit)
- SSH config alias: `Host bagoly` → `72.62.153.157:65002` as `u758116828`

Use it directly:
```bash
ssh bagoly "<remote command>"
scp -P 65002 <local> bagoly:<remote>
```

Password auth (`_dev/hostinger-ssh.env`, gitignored) is the fallback for new machines before a pubkey is set up. **Do NOT try to script password auth from the sandbox** — paramiko install, sshpass, SSH_ASKPASS, and interactive prompts are all blocked by the harness as "Remote Shell Writes to production".

### Server log files (`~/domains/bagolykaland.hu/public_html/api/logs/`)

| File | Written by | Contains |
|---|---|---|
| `submissions.log` | `api/contact.php` | Every form POST: timestamp, name, email, phone, program, turnus, src, page_url, referer, `_fbp`, `_fbc`, event_id, message |
| `capi.log` | `api/meta-capi.php` | Server-side Meta CAPI events (CampApplication, Lead, Contact). Format: `timestamp \| event \| id=<eid> \| http=<code>` |
| `capi-relay.log` | `api/meta-capi-relay.php` | Browser-initiated events relayed server-side (PageView, ViewContent, InitiateCheckout) — high volume |

Standard diagnostic:
```bash
ssh bagoly "cd ~/domains/bagolykaland.hu/public_html/api/logs && tail -30 capi.log && echo --- && tail -10 submissions.log"
```

**PII:** submissions.log holds name/email/phone/cookies. Excerpt only the relevant fields when sharing. Never commit, never paste into a PR description.

### Gitignored config files on server (preserved across deploys)

`api/capi-config.php`, `api/smtp-config.php`, `api/admin-config.php` live only on the server. Webhook deploys don't touch them. For edits use `scp bagoly:<path> ./` or the File Manager, never check them in.

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
10. Always run `npm run build` before pushing **frontend** changes (`.src.css`, `.src.js`, `.njk`, `_data/*.json` that drives templates) — regenerates buildHash so browsers fetch fresh assets. Skip the build for PHP/backend-only commits (`api/*.php`): no cache-bust needed, and running build would clobber any parallel session's in-progress assets.
