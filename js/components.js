/**
 * BAGOLYKALAND.HU — Global Components
 * Injects header and footer into every page.
 * Usage: include this script on every page before </body>
 */

(function () {
  'use strict';

  /* ------------------------------------------
     NAV DATA
     Update menu items and URLs here centrally.
  ------------------------------------------ */
  const NAV = [
    {
      label: 'Rólunk',
      children: [
        { label: 'Kedves Anya és Apa', url: '/rolunk/kedves-anya-es-apa/' },
        { label: 'Kedves Gyermek',     url: '/rolunk/kedves-gyermek/' },
      ],
    },
    {
      label: 'Foglalkozásaink',
      children: [
        { label: 'Egyéni fejlesztő foglalkozások', url: '/foglalkozasaink/egyeni-fejleszto-foglalkozasok/' },
        { label: 'Logopédia',                       url: '/foglalkozasaink/logopedia/' },
        { label: 'Mozgásfejlesztés',                url: '/foglalkozasaink/mozgasfejlesztes/' },
        { label: 'Szorongásoldó program',           url: '/foglalkozasaink/szorongasoldo-program/' },
        { label: 'Iskola-előkészítő foglalkozás',   url: '/foglalkozasaink/iskola-elokeszito-foglalkozas/' },
      ],
    },
    {
      label: 'Vizsgálatok',
      children: [
        { label: 'Logopédiai vizsgálat',             url: '/vizsgalatok/logopediai-vizsgalat/' },
        { label: 'Iskolaérettségi vizsgálat',        url: '/vizsgalatok/iskolaerettsegi-vizsgalat/' },
        { label: 'Komplex részképesség vizsgálat',   url: '/vizsgalatok/komplex-reszkepesseg-vizsgalat/' },
      ],
    },
    {
      label: 'Programok',
      children: [
        { label: 'Ernyő alatt program',                      url: '/ernyo-alatt-program/' },
        { label: 'Kézen fogva – online finommotorika',        url: '/kezen-fogva-online-finommotorika-fejlesztes/' },
      ],
    },
    { label: 'Éves/heti rend', url: '/eves-hetirend/' },
    { label: 'Blog',    url: '/blog/' },
    { label: 'Galéria', url: '/galeria/' },
    { label: 'Árlista', url: '/arlista/' },
  ];

  const FOOTER_COLS = [
    {
      heading: 'Foglalkozásaink',
      links: [
        { label: 'Egyéni fejlesztő foglalkozások', url: '/foglalkozasaink/egyeni-fejleszto-foglalkozasok/' },
        { label: 'Logopédia',                       url: '/foglalkozasaink/logopedia/' },
        { label: 'Mozgásfejlesztés',                url: '/foglalkozasaink/mozgasfejlesztes/' },
        { label: 'Szorongásoldó program',           url: '/foglalkozasaink/szorongasoldo-program/' },
        { label: 'Iskola-előkészítő',               url: '/foglalkozasaink/iskola-elokeszito-foglalkozas/' },
      ],
    },
    {
      heading: 'Vizsgálatok',
      links: [
        { label: 'Logopédiai vizsgálat',           url: '/vizsgalatok/logopediai-vizsgalat/' },
        { label: 'Iskolaérettségi vizsgálat',      url: '/vizsgalatok/iskolaerettsegi-vizsgalat/' },
        { label: 'Komplex részképesség vizsgálat', url: '/vizsgalatok/komplex-reszkepesseg-vizsgalat/' },
      ],
    },
    {
      heading: 'Kapcsolat',
      contact: true,
    },
  ];

  /* ------------------------------------------
     CONTACT & SOCIAL — update these values
  ------------------------------------------ */
  const CONTACT = {
    address:  'Budapest, [Utca, házszám]',  // TODO: fill in real address
    phone:    '+36 XX XXX XXXX',             // TODO: fill in real phone
    email:    'info@bagolykaland.hu',
    hours:    'H–P: 8:00–18:00',
  };

  const SOCIALS = [
    {
      name: 'Facebook',
      url:  'https://facebook.com/',         // TODO: fill in real URL
      svg:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
    },
    {
      name: 'Instagram',
      url:  'https://instagram.com/',        // TODO: fill in real URL
      svg:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    },
  ];

  /* ------------------------------------------
     SVG ICONS
  ------------------------------------------ */
  const icons = {
    chevronDown: `<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
    chevronRight:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    phone:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    mail:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    mapPin:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    clock:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  };

  /* ------------------------------------------
     HEADER HTML
  ------------------------------------------ */
  function buildNavItems(isMobile) {
    if (isMobile) {
      return NAV.map((item, i) => {
        if (item.children) {
          const children = item.children.map(c =>
            `<a href="${c.url}">${c.label}</a>`
          ).join('');
          return `
            <li class="mobile-nav-item">
              <button class="mobile-nav-link" aria-expanded="false">
                ${item.label} ${icons.chevronRight}
              </button>
              <div class="mobile-dropdown" role="region">${children}</div>
            </li>`;
        }
        return `<li><a class="mobile-nav-link" href="${item.url}">${item.label}</a></li>`;
      }).join('');
    }

    return NAV.map(item => {
      if (item.children) {
        const dropdown = item.children.map(c =>
          `<a href="${c.url}">${c.label}</a>`
        ).join('');
        return `
          <li class="nav-item" role="none">
            <button class="nav-link" aria-expanded="false" aria-haspopup="true">
              ${item.label} ${icons.chevronDown}
            </button>
            <div class="dropdown" role="menu">${dropdown}</div>
          </li>`;
      }
      return `<li class="nav-item"><a class="nav-link" href="${item.url}">${item.label}</a></li>`;
    }).join('');
  }

  const headerHTML = `
    <a href="#main-content" class="skip-link">Ugrás a tartalomra</a>
    <header class="site-header" id="site-header-el" role="banner">
      <div class="container">
        <div class="header-inner">
          <a href="/" class="site-logo" aria-label="Bagolykaland – Főoldal">
            <div class="logo-icon" aria-hidden="true">🦉</div>
            <div>
              <span>Bagolykaland</span>
              <span class="logo-sub">Fejlesztő Központ</span>
            </div>
          </a>

          <nav class="main-nav" aria-label="Főmenü">
            <ul class="nav-list" role="list">
              ${buildNavItems(false)}
            </ul>
            <a href="/kapcsolat/" class="nav-cta">Időpontfoglalás</a>
          </nav>

          <button class="hamburger" id="hamburger-btn" aria-label="Menü megnyitása" aria-expanded="false" aria-controls="mobile-nav">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>

    <nav class="mobile-nav" id="mobile-nav" aria-label="Mobil menü" aria-hidden="true">
      <ul class="mobile-nav-list" role="list">
        ${buildNavItems(true)}
      </ul>
      <a href="/kapcsolat/" class="mobile-cta">📅 Időpontfoglalás</a>
    </nav>
  `;

  /* ------------------------------------------
     FOOTER HTML
  ------------------------------------------ */
  function buildFooterCols() {
    return FOOTER_COLS.map(col => {
      if (col.contact) {
        return `
          <div class="footer-col">
            <h4>${col.heading}</h4>
            <div class="footer-contact-item">${icons.mapPin}<span>${CONTACT.address}</span></div>
            <div class="footer-contact-item">${icons.phone}<span><a href="tel:${CONTACT.phone.replace(/\s/g,'')}">${CONTACT.phone}</a></span></div>
            <div class="footer-contact-item">${icons.mail}<span><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></span></div>
            <div class="footer-contact-item">${icons.clock}<span>${CONTACT.hours}</span></div>
          </div>`;
      }
      const links = col.links.map(l => `<li><a href="${l.url}">${l.label}</a></li>`).join('');
      return `<div class="footer-col"><h4>${col.heading}</h4><ul>${links}</ul></div>`;
    }).join('');
  }

  const footerHTML = `
    <footer class="site-footer" role="contentinfo">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="/" class="site-logo" aria-label="Bagolykaland – Főoldal">
              <div class="logo-icon" aria-hidden="true">🦉</div>
              <div>
                <span>Bagolykaland</span>
                <span class="logo-sub">Fejlesztő Központ</span>
              </div>
            </a>
            <p>Szeretetteljes, szakszerű fejlesztő foglalkozások gyermekek számára. Mert minden kis kalandor egyedi úton jár.</p>
            <div class="footer-socials">
              ${SOCIALS.map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.name}">${s.svg}</a>`).join('')}
            </div>
          </div>
          ${buildFooterCols()}
        </div>

        <div class="footer-bottom">
          <p>© ${new Date().getFullYear()} Bagolykaland Fejlesztő Központ. Minden jog fenntartva.</p>
          <div class="footer-bottom-links">
            <a href="/adatkezelesi-tajekoztato/">Adatkezelési tájékoztató</a>
          </div>
        </div>
      </div>
    </footer>
  `;

  /* ------------------------------------------
     INJECT COMPONENTS
  ------------------------------------------ */
  const headerMount = document.getElementById('site-header');
  const footerMount = document.getElementById('site-footer');

  if (headerMount) headerMount.outerHTML = headerHTML;
  if (footerMount) footerMount.outerHTML = footerHTML;

  /* ------------------------------------------
     HEADER: scroll shadow
  ------------------------------------------ */
  const header = document.getElementById('site-header-el');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------
     HEADER: desktop dropdown via click/keyboard
  ------------------------------------------ */
  document.querySelectorAll('.nav-item .nav-link[aria-haspopup]').forEach(btn => {
    const item = btn.closest('.nav-item');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.nav-item.open').forEach(el => {
        el.classList.remove('open');
        el.querySelector('[aria-haspopup]').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-item.open').forEach(el => {
      el.classList.remove('open');
      el.querySelector('[aria-haspopup]').setAttribute('aria-expanded', 'false');
    });
  });

  /* ------------------------------------------
     HEADER: mobile hamburger
  ------------------------------------------ */
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      mobileNav.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on outside click
    mobileNav.addEventListener('click', (e) => {
      if (e.target === mobileNav) {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });

    // Mobile accordion dropdowns
    mobileNav.querySelectorAll('.mobile-nav-item button').forEach(btn => {
      btn.addEventListener('click', () => {
        const li = btn.closest('.mobile-nav-item');
        li.classList.toggle('open');
        btn.setAttribute('aria-expanded', li.classList.contains('open'));
      });
    });
  }

  /* ------------------------------------------
     ACTIVE NAV LINK
     Marks the current page's nav link as active.
  ------------------------------------------ */
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  document.querySelectorAll('.nav-link[href], .dropdown a, .mobile-nav-link[href], .mobile-dropdown a').forEach(link => {
    const linkPath = new URL(link.href, location.origin).pathname.replace(/\/$/, '') || '/';
    if (linkPath === path) link.classList.add('active');
  });

})();
