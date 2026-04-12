#!/usr/bin/env node
/**
 * BAGOLYKALAND.HU — Build script
 * Minifies .src.css → .css, .src.js → .js and normalizes shared HTML shell markup.
 *
 * Usage:
 *   node _dev/build.js                    # rebuild everything
 *   node _dev/build.js --type css         # CSS only
 *   node _dev/build.js --type js          # JS only
 *   node _dev/build.js --type html        # HTML normalization only
 *   node _dev/build.js --file index.html  # single HTML file
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

let singleFile = null;
let typeFilter = null;

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--file' && args[i + 1]) {
    singleFile = args[++i].replace(/\\/g, '/');
  } else if (args[i] === '--type' && args[i + 1]) {
    typeFilter = args[++i];
  }
}

function getFiles(dir, ext) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];

  return fs
    .readdirSync(fullDir)
    .filter((file) => file.endsWith(ext))
    .map((file) => (dir === '.' ? file : `${dir}/${file}`));
}

function getFilesRecursive(dir, ext) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];

  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const relPath = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursive(relPath, ext));
      return;
    }
    if (entry.name.endsWith(ext)) {
      files.push(relPath);
    }
  });

  return files;
}

function getHtmlFiles() {
  return []
    .concat(getFiles('.', '.html'))
    .concat(getFilesRecursive('pages', '.html'))
    .sort((left, right) => left.localeCompare(right));
}

function minifyCSS(srcPath) {
  const outPath = srcPath.replace('.src.css', '.css');
  const absSrc = path.join(ROOT, srcPath);
  const absOut = path.join(ROOT, outPath);

  try {
    execSync(`npx clean-css-cli "${absSrc}" -o "${absOut}"`, { cwd: ROOT, stdio: 'pipe' });
    const srcSize = fs.statSync(absSrc).size;
    const outSize = fs.statSync(absOut).size;
    const pct = ((1 - outSize / srcSize) * 100).toFixed(0);
    console.log(`  ✓ ${srcPath} → ${outPath} (${srcSize} → ${outSize}, -${pct}%)`);
  } catch (error) {
    console.error(`  ✗ ${srcPath}: ${error.message}`);
    process.exitCode = 1;
  }
}

function minifyJS(srcPath) {
  const outPath = srcPath.replace('.src.js', '.js');
  const absSrc = path.join(ROOT, srcPath);
  const absOut = path.join(ROOT, outPath);

  try {
    execSync(`npx terser "${absSrc}" -c -m -o "${absOut}"`, { cwd: ROOT, stdio: 'pipe' });
    const srcSize = fs.statSync(absSrc).size;
    const outSize = fs.statSync(absOut).size;
    const pct = ((1 - outSize / srcSize) * 100).toFixed(0);
    console.log(`  ✓ ${srcPath} → ${outPath} (${srcSize} → ${outSize}, -${pct}%)`);
  } catch (error) {
    console.error(`  ✗ ${srcPath}: ${error.message}`);
    process.exitCode = 1;
  }
}

function getHtmlAssetPrefix(htmlPath) {
  const htmlDir = path.join(ROOT, path.posix.dirname(htmlPath));
  const rel = path.relative(htmlDir, ROOT).replace(/\\/g, '/');
  return rel ? `${rel}/` : '';
}

function ensureViewportMeta(content) {
  const viewportTag = '  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />';

  if (/<meta name="viewport"[^>]*viewport-fit=cover/i.test(content)) {
    return content.replace(/^[ \t]*<meta name="viewport"[^>]*>\r?\n?/im, `${viewportTag}\n`);
  }

  if (/<meta name="viewport"[^>]*>/i.test(content)) {
    return content.replace(/^[ \t]*<meta name="viewport"[^>]*>\r?\n?/im, `${viewportTag}\n`);
  }

  if (/<meta charset="[^"]*"[^>]*>\r?\n?/i.test(content)) {
    return content.replace(/(<meta charset="[^"]*"[^>]*>\r?\n?)/i, `$1${viewportTag}\n`);
  }

  return content;
}

function stripPatterns(content, patterns) {
  return patterns.reduce((current, pattern) => current.replace(pattern, ''), content);
}

function buildSharedAppInstallMarkup(assetPrefix) {
  return [
    '  <!-- App install -->',
    '  <meta name="theme-color" content="#2B746D" />',
    '  <meta name="application-name" content="BagolykaLand" />',
    '  <meta name="apple-mobile-web-app-capable" content="yes" />',
    '  <meta name="apple-mobile-web-app-status-bar-style" content="default" />',
    '  <meta name="apple-mobile-web-app-title" content="BagolykaLand" />',
    '  <meta name="mobile-web-app-capable" content="yes" />',
    `  <link rel="icon" type="image/png" sizes="32x32" href="${assetPrefix}img/favicon-32x32.png" />`,
    `  <link rel="icon" type="image/png" sizes="16x16" href="${assetPrefix}img/favicon-16x16.png" />`,
    `  <link rel="apple-touch-icon" sizes="180x180" href="${assetPrefix}img/apple-touch-icon.png" />`,
    `  <link rel="manifest" href="${assetPrefix}manifest.webmanifest" />`,
  ].join('\n');
}

function buildSharedScriptMarkup(assetPrefix) {
  return [
    '  <!-- Scripts -->',
    `  <script src="${assetPrefix}js/components.js" defer></script>`,
    `  <script src="${assetPrefix}js/install-prompt.js" defer></script>`,
    `  <script src="${assetPrefix}js/tracking.js" defer></script>`,
    `  <script src="${assetPrefix}js/tracking-loader.js" defer></script>`,
    `  <script src="${assetPrefix}js/cookie-consent.js" defer></script>`,
    `  <script src="${assetPrefix}js/main.js" defer></script>`,
  ].join('\n');
}

function insertSharedAppMarkup(content, sharedMarkup) {
  if (/<link rel="canonical"[^>]*>\r?\n?/i.test(content)) {
    return content.replace(/([ \t]*<link rel="canonical"[^>]*>\r?\n?)/i, `${sharedMarkup}\n\n$1`);
  }

  if (/<meta name="robots"[^>]*>\r?\n?/i.test(content)) {
    return content.replace(/([ \t]*<meta name="robots"[^>]*>\r?\n?)/i, `${sharedMarkup}\n\n$1`);
  }

  return content.replace(/([ \t]*<title>)/i, `${sharedMarkup}\n\n$1`);
}

function insertSharedScriptMarkup(content, sharedMarkup) {
  if (/[ \t]*<script[^>]*lead-capture-loader\.js[^>]*>\s*<\/script>\r?\n?/i.test(content)) {
    return content.replace(
      /([ \t]*<script[^>]*lead-capture-loader\.js[^>]*>\s*<\/script>\r?\n?)/i,
      `${sharedMarkup}\n$1`
    );
  }

  return content.replace(/([ \t]*<\/body>)/i, `${sharedMarkup}\n\n$1`);
}

function normalizeWhitespace(content) {
  return content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n');
}

function normalizeHtmlSharedMarkup(content, htmlPath) {
  const assetPrefix = getHtmlAssetPrefix(htmlPath);

  const appInstallPatterns = [
    /^[ \t]*<!-- App install -->\r?\n?/gm,
    /^[ \t]*<meta name="theme-color"[^>]*>\r?\n?/gm,
    /^[ \t]*<meta name="application-name"[^>]*>\r?\n?/gm,
    /^[ \t]*<meta name="apple-mobile-web-app-capable"[^>]*>\r?\n?/gm,
    /^[ \t]*<meta name="apple-mobile-web-app-status-bar-style"[^>]*>\r?\n?/gm,
    /^[ \t]*<meta name="apple-mobile-web-app-title"[^>]*>\r?\n?/gm,
    /^[ \t]*<meta name="mobile-web-app-capable"[^>]*>\r?\n?/gm,
    /^[ \t]*<link rel="icon"[^>]*favicon-32x32\.png[^>]*>\r?\n?/gm,
    /^[ \t]*<link rel="icon"[^>]*favicon-16x16\.png[^>]*>\r?\n?/gm,
    /^[ \t]*<link rel="apple-touch-icon"[^>]*apple-touch-icon\.png[^>]*>\r?\n?/gm,
    /^[ \t]*<link rel="manifest"[^>]*manifest\.webmanifest[^>]*>\r?\n?/gm,
  ];
  const sharedScriptPatterns = [
    /^[ \t]*<!-- Scripts -->\r?\n?/gm,
    /^[ \t]*<script[^>]*components\.js[^>]*><\/script>\r?\n?/gm,
    /^[ \t]*<script[^>]*install-prompt\.js[^>]*><\/script>\r?\n?/gm,
    /^[ \t]*<script[^>]*tracking\.js[^>]*><\/script>\r?\n?/gm,
    /^[ \t]*<script[^>]*tracking-loader\.js[^>]*><\/script>\r?\n?/gm,
    /^[ \t]*<script[^>]*cookie-consent\.js[^>]*><\/script>\r?\n?/gm,
    /^[ \t]*<script[^>]*main\.js[^>]*><\/script>\r?\n?/gm,
  ];

  let normalized = ensureViewportMeta(content);
  normalized = stripPatterns(normalized, appInstallPatterns);
  normalized = stripPatterns(normalized, sharedScriptPatterns);
  normalized = insertSharedAppMarkup(normalized, buildSharedAppInstallMarkup(assetPrefix));
  normalized = insertSharedScriptMarkup(normalized, buildSharedScriptMarkup(assetPrefix));

  return normalizeWhitespace(normalized);
}

function normalizeHtmlFile(htmlPath) {
  const absPath = path.join(ROOT, htmlPath);
  if (!fs.existsSync(absPath)) {
    console.error(`  ✗ ${htmlPath}: file not found`);
    process.exitCode = 1;
    return false;
  }

  const original = fs.readFileSync(absPath, 'utf8');
  const normalized = normalizeHtmlSharedMarkup(original, htmlPath);

  if (normalized !== original) {
    fs.writeFileSync(absPath, normalized, 'utf8');
    console.log(`  ✓ normalized ${htmlPath}`);
    return true;
  }

  console.log(`  ✓ ${htmlPath} already normalized`);
  return false;
}

function syncHtmlSharedMarkup() {
  const htmlFiles = getHtmlFiles();
  let changed = 0;

  htmlFiles.forEach((htmlPath) => {
    if (normalizeHtmlFile(htmlPath)) {
      changed += 1;
    }
  });

  if (changed === 0) {
    console.log('  [sync-markup] HTML shared markup already normalized');
  } else {
    console.log(`  [sync-markup] Normalized ${changed} HTML file(s)`);
  }
}

if (singleFile) {
  if (singleFile.endsWith('.src.css')) {
    console.log(`[build] CSS: ${singleFile}`);
    minifyCSS(singleFile);
  } else if (singleFile.endsWith('.src.js')) {
    console.log(`[build] JS: ${singleFile}`);
    minifyJS(singleFile);
  } else if (singleFile.endsWith('.html')) {
    console.log(`[build] HTML: ${singleFile}`);
    normalizeHtmlFile(singleFile);
  } else {
    console.log(`[build] Skipping unsupported file: ${singleFile}`);
  }
} else {
  const start = Date.now();

  if (!typeFilter || typeFilter === 'css') {
    const cssFiles = getFiles('css', '.src.css');
    if (cssFiles.length) {
      console.log(`=== Minifying CSS (${cssFiles.length} files) ===`);
      cssFiles.forEach(minifyCSS);
      console.log();
    } else {
      console.log('=== No .src.css files found — skipping CSS build ===\n');
    }
  }

  if (!typeFilter || typeFilter === 'js') {
    const jsFiles = getFiles('js', '.src.js');
    if (jsFiles.length) {
      console.log(`=== Minifying JS (${jsFiles.length} files) ===`);
      jsFiles.forEach(minifyJS);
      console.log();
    } else {
      console.log('=== No .src.js files found — skipping JS build ===\n');
    }
  }

  if (!typeFilter || typeFilter === 'html') {
    console.log('=== Normalizing HTML shell markup ===');
    syncHtmlSharedMarkup();
    console.log();
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Done in ${elapsed}s.`);
}
