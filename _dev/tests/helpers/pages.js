const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const PAGES_ROOT = path.join(ROOT, 'pages');

const PAGE_LABELS = {
  'index.html': 'Homepage',
  'pages/adatkezelesi-tajekoztato/index.html': 'Adatkezelesi Tajekoztato',
  'pages/arlista/index.html': 'Arlista',
  'pages/blog/index.html': 'Blog',
  'pages/blog/a-buntetes-mint-neveles-eszkoze/index.html': 'Blog - A buntetes mint a neveles eszkoze',
  'pages/blog/figyelem-a-gyakorlas-a-tanulas-megutaltatasanak-egyik-legjobb-modja-lehet/index.html': 'Blog - Figyelem a gyakorlas',
  'pages/blog/kire-utott-ez-a-gyerek/index.html': 'Blog - Kire utott ez a gyerek',
  'pages/blog/szerinted-is-felesleges-divathobort-az-iskola-elokeszito/index.html': 'Blog - Iskola-elokeszito',
  'pages/blog/te-is-kikered-a-gyermeked-velemenyet/index.html': 'Blog - Gyermeked velemenye',
  'pages/blog/te-is-nehezen-viseled-hogy-folyton-rohangal-es-az-agyon-ugral-a-gyermeked/index.html': 'Blog - Rohangalas',
  'pages/ernyo-alatt-program/index.html': 'Ernyo Alatt Program',
  'pages/eves-hetirend/index.html': 'Eves Hetirend',
  'pages/foglalkozasaink/index.html': 'Foglalkozasaink',
  'pages/foglalkozasaink/egyeni-fejleszto-foglalkozasok/index.html': 'Egyeni Fejleszto Foglalkozasok',
  'pages/foglalkozasaink/iskola-elokeszito-foglalkozas/index.html': 'Iskola-elokeszito Foglalkozas',
  'pages/foglalkozasaink/logopedia/index.html': 'Logopedia',
  'pages/foglalkozasaink/mozgasfejlesztes/index.html': 'Mozgasfejlesztes',
  'pages/foglalkozasaink/szorongasoldo-program/index.html': 'Szorongasoldo Program',
  'pages/galeria/index.html': 'Galeria',
  'pages/kapcsolat/index.html': 'Kapcsolat',
  'pages/kezen-fogva-online-finommotorika-fejlesztes/index.html': 'Kezen Fogva',
  'pages/rolunk/index.html': 'Rolunk',
  'pages/rolunk/kedves-anya-es-apa/index.html': 'Kedves Anya Es Apa',
  'pages/rolunk/kedves-gyermek/index.html': 'Kedves Gyermek',
  'pages/vizsgalatok/index.html': 'Vizsgalatok',
  'pages/vizsgalatok/iskolaerettsegi-vizsgalat/index.html': 'Iskolaerettsegi Vizsgalat',
  'pages/vizsgalatok/komplex-reszkepesseg-vizsgalat/index.html': 'Komplex Reszkepesseg Vizsgalat',
  'pages/vizsgalatok/logopediai-vizsgalat/index.html': 'Logopediai Vizsgalat',
};

function walkIndexFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkIndexFiles(fullPath));
      continue;
    }

    if (entry.name === 'index.html') {
      files.push(path.relative(ROOT, fullPath).replace(/\\/g, '/'));
    }
  }

  return files;
}

function humanizeSlug(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function filePathToRoute(filePath) {
  if (filePath === 'index.html') {
    return '/index.html';
  }

  const directory = path.posix.dirname(filePath);
  return `/${directory}/`;
}

function routeToFilePath(route) {
  const cleanRoute = (route || '/')
    .split('#')[0]
    .split('?')[0]
    .replace(/\\/g, '/');

  if (cleanRoute === '/' || cleanRoute === '/index.html') {
    return 'index.html';
  }

  if (cleanRoute.endsWith('.html')) {
    return cleanRoute.replace(/^\//, '');
  }

  return `${cleanRoute.replace(/^\//, '').replace(/\/$/, '')}/index.html`;
}

function createPageEntry(filePath) {
  const label =
    PAGE_LABELS[filePath] ||
    humanizeSlug(path.posix.basename(path.posix.dirname(filePath)));

  return {
    name: label,
    path: filePathToRoute(filePath),
    filePath,
  };
}

const DISCOVERED_PAGES = [
  'index.html',
  ...walkIndexFiles(PAGES_ROOT),
].sort((left, right) => left.localeCompare(right));

const ALL_PAGES = DISCOVERED_PAGES.map(createPageEntry);

const FAST_PAGE_PATHS = new Set([
  'index.html',
  'pages/foglalkozasaink/index.html',
  'pages/vizsgalatok/index.html',
  'pages/kapcsolat/index.html',
  'pages/blog/index.html',
]);

const FAST_PAGES = ALL_PAGES.filter((page) => FAST_PAGE_PATHS.has(page.filePath));
const IOS_SMOKE_PAGES = FAST_PAGES.slice(0, 2);
const PAGES = process.env.FAST_MODE ? FAST_PAGES : ALL_PAGES;

const BREAKPOINTS = [
  { name: 'iPhone', width: 375 },
  { name: '480px', width: 480 },
  { name: 'tablet', width: 768 },
  { name: 'nav-switch', width: 900 },
  { name: 'desktop', width: 1200 },
  { name: 'wide', width: 1440 },
];

const VISUAL_BREAKPOINTS = [
  { name: 'mobile', width: 375 },
  { name: 'tablet', width: 768 },
  { name: 'desktop', width: 1200 },
];

const CORE_BREAKPOINTS = [
  { name: 'iPhone', width: 375 },
  { name: 'tablet', width: 768 },
  { name: 'desktop', width: 1200 },
];

const EXTRA_BREAKPOINTS = [
  { name: '480px', width: 480 },
  { name: 'nav-switch', width: 900 },
  { name: 'wide', width: 1440 },
];

const LANDING_PAGES = PAGES.filter((page) => !page.filePath.startsWith('pages/blog/'));

const CSS_FILES = ['css/style.css', 'css/popup.css'];

const KNOWN_ISSUES = {};

const SERVICE_PAGES = PAGES.filter((page) => page.filePath.includes('foglalkozasaink'));

const SITE_SELECTORS = {
  header: '.site-header',
  footer: '.site-footer',
  hamburger: '.hamburger',
  desktopNav: '.main-nav',
  mobileNav: '#mobile-nav',
  logo: '.site-header .site-logo img',
  footerLinks: '.site-footer a',
};

module.exports = {
  ALL_PAGES,
  BREAKPOINTS,
  CORE_BREAKPOINTS,
  CSS_FILES,
  EXTRA_BREAKPOINTS,
  FAST_PAGES,
  IOS_SMOKE_PAGES,
  KNOWN_ISSUES,
  LANDING_PAGES,
  PAGES,
  ROOT,
  SERVICE_PAGES,
  SITE_SELECTORS,
  VISUAL_BREAKPOINTS,
  routeToFilePath,
};
