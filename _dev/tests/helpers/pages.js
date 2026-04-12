const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');

// Directories at project root that are infrastructure, not pages
const NON_PAGE_DIRS = new Set([
    'node_modules',
    '_dev',
    '_includes',
    '_data',
    '_site',
    'pages',            // source templates live here, HTML output is at root level
    'css',
    'js',
    'img',
    '.git',
    '.github',
    'playwright-report',
    'test-results',
]);

const PAGE_LABELS = {
    'index.html': 'Homepage',
    'adatkezelesi-tajekoztato/index.html': 'Adatkezelesi Tajekoztato',
    'arlista/index.html': 'Arlista',
    'blog/index.html': 'Blog',
    'blog/a-buntetes-mint-neveles-eszkoze/index.html': 'Blog - A buntetes mint a neveles eszkoze',
    'blog/figyelem-a-gyakorlas-a-tanulas-megutaltatasanak-egyik-legjobb-modja-lehet/index.html': 'Blog - Figyelem a gyakorlas',
    'blog/kire-utott-ez-a-gyerek/index.html': 'Blog - Kire utott ez a gyerek',
    'blog/szerinted-is-felesleges-divathobort-az-iskola-elokeszito/index.html': 'Blog - Iskola-elokeszito',
    'blog/te-is-kikered-a-gyermeked-velemenyet/index.html': 'Blog - Gyermeked velemenye',
    'blog/te-is-nehezen-viseled-hogy-folyton-rohangal-es-az-agyon-ugral-a-gyermeked/index.html': 'Blog - Rohangalas',
    'ernyo-alatt-program/index.html': 'Ernyo Alatt Program',
    'eves-hetirend/index.html': 'Eves Hetirend',
    'foglalkozasaink/index.html': 'Foglalkozasaink',
    'foglalkozasaink/egyeni-fejleszto-foglalkozasok/index.html': 'Egyeni Fejleszto Foglalkozasok',
    'foglalkozasaink/iskola-elokeszito-foglalkozas/index.html': 'Iskola-elokeszito Foglalkozas',
    'foglalkozasaink/logopedia/index.html': 'Logopedia',
    'foglalkozasaink/mozgasfejlesztes/index.html': 'Mozgasfejlesztes',
    'foglalkozasaink/szorongasoldo-program/index.html': 'Szorongasoldo Program',
    'galeria/index.html': 'Galeria',
    'kapcsolat/index.html': 'Kapcsolat',
    'kezen-fogva-online-finommotorika-fejlesztes/index.html': 'Kezen Fogva',
    'rolunk/index.html': 'Rolunk',
    'rolunk/kedves-anya-es-apa/index.html': 'Kedves Anya Es Apa',
    'rolunk/kedves-gyermek/index.html': 'Kedves Gyermek',
    'vizsgalatok/index.html': 'Vizsgalatok',
    'vizsgalatok/iskolaerettsegi-vizsgalat/index.html': 'Iskolaerettsegi Vizsgalat',
    'vizsgalatok/komplex-reszkepesseg-vizsgalat/index.html': 'Komplex Reszkepesseg Vizsgalat',
    'vizsgalatok/logopediai-vizsgalat/index.html': 'Logopediai Vizsgalat',
};

function walkIndexFiles(dir, isRoot = false) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (isRoot && NON_PAGE_DIRS.has(entry.name)) continue;
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkIndexFiles(fullPath, false));
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
    ...walkIndexFiles(ROOT, true),
].sort((left, right) => left.localeCompare(right));

const ALL_PAGES = DISCOVERED_PAGES.map(createPageEntry);

const FAST_PAGE_PATHS = new Set([
    'index.html',
    'foglalkozasaink/index.html',
    'vizsgalatok/index.html',
    'kapcsolat/index.html',
    'blog/index.html',
]);

const FAST_PAGES = ALL_PAGES.filter((page) => FAST_PAGE_PATHS.has(page.filePath));
const IOS_SMOKE_PAGES = FAST_PAGES.slice(0, 2);
const PAGES = process.env.FAST_MODE ? FAST_PAGES : ALL_PAGES;

const BREAKPOINTS = [
    { name: 'iPhone', width: 375 },
    { name: '480px', width: 480 },
    { name: 'tablet', width: 768 },
    { name: 'nav-switch', width: 1120 },
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
    { name: 'nav-switch', width: 1120 },
    { name: 'wide', width: 1440 },
];

const LANDING_PAGES = PAGES.filter((page) => !page.filePath.startsWith('blog/'));

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
    filePathToRoute,
    routeToFilePath,
};
