# Bagolykaland.hu — Development TODOs

> Track all pending tasks here. Move items to DONE when completed.
> Site is **LIVE** at https://bagolykaland.hu

---

## 🔴 Pending

- [ ] **Tracking codes** — Ellenőrizni hogy a GTM/GA4/Meta Pixel ID-k be vannak-e állítva `js/tracking.src.js`-ben. Ha nem: Hostinger cPanel → phpMyAdmin → `bagolyka_wp1` → `wp_options` → `googlesitekit_analytics-4_settings`, `clarity_project_id`, `ihaf_insert_header`
- [ ] **MailerLite connection** — `js/popup.js`: `TODO_*_GROUP_ID` értékek cseréje valódi MailerLite group ID-kre; `window.BK_ML = { API_KEY: 'YOUR_KEY' }` beállítása
- [ ] **Social media URLs** — `js/components.src.js`: `SOCIAL_FB` és `SOCIAL_IG` változók valódi URL-ekre cserélése
- [ ] **Audit rerun** — `npm run test:seo`, `npm run test:images`, `npx playwright test _dev/tests/22-text-overflow.spec.js _dev/tests/26-asset-integrity.spec.js` lefuttatása, hibák javítása

---

## 🟡 Content / polish

- [ ] **Galériában lightbox** — `pages/galeria/` képekre lightbox funkció
- [ ] **OG image** — `img/og-image.jpg` 1200×630px dedikált social sharing kép (jelenleg a hero fotót használja)

---

## 📍 Google Business Profile

→ Részletek, copy-paste szövegek, MCP szerver setup: **`_dev/GBP.md`**

- [ ] GBP dashboard: cím, nyitvatartás, leírás, kategóriák, services, fotók
- [ ] NAP frissítés: nyitva.hu, cylex.hu, imami.hu
- [ ] QR-kód kinyomtatása (`qr-ertekeles.html`) → váróterembe
- [ ] GBP MCP szerver setup (review automation)

---

## ✅ Done

- [x] Site LIVE — https://bagolykaland.hu, DNS cutover, HTTPS aktív
- [x] Auto-deploy webhook — GitHub push → Hostinger auto-deploy
- [x] Build pipeline — `.src.css` / `.src.js` → minified, `buildHash.json` cache-busting
- [x] Eleventy SSG — `.njk` → `.html`, clean URL routing via `.htaccess`
- [x] Contact form — `api/contact.php` (PHP mailer, honeypot, rate limit, .htaccess védett)
- [x] Cookie consent — `js/cookie-consent.src.js`, GDPR-compliant, lazy-loaded
- [x] 404 oldal — `pages/404/index.njk`
- [x] Image optimization — WebP képek, `npm run optimize:images` pipeline kész
- [x] Favicon — 16×16, 32×32, 192×192, 512×512, apple-touch-icon
- [x] SEO — title/description minden oldalon, Debrecen kulcsszó, canonical, robots
- [x] LocalBusiness JSON-LD schema — teljes, Csokonai u. 32., árak, nyitvatartás, staff
- [x] QR-kód oldal — `qr-ertekeles.html` (Google értékelés link)
- [x] robots.txt + sitemap.xml
- [x] Security headers — `api/.htaccess`, `_setup.php` eltávolítva
- [x] Blog — 7 valódi bejegyzés
- [x] Összes service és vizsgálat aloldal kész
- [x] Szorongásoldó program oldal — teljes redesign
- [x] Nyári tábor oldal
- [x] Kézen Fogva online kurzus oldal
- [x] Meta CAPI relay — `api/meta-capi-relay.php`, `api/meta-capi.php`
- [x] Facebook Follow + Messenger FAB partial
- [x] PWA manifest + service worker (offline shell)
- [x] Playwright tesztek — 27+ spec fájl, chromium + iOS webkit
- [x] Project structure: `css/`, `js/`, `_dev/`, `img/`, `pages/`, `api/`
- [x] CLAUDE.md — teljes architektúra dokumentáció
- [x] GitHub repo — https://github.com/karolypaczari-afk/bagolykaland-hu
