/**
 * BAGOLYKALAND.HU — Central page manifest for tests.
 * Every test spec imports from here — no hardcoded page lists elsewhere.
 *
 * As new pages are built, uncomment them from PLANNED_PAGES below
 * and move them into ALL_PAGES.
 */

const ALL_PAGES = [
  { name: 'Homepage', path: '/index.html' },

  // Uncomment as pages are built:
  // { name: 'Rólunk', path: '/rolunk/index.html' },
  // { name: 'Kedves Anya és Apa', path: '/rolunk/kedves-anya-es-apa/index.html' },
  // { name: 'Kedves Gyermek', path: '/rolunk/kedves-gyermek/index.html' },
  // { name: 'Foglalkozásaink', path: '/foglalkozasaink/index.html' },
  // { name: 'Logopédia', path: '/foglalkozasaink/logopedia/index.html' },
  // { name: 'Mozgásfejlesztés', path: '/foglalkozasaink/mozgasfejlesztes/index.html' },
  // { name: 'Egyéni fejlesztő', path: '/foglalkozasaink/egyeni-fejleszto-foglalkozasok/index.html' },
  // { name: 'Szorongásoldó', path: '/foglalkozasaink/szorongasoldo-program/index.html' },
  // { name: 'Iskola-előkészítő', path: '/foglalkozasaink/iskola-elokeszito-foglalkozas/index.html' },
  // { name: 'Vizsgálatok', path: '/vizsgalatok/index.html' },
  // { name: 'Logopédiai vizsgálat', path: '/vizsgalatok/logopediai-vizsgalat/index.html' },
  // { name: 'Iskolaérettségi vizsgálat', path: '/vizsgalatok/iskolaerettsegi-vizsgalat/index.html' },
  // { name: 'Komplex részképesség vizsgálat', path: '/vizsgalatok/komplex-reszkepesseg-vizsgalat/index.html' },
  // { name: 'Ernyő alatt program', path: '/ernyo-alatt-program/index.html' },
  // { name: 'Kézen fogva', path: '/kezen-fogva-online-finommotorika-fejlesztes/index.html' },
  // { name: 'Éves/heti rend', path: '/eves-hetirend/index.html' },
  // { name: 'Blog', path: '/blog/index.html' },
  // { name: 'Galéria', path: '/galeria/index.html' },
  // { name: 'Árlista', path: '/arlista/index.html' },
  // { name: 'Kapcsolat', path: '/kapcsolat/index.html' },
  // { name: 'Adatkezelési tájékoztató', path: '/adatkezelesi-tajekoztato/index.html' },
];

/**
 * Fast mode: representative subset.
 * Set FAST_MODE=1 to activate.
 */
const FAST_PAGES = [
  { name: 'Homepage', path: '/index.html' },
];

/**
 * iOS/WebKit smoke subset.
 */
const IOS_SMOKE_PAGES = [
  { name: 'Homepage', path: '/index.html' },
];

const PAGES = process.env.FAST_MODE ? FAST_PAGES : ALL_PAGES;

const BREAKPOINTS = [
  { name: 'iPhone',      width: 375 },
  { name: '480px',       width: 480 },
  { name: '640px',       width: 640 },
  { name: 'tablet',      width: 768 },
  { name: 'nav-switch',  width: 900 },  // bagolykaland nav switch at 900px
  { name: 'desktop',     width: 1200 },
  { name: 'wide',        width: 1440 },
];

const VISUAL_BREAKPOINTS = [
  { name: 'mobile',  width: 375 },
  { name: 'tablet',  width: 768 },
  { name: 'desktop', width: 1200 },
];

const CORE_BREAKPOINTS = [
  { name: 'iPhone',  width: 375 },
  { name: 'tablet',  width: 768 },
  { name: 'desktop', width: 1200 },
];

const EXTRA_BREAKPOINTS = [
  { name: '480px',      width: 480 },
  { name: '640px',      width: 640 },
  { name: 'nav-switch', width: 900 },
  { name: 'wide',       width: 1440 },
];

/** All CSS files used by the live site */
const CSS_FILES = [
  'css/style.css',
  // Add page-specific CSS files here as they're created:
  // 'css/rolunk.css',
  // 'css/foglalkozasaink.css',
  // 'css/kapcsolat.css',
];

const KNOWN_ISSUES = {
  // K1: { file: 'img/favicon.ico', issue: 'placeholder, not yet created' },
};

/** Pages that have service cards (service card section present) */
const SERVICE_PAGES = [
  { name: 'Homepage', path: '/index.html' },
];

module.exports = {
  ALL_PAGES,
  PAGES,
  FAST_PAGES,
  IOS_SMOKE_PAGES,
  BREAKPOINTS,
  VISUAL_BREAKPOINTS,
  CORE_BREAKPOINTS,
  EXTRA_BREAKPOINTS,
  CSS_FILES,
  KNOWN_ISSUES,
  SERVICE_PAGES,
};
