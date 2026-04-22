# Bagolykaland.hu — Development TODOs

> Track all pending tasks here. Move items to DONE when completed.
> Site is **LIVE** at https://bagolykaland.hu

---

## 🔴 Pending

- [ ] **OG image** — `img/og-image.jpg` hiányzik (1200×630px). Jelenleg a hero fotót használja minden oldal. Készíts egy dedikált képet a brand színekkel + logóval.

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
- [x] Tracking codes — GA4 `G-86N523JP3E`, Clarity `rqnf90op5b`, Meta Pixel `9087042854758379` beállítva; GTM szándékosan üres
- [x] MailerLite — group ID `156829265225057690` + API key beállítva `scripts.njk`-ben
- [x] Social media URLs — `_data/site.json` → `site.social.facebook` kezeli, nem components.src.js
- [x] Gallery lightbox — `pages/galeria/index.html`-ben custom CSS+JS lightbox implementálva
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
