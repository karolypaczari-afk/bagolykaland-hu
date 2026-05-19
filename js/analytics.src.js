/**
 * BAGOLYKALAND.HU — Analytics enrichment layer
 *
 * Two responsibilities:
 *
 * 1) Attribution capture (runs first, before tracking-loader fires the GA4 config):
 *    Stores gclid/gbraid/wbraid/fbclid/msclkid/utm_* in a 90-day cookie + localStorage
 *    so a click-id reaches the lead-submit event even when the visitor converts on a
 *    later session. New click-ids overwrite (last-click); bare utm fills missing only.
 *
 * 2) GA4 custom event firings the platform doesn't auto-send (page_view is automatic):
 *    - view_service / view_assessment / view_program / view_camp / view_course
 *      (session-gated, fires once per slug per session)
 *    - phone_click / email_click
 *    - directions_click (Google Maps / útvonalterv link → local-intent signal)
 *    - cta_click  (program / service / contact / engagement)
 *    - scroll_depth_50 / scroll_depth_75 (GA4 only — Meta has its own path)
 *    - qualified_engagement (composite: view_service + scroll_50 + 30s dwell)
 *
 *  NOTE: This module does NOT fire a custom `form_start` event — GA4 Enhanced
 *  Measurement auto-tracks `form_start` natively. main.src.js fires its own
 *  prefixed `bk_form_start` for per-form telemetry without colliding with the
 *  auto-tracked event.
 *
 *  Exposes `window.BKAttribution` (read + clear) and `window.BKAnalytics`
 *  (`ga4Event`, `fireLead` — used by main.js form-submit success paths).
 *
 *  Every event params payload is auto-merged with stored attribution + page
 *  classification so GA4 reports + Google Ads imports see the click-id, content
 *  group, page category, and service slug on every hit without per-event plumbing.
 *
 *  Stays inert until the gtag stub exists in head.njk (always true) — it does NOT
 *  wait for the cookie banner because attribution capture happens regardless of
 *  consent (the cookie is first-party and contains no PII).
 */
