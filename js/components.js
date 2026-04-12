/**
 * BAGOLYKALAND.HU — Global Components v2
 * Injects header + footer on every page.
 * Detects URL depth to compute correct relative asset paths.
 */
(function () {
  'use strict';

  /* ------------------------------------------
     DEPTH DETECTION
     Root   → basePath = ''
     Depth1 → basePath = '../'
     Depth2 → basePath = '../../'
  ------------------------------------------ */
  var depth = 0;
  var pathParts = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').split('/');
  if (pathParts[0] !== '' && pathParts[0] !== 'index.html') {
    depth = pathParts.length;
    // If last part looks like a file (has extension), don't count it
    if (/\.[a-z]+$/i.test(pathParts[pathParts.length - 1])) depth = Math.max(depth - 1, 0);
  }
  var basePath = depth === 0 ? '' : depth === 1 ? '../' : depth === 2 ? '../../' : '../../../';

  /* ------------------------------------------
     CONTACT INFO — update here
  ------------------------------------------ */
  var CONTACT = {
    phone:   '+36 30 364 9396',
    phoneHref: 'tel:+36303649396',
    email:   'fejlesztobagolyka@gmail.com',
    address: 'Debrecen belváros',
    hours:   'H–V: 9:00–17:00',
  };

  var SOCIAL_FB  = 'https://www.facebook.com/bagolykaland'; // TODO: confirm URL
  var SOCIAL_IG  = '';                                       // TODO: add if exists

  function track(eventName, params) {
    if (window.BKTracking && typeof window.BKTracking.trackEvent === 'function') {
      window.BKTracking.trackEvent(eventName, params || {});
    }
  }

  /* ------------------------------------------
     NAV STRUCTURE
  ------------------------------------------ */
  var NAV = [
    {
      label: 'Rólunk',
      url: '/pages/rolunk/',
      children: [
        { label: 'Kedves Anya és Apa',  url: '/pages/rolunk/kedves-anya-es-apa/' },
        { label: 'Kedves Gyermek',      url: '/pages/rolunk/kedves-gyermek/' },
      ],
    },
    {
      label: 'Foglalkozásaink',
      url: '/pages/foglalkozasaink/',
      children: [
        { label: 'Egyéni fejlesztő foglalkozások',  url: '/pages/foglalkozasaink/egyeni-fejleszto-foglalkozasok/' },
        { label: 'Logopédia',                        url: '/pages/foglalkozasaink/logopedia/' },
        { label: 'Mozgásfejlesztés',                 url: '/pages/foglalkozasaink/mozgasfejlesztes/' },
        { label: 'Szorongásoldó program',            url: '/pages/foglalkozasaink/szorongasoldo-program/' },
        { label: 'Iskola-előkészítő foglalkozás',    url: '/pages/foglalkozasaink/iskola-elokeszito-foglalkozas/' },
      ],
    },
    {
      label: 'Vizsgálatok',
      url: '/pages/vizsgalatok/',
      children: [
        { label: 'Logopédiai vizsgálat',              url: '/pages/vizsgalatok/logopediai-vizsgalat/' },
        { label: 'Iskolaérettségi vizsgálat',         url: '/pages/vizsgalatok/iskolaerettsegi-vizsgalat/' },
        { label: 'Komplex részképesség vizsgálat',    url: '/pages/vizsgalatok/komplex-reszkepesseg-vizsgalat/' },
      ],
    },
    {
      label: 'Programok',
      children: [
        { label: 'Ernyő alatt program',               url: '/pages/ernyo-alatt-program/' },
        { label: 'Kézen fogva – online finommotorika',url: '/pages/kezen-fogva-online-finommotorika-fejlesztes/' },
      ],
    },
    { label: 'Éves/heti rend', url: '/pages/eves-hetirend/' },
    { label: 'Blog',           url: '/pages/blog/' },
    { label: 'Galéria',        url: '/pages/galeria/' },
    { label: 'Árlista',        url: '/pages/arlista/' },
    { label: 'Kapcsolat',      url: '/pages/kapcsolat/' },
  ];

  /* ------------------------------------------
     FOOTER COLUMNS
  ------------------------------------------ */
  var FOOTER_SERVICES = [
    { label: 'Egyéni fejlesztő', url: '/pages/foglalkozasaink/egyeni-fejleszto-foglalkozasok/' },
    { label: 'Logopédia',        url: '/pages/foglalkozasaink/logopedia/' },
    { label: 'Mozgásfejlesztés', url: '/pages/foglalkozasaink/mozgasfejlesztes/' },
    { label: 'Szorongásoldó',    url: '/pages/foglalkozasaink/szorongasoldo-program/' },
    { label: 'Iskola-előkészítő',url: '/pages/foglalkozasaink/iskola-elokeszito-foglalkozas/' },
  ];
  var FOOTER_EXAMS = [
    { label: 'Logopédiai vizsgálat',    url: '/pages/vizsgalatok/logopediai-vizsgalat/' },
    { label: 'Iskolaérettségi vizsgálat',url: '/pages/vizsgalatok/iskolaerettsegi-vizsgalat/' },
    { label: 'Komplex részképesség',    url: '/pages/vizsgalatok/komplex-reszkepesseg-vizsgalat/' },
  ];

  /* ------------------------------------------
     SVG ICONS
  ------------------------------------------ */
  var IC = {
    chevDown: '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    chevRight:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    phone:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 13a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
    mail:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    pin:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    install:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v11"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    fb:       '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>',
  };

  /* ------------------------------------------
     LOGO HTML
  ------------------------------------------ */
  var logoHtml = [
    '<a href="/" class="site-logo" aria-label="BagolykaLand – Főoldal">',
    '  <img src="' + basePath + 'img/logo.jpg"',
    '       alt="BagolykaLand Oktató- és Fejlesztő Központ" width="52" height="52"',
    '       style="height:50px;width:auto;border-radius:8px;object-fit:contain;"',
    '       onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">',
    '  <span class="logo-text" style="display:none">',
    '    <span class="logo-name">BAGOLYKALAND</span>',
    '    <span class="logo-sub">Oktató- és Fejlesztő Központ</span>',
    '  </span>',
    '</a>'
  ].join('\n');

  /* ------------------------------------------
     BUILD NAV ITEMS (desktop)
  ------------------------------------------ */
  function buildDesktopNav() {
    return NAV.map(function(item) {
      if (item.children) {
        var parentLink = item.url ? '<a href="' + item.url + '" class="dropdown-parent-link">Összes ' + item.label + '</a>' : '';
        var dd = item.children.map(function(c) {
          return '<a href="' + c.url + '">' + c.label + '</a>';
        }).join('');
        return '<li class="nav-item">' +
          '<button class="nav-link" aria-expanded="false" aria-haspopup="true">' + item.label + IC.chevDown + '</button>' +
          '<div class="dropdown">' + parentLink + dd + '</div>' +
          '</li>';
      }
      return '<li class="nav-item"><a class="nav-link" href="' + item.url + '">' + item.label + '</a></li>';
    }).join('');
  }

  /* ------------------------------------------
     BUILD MOBILE NAV
  ------------------------------------------ */
  function buildMobileNav() {
    return NAV.map(function(item) {
      if (item.children) {
        var parentLink = item.url ? '<a href="' + item.url + '" class="mobile-dropdown-parent-link">Összes ' + item.label + '</a>' : '';
        var dd = item.children.map(function(c) {
          return '<a href="' + c.url + '">' + c.label + '</a>';
        }).join('');
        return '<li class="mobile-nav-item">' +
          '<button class="mobile-nav-link" aria-expanded="false">' + item.label + IC.chevRight + '</button>' +
          '<div class="mobile-dropdown">' + parentLink + dd + '</div>' +
          '</li>';
      }
      return '<li><a class="mobile-nav-link" href="' + item.url + '">' + item.label + '</a></li>';
    }).join('');
  }

  /* ------------------------------------------
     HEADER HTML
  ------------------------------------------ */
  var skipLinkHtml = document.querySelector('.skip-link')
    ? ''
    : '<a href="#main-content" class="skip-link">Ugrás a tartalomra</a>';

  var headerHTML = [
    skipLinkHtml,
    '<div class="site-announcement" role="status" aria-label="Költözési információ">',
    '  <div class="container site-announcement__inner">',
    '    <p><strong>Költözünk!</strong> 2026. május 1-től új címünk: <strong>Debrecen, Csokonai út 32.</strong></p>',
    '  </div>',
    '</div>',
    '<header class="site-header" id="site-header-el" role="banner">',
    '  <div class="container">',
    '    <div class="header-inner">',
    '      ' + logoHtml,
    '      <nav class="main-nav" aria-label="Főmenü">',
    '        <ul class="nav-list" role="list">' + buildDesktopNav() + '</ul>',
    '        <a href="/pages/kapcsolat/" class="nav-cta">📅 Időpontfoglalás</a>',
    '      </nav>',
    '      <div class="header-actions">',
    '        <button class="nav-install js-install-app" type="button" hidden aria-haspopup="dialog" aria-label="BagolykaLand telepítése">',
    '          ' + IC.install,
    '          <span class="nav-install-label">Telepítés</span>',
    '        </button>',
    '        <button class="hamburger" id="hamburger-btn" aria-label="Menü megnyitása" aria-expanded="false" aria-controls="mobile-nav">',
    '          <span></span><span></span><span></span>',
    '        </button>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</header>',
    '<nav class="mobile-nav" id="mobile-nav" aria-label="Mobil menü" aria-hidden="true">',
    '  <ul class="mobile-nav-list" role="list">' + buildMobileNav() + '</ul>',
    '  <a href="/pages/kapcsolat/" class="mobile-cta">📅 Időpontfoglalás</a>',
    '</nav>',
  ].filter(Boolean).join('\n');

  /* ------------------------------------------
     FOOTER HTML
  ------------------------------------------ */
  var servicesLinks = FOOTER_SERVICES.map(function(l){ return '<li><a href="'+l.url+'">'+l.label+'</a></li>'; }).join('');
  var examLinks     = FOOTER_EXAMS.map(function(l){ return '<li><a href="'+l.url+'">'+l.label+'</a></li>'; }).join('');

  var footerHTML = [
    '<footer class="site-footer" role="contentinfo">',
    '  <div class="container">',
    '    <div class="footer-top">',
    '      <div class="footer-brand">',
    '        ' + logoHtml.replace('site-logo"', 'site-logo footer-logo"'),
    '        <p>Szeretetteljes, szakszerű fejlesztő foglalkozások gyermekeknek Debrecenben.<br>Egy szerethető út, ami a tudáshoz vezet!</p>',
    '        <div class="footer-socials">',
    '          <a href="' + SOCIAL_FB + '" target="_blank" rel="noopener noreferrer" aria-label="Facebook">' + IC.fb + '</a>',
    '        </div>',
    '      </div>',
    '      <div class="footer-col">',
    '        <h4>Foglalkozásaink</h4>',
    '        <ul>' + servicesLinks + '</ul>',
    '      </div>',
    '      <div class="footer-col">',
    '        <h4>Vizsgálatok</h4>',
    '        <ul>' + examLinks + '</ul>',
    '      </div>',
    '      <div class="footer-col">',
    '        <h4>Kapcsolat</h4>',
    '        <div class="footer-contact-item">' + IC.pin  + '<span>' + CONTACT.address + '</span></div>',
    '        <div class="footer-contact-item">' + IC.phone + '<span><a href="' + CONTACT.phoneHref + '">' + CONTACT.phone + '</a></span></div>',
    '        <div class="footer-contact-item">' + IC.mail  + '<span><a href="mailto:' + CONTACT.email + '">' + CONTACT.email + '</a></span></div>',
    '        <div class="footer-contact-item">' + IC.clock + '<span>' + CONTACT.hours + '</span></div>',
    '      </div>',
    '    </div>',
    '    <div class="footer-bottom">',
    '      <p>© ' + new Date().getFullYear() + ' BagolykaLand Oktató- és Fejlesztő Központ. Minden jog fenntartva.</p>',
    '      <div class="footer-bottom-links">',
    '        <a href="/pages/adatkezelesi-tajekoztato/">Adatkezelési tájékoztató</a>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</footer>',
  ].join('\n');

  /* ------------------------------------------
     INJECT
  ------------------------------------------ */
  var headerMount = document.getElementById('site-header');
  var footerMount = document.getElementById('site-footer');
  if (headerMount) headerMount.outerHTML = headerHTML;
  if (footerMount) footerMount.outerHTML = footerHTML;

  /* ------------------------------------------
     SCROLL SHADOW
  ------------------------------------------ */
  var hdr = document.getElementById('site-header-el');
  if (hdr) {
    var onScroll = function(){ hdr.classList.toggle('scrolled', window.scrollY > 20); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------
     DESKTOP DROPDOWNS
  ------------------------------------------ */
  document.querySelectorAll('.nav-item .nav-link[aria-haspopup]').forEach(function(btn) {
    var item = btn.closest('.nav-item');
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.nav-item.open').forEach(function(el) {
        el.classList.remove('open');
        var b = el.querySelector('[aria-haspopup]');
        if (b) b.setAttribute('aria-expanded','false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded','true');
      }
    });
  });
  document.addEventListener('click', function() {
    document.querySelectorAll('.nav-item.open').forEach(function(el) {
      el.classList.remove('open');
      var b = el.querySelector('[aria-haspopup]');
      if (b) b.setAttribute('aria-expanded','false');
    });
  });

  /* ------------------------------------------
     MOBILE HAMBURGER
  ------------------------------------------ */
  var hamburger = document.getElementById('hamburger-btn');
  var mobileNav = document.getElementById('mobile-nav');
  if (hamburger && mobileNav) {
    mobileNav.setAttribute('inert', '');

    hamburger.addEventListener('click', function() {
      var open = hamburger.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
      mobileNav.classList.toggle('open', open);
      mobileNav.setAttribute('aria-hidden', !open);
      if (open) {
        mobileNav.removeAttribute('inert');
      } else {
        mobileNav.setAttribute('inert', '');
      }
      document.body.style.overflow = open ? 'hidden' : '';
      track('bk_mobile_nav_toggle', {
        nav_state: open ? 'open' : 'closed'
      });
    });
    mobileNav.querySelectorAll('.mobile-nav-item button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var li = btn.closest('.mobile-nav-item');
        li.classList.toggle('open');
        btn.setAttribute('aria-expanded', li.classList.contains('open'));
        track('bk_mobile_nav_section_toggle', {
          section_label: btn.textContent.replace(/\s+/g, ' ').trim(),
          section_state: li.classList.contains('open') ? 'open' : 'closed'
        });
      });
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded','false');
        mobileNav.setAttribute('aria-hidden','true');
        mobileNav.setAttribute('inert', '');
        document.body.style.overflow = '';
      }
    });
  }

  /* ------------------------------------------
     ACTIVE NAV LINK
  ------------------------------------------ */
  var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-link[href], .dropdown a, .mobile-nav-link[href], .mobile-dropdown a').forEach(function(link) {
    try {
      var lp = new URL(link.href, location.origin).pathname.replace(/\/$/, '') || '/';
      if (lp === currentPath) link.classList.add('active');
    } catch(e) {}
  });

  /* ------------------------------------------
     DISPATCH navReady for main.js
  ------------------------------------------ */
  document.dispatchEvent(new CustomEvent('navReady'));

})();