(function () {
  'use strict';

  if (window.__BKAnalyticsInit) return;
  window.__BKAnalyticsInit = true;

  // ─── Attribution capture ─────────────────────────────────────────────────
  var COOKIE_NAME = 'bk_attrib';
  var COOKIE_DAYS = 90;
  var STORAGE_KEY = 'bk_attrib';
  var KEYS = [
    'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'
  ];

  function getCookie(name) {
    try {
      var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
  }

  function setCookie(name, value, days) {
    try {
      var d = new Date();
      d.setTime(d.getTime() + days * 86400000);
      var domain = location.hostname.indexOf('bagolykaland.hu') !== -1
        ? ';domain=.bagolykaland.hu' : '';
      document.cookie = name + '=' + encodeURIComponent(value) + domain +
        ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax;Secure';
    } catch (e) { /* silent */ }
  }

  function readStorage() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }

  function writeStorage(obj) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch (e) {}
  }

  function readCookieAttrib() {
    var raw = getCookie(COOKIE_NAME);
    if (!raw) return {};
    try { return JSON.parse(raw) || {}; } catch (e) { return {}; }
  }

  var url = new URL(location.href);
  var fromUrl = {};
  for (var i = 0; i < KEYS.length; i++) {
    var v = url.searchParams.get(KEYS[i]);
    if (v) fromUrl[KEYS[i]] = v;
  }
  var stored = Object.assign({}, readCookieAttrib(), readStorage());
  var hasNewClickId = fromUrl.gclid || fromUrl.gbraid || fromUrl.wbraid || fromUrl.fbclid || fromUrl.msclkid;
  var current;

  if (hasNewClickId) {
    // Fresh click → last-click attribution: overwrite stored.
    current = Object.assign({}, fromUrl);
    current.first_seen = new Date().toISOString();
    current.landing_page = location.pathname + location.search;
    current.referrer = document.referrer || '';
  } else if (Object.keys(fromUrl).length > 0) {
    // utm_* without a click id → fill missing only, keep prior click id.
    current = Object.assign({}, stored);
    for (var k in fromUrl) { if (!current[k]) current[k] = fromUrl[k]; }
    if (!current.first_seen) current.first_seen = new Date().toISOString();
    if (!current.landing_page) current.landing_page = location.pathname + location.search;
    if (!current.referrer) current.referrer = document.referrer || '';
  } else {
    current = stored;
  }

  if (Object.keys(current).length > 0) {
    writeStorage(current);
    setCookie(COOKIE_NAME, JSON.stringify(current), COOKIE_DAYS);
  }

  // ─── Page classification ────────────────────────────────────────────────
  function classifyPath(rawPath) {
    var p = (rawPath || location.pathname || '/').replace(/\/+$/, '') || '/';
    var category, slug;
    if (p === '/' || p === '') { category = 'home'; slug = 'home'; }
    else if (/\/nyari-tabor/.test(p))               { category = 'summer_camp';           slug = 'nyari-tabor'; }
    else if (/\/szorongasoldo/.test(p))             { category = 'program';               slug = 'szorongasoldo'; }
    else if (/\/nyari-iskola-elokeszito/.test(p))   { category = 'school_prep_intensive'; slug = 'nyari-iskola-elokeszito'; }
    else if (/\/iskola-elokeszito/.test(p))         { category = 'program';               slug = 'iskola-elokeszito'; }
    else if (/\/kezen-fogva/.test(p))               { category = 'online_course';         slug = 'kezen-fogva'; }
    else if (/^\/foglalkozasaink/.test(p))          { category = 'service';               slug = p.replace(/^\//, '') || 'foglalkozasaink'; }
    else if (/^\/vizsgalatok/.test(p))              { category = 'assessment';            slug = p.replace(/^\//, '') || 'vizsgalatok'; }
    else if (/^\/blog\//.test(p))                   { category = 'blog';                  slug = p.replace(/^\//, ''); }
    else if (/\/kapcsolat/.test(p))                 { category = 'contact';               slug = 'kapcsolat'; }
    else if (/\/rolunk/.test(p))                    { category = 'about';                 slug = 'rolunk'; }
    else if (/\/arlista/.test(p))                   { category = 'pricing';               slug = 'arlista'; }
    else                                            { category = 'other';                 slug = (p.replace(/^\//, '') || 'other'); }
    return {
      category: category,
      slug: slug,
      content_group: category,
      path: p,
      lang: 'hu'
    };
  }
  var pageCtx = classifyPath();

  // ─── Public attribution + classification API ─────────────────────────────
  function getEventParams() {
    var c = current || {}, out = {};
    for (var i = 0; i < KEYS.length; i++) {
      if (c[KEYS[i]]) out[KEYS[i]] = String(c[KEYS[i]]).slice(0, 100);
    }
    return out;
  }

  function getDefaultEventParams() {
    return Object.assign(getEventParams(), {
      content_group: pageCtx.content_group,
      page_category: pageCtx.category,
      service_slug: pageCtx.slug,
      lang: pageCtx.lang
    });
  }

  window.BKAttribution = {
    get: function () { return Object.assign({}, current); },
    getEventParams: getEventParams,
    getDefaultEventParams: getDefaultEventParams,
    pageCtx: function () { return Object.assign({}, pageCtx); },
    clear: function () {
      current = {};
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      setCookie(COOKIE_NAME, '', -1);
    }
  };

  // ─── gtag bridge — head.njk already defines the stub ────────────────────
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () { window.dataLayer.push(arguments); };
  }

  // Default params auto-attach to EVERY subsequent gtag('event', ...) including
  // the page_view that tracking-loader fires from gtag('config', ...). Since
  // analytics.js is in scripts.njk BEFORE tracking-loader.js, the default
  // params are set in time.
  window.gtag('set', getDefaultEventParams());

  // ─── GA4 helper that auto-merges defaults on each event ─────────────────
  function ga4Event(name, params) {
    var merged = Object.assign({}, getDefaultEventParams(), params || {});
    try { window.gtag('event', name, merged); } catch (e) {}
  }

  function fireOnce(key, fn) {
    try {
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
    } catch (e) { /* storage blocked → still fire */ }
    fn();
  }

  // ─── view_* events — high-intent landing pages ──────────────────────────
  var VIEW_EVENT = {
    summer_camp:           'view_camp',
    program:               'view_program',
    school_prep_intensive: 'view_program',
    online_course:         'view_course',
    service:               'view_service',
    assessment:            'view_assessment'
  };
  var viewEvent = VIEW_EVENT[pageCtx.category];
  if (viewEvent) {
    fireOnce('bk_' + viewEvent + '_' + pageCtx.slug, function () {
      ga4Event(viewEvent, {
        service_slug: pageCtx.slug,
        service_category: pageCtx.category
      });
    });
  }

  // ─── phone_click / email_click / directions_click ───────────────────────
  // directions_click: Google Maps / route-planner link → local-intent signal.
  // Debrecen-i fizikai helyszín → a térkép/útvonalterv kattintás
  // sales-fokus jelzés, amit a Smart Bidding (különösen a Performance Max +
  // local extensions) jól tud súlyozni. Pattern minden Maps-URL-re: google
  // maps subdomain, goo.gl/maps shortener, maps.app.goo.gl deep-link,
  // /dir/ vagy /directions útvonal-path.
  var MAPS_RE = /(google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl|maps\.google\.|\/dir\/|\/directions)/i;
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var text = (a.innerText || a.textContent || '').trim().slice(0, 80);
    if (href.indexOf('tel:') === 0) {
      ga4Event('phone_click', { link_url: href, link_text: text });
    } else if (href.indexOf('mailto:') === 0) {
      ga4Event('email_click', { link_url: href, link_text: text });
    } else if (MAPS_RE.test(href)) {
      ga4Event('directions_click', {
        link_url: href.slice(0, 200),
        link_text: text
      });
    }
  }, true);

  // ─── cta_click — program / service / contact / engagement ──────────────
  var CTA_HREF_RE = /(\/nyari-tabor|\/szorongasoldo|\/iskola-elokeszito|\/nyari-iskola-elokeszito|\/kezen-fogva|\/kapcsolat|\/foglalkozasaink|\/vizsgalatok|#program-signup|#program-form|#lead-catcher)/i;
  var CTA_BUTTON_SELECTOR = '.btn-coral, .btn-teal, .btn-primary, .nav-cta a, .v2-sticky-cta a, .announcement-bar a, [data-cta]';

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a[href], button') : null;
    if (!el) return;
    var href = (el.getAttribute && el.getAttribute('href')) || '';
    if (href.indexOf('tel:') === 0 || href.indexOf('mailto:') === 0) return;

    var isCtaButton = el.matches && el.matches(CTA_BUTTON_SELECTOR);
    var isCtaHref   = CTA_HREF_RE.test(href);
    if (!isCtaButton && !isCtaHref) return;

    var text = (el.innerText || el.textContent || '').trim().slice(0, 120);
    var cta_type =
      /\/nyari-tabor|\/szorongasoldo|\/iskola-elokeszito|\/nyari-iskola-elokeszito|\/kezen-fogva/.test(href)
        ? 'program'
      : /\/foglalkozasaink|\/vizsgalatok/.test(href)
        ? 'service'
      : /\/kapcsolat/.test(href)
        ? 'contact'
      : /#program-signup|#program-form|#lead-catcher/.test(href)
        ? 'form_anchor'
        : 'engagement';

    ga4Event('cta_click', {
      cta_type: cta_type,
      cta_text: text,
      cta_destination: href || '(button)'
    });
  }, true);

  // ─── scroll_depth_50 / scroll_depth_75 ─────────────────────────────────
  (function () {
    var fired = { 50: false, 75: false };
    var ticking = false;

    function check() {
      ticking = false;
      var doc = document.documentElement, body = document.body;
      var winH = window.innerHeight || doc.clientHeight;
      var docH = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight, doc.clientHeight);
      if (docH <= winH) return;
      var scrolled = (window.pageYOffset || doc.scrollTop || 0) + winH;
      var pct = Math.min(100, Math.round((scrolled / docH) * 100));

      if (!fired[50] && pct >= 50) {
        fired[50] = true;
        ga4Event('scroll_depth_50', { scroll_depth: 50 });
      }
      if (!fired[75] && pct >= 75) {
        fired[75] = true;
        ga4Event('scroll_depth_75', { scroll_depth: 75 });
      }
      if (fired[50] && fired[75]) {
        window.removeEventListener('scroll', onScroll);
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(check);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    if (document.readyState === 'complete') check();
    else window.addEventListener('load', check);
  })();

  // ─── form_start — DELIBERATELY NOT FIRED ───────────────────────────────
  // GA4 Enhanced Measurement auto-tracks `form_start` natively. Firing our
  // own `form_start` here would collide with the auto-tracked event in GA4
  // (same event name, different params) → noisy Smart Bidding signals.
  // Per-form telemetry lives in main.src.js as `bk_form_start` (prefixed).

  // ─── qualified_engagement — composite high-intent signal ────────────────
  // Tüzelési feltétel: high-intent page-kategória (camp, program, service,
  // assessment, online_course, school_prep_intensive) ÉS scroll ≥50% ÉS ≥30s
  // dwell. Smart Bidding-nek thin-data ablakban (havi pár tucat form-submit
  // mellett) ez stabil mintát ad, mielőtt elég macro-konverzió érkezne.
  // Per-session firing (sessionStorage) — egy session-ben egy LP-n max 1×.
  // GA4-only — Meta-pixelt nem terheljük, mert ott a ViewContent +
  // InitiateCheckout standard event-ek a high-intent signal-ek.
  (function () {
    var HIGH_INTENT_CATEGORIES = [
      'summer_camp',
      'program',
      'school_prep_intensive',
      'online_course',
      'service',
      'assessment'
    ];
    if (HIGH_INTENT_CATEGORIES.indexOf(pageCtx.category) === -1) return;

    var qualified = { view_intent: true, scroll_50: false, dwell_30s: false };
    var fired = false;

    function tryFire() {
      if (fired) return;
      if (!(qualified.view_intent && qualified.scroll_50 && qualified.dwell_30s)) return;
      var qeKey = 'bk_qualified_engagement_' + pageCtx.slug;
      try {
        if (sessionStorage.getItem(qeKey) === '1') { fired = true; return; }
        sessionStorage.setItem(qeKey, '1');
      } catch (e) { /* storage blocked → still fire */ }
      fired = true;
      ga4Event('qualified_engagement', {
        service_slug: pageCtx.slug,
        service_category: pageCtx.category,
        engagement_signals: 'view+scroll50+dwell30'
      });
    }

    // scroll_50 trigger — könnyű listener, csak az 50%-ot várja
    var scrollDone = false;
    function onScrollQE() {
      if (scrollDone) return;
      var doc = document.documentElement, body = document.body;
      var winH = window.innerHeight || doc.clientHeight;
      var docH = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight, doc.clientHeight);
      if (docH <= winH) {
        scrollDone = true;
        qualified.scroll_50 = true;
        tryFire();
        return;
      }
      var scrolled = (window.pageYOffset || doc.scrollTop || 0) + winH;
      var pct = Math.min(100, Math.round((scrolled / docH) * 100));
      if (pct >= 50) {
        scrollDone = true;
        qualified.scroll_50 = true;
        tryFire();
      }
    }
    window.addEventListener('scroll', onScrollQE, { passive: true });

    // dwell_30s trigger
    setTimeout(function () {
      qualified.dwell_30s = true;
      tryFire();
    }, 30000);

    // Ha rövid az oldal és már page-load-kor a viewport alja a doc alja
    setTimeout(onScrollQE, 0);
  })();

  // ─── Public GA4 helper for main.js form success handlers ───────────────
  // Lead-quality tiers a Smart Bidding signal-tisztaság érdekében. A
  // `lead_quality_tier` paraméter mindig egy custom dimensionbe kerül (lásd
  // _docs/analytics-tracking.md regisztrációs lista), így GA4-ben szűrhető és
  // a Google Ads-import konverziókat tier-enként lehet kezelni.
  //
  // Lead-magnet (popup/inline 5 ingyenes segédanyag) — alacsony LTV, magas
  // top-of-funnel volumen → 1000 Ft (conv-rate × LTV becslés: 2-3% × 30-50k Ft).
  // Korábban 3000 Ft volt, de a Smart Bidding ezzel túl értékesnek súlyozta a
  // lead-magnet-keresőszavakat. A magnet event GA4-ben NE legyen Key Event
  // (Karesz UI-task: GA4 → Admin → Events → generate_lead csak akkor Key
  // Event, ha lead_quality_tier != 'magnet').
  var LEAD_QUALITY_VALUES = {
    magnet:                1000,    // 5 ingyenes segédanyag (popup + inline)
    contact:               1500,    // generikus kapcsolatfelvétel
    career:                8000,    // állásjelentkezés
    program_inquiry:       5000,    // egyéb program érdeklődés
    summer_camp:          75000,    // Kincskereső tábor
    program_szorongas:    90000,    // Szorongásoldó program
    school_prep_intensive: 128000,  // Nyári intenzív iskola-előkészítő
    school_prep_academic: 252000    // Tanévi iskola-előkészítő
  };

  window.BKAnalytics = {
    ga4Event: ga4Event,
    pageCtx: pageCtx,
    /**
     * Fires GA4's recommended `generate_lead` event with a `lead_quality_tier`
     * custom param so GA4/Ads can segment by lead intent. Caller passes
     * `lead_quality_tier` (one of the LEAD_QUALITY_VALUES keys); if a value is
     * not provided, the tier-default value is used. This keeps the Smart
     * Bidding signal clean — lead-magnet (low-value, high-volume) doesn't
     * dilute program-signup (high-value, low-volume) optimization.
     */
    fireLead: function (params) {
      var p = params || {};
      var tier = p.lead_quality_tier || 'program_inquiry';
      var defaultValue = LEAD_QUALITY_VALUES[tier];
      ga4Event('generate_lead', Object.assign({
        currency: 'HUF',
        value: (typeof defaultValue === 'number') ? defaultValue : 3000,
        lead_quality_tier: tier
      }, p));
    }
  };
})();
