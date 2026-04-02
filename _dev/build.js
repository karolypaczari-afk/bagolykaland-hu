#!/usr/bin/env node
/**
 * BAGOLYKALAND.HU — Build script
 * Minifies .src.css → .css and .src.js → .js
 *
 * Usage:
 *   node _dev/build.js              # rebuild everything
 *   node _dev/build.js --type css   # CSS only
 *   node _dev/build.js --type js    # JS only
 *   node _dev/build.js --file css/style.src.css   # single file
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

let singleFile = null;
let typeFilter = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    singleFile = args[++i].replace(/\\/g, '/');
  } else if (args[i] === '--type' && args[i + 1]) {
    typeFilter = args[++i];
  }
}

function getFiles(dir, ext) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];
  return fs.readdirSync(fullDir)
    .filter(f => f.endsWith(ext))
    .map(f => `${dir}/${f}`);
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
    console.log(`  ✓ ${srcPath} → ${outPath}  (${srcSize} → ${outSize}, -${pct}%)`);
  } catch (err) {
    console.error(`  ✗ ${srcPath}: ${err.message}`);
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
    console.log(`  ✓ ${srcPath} → ${outPath}  (${srcSize} → ${outSize}, -${pct}%)`);
  } catch (err) {
    console.error(`  ✗ ${srcPath}: ${err.message}`);
    process.exitCode = 1;
  }
}

// Single-file mode (used by watch)
if (singleFile) {
  if (singleFile.endsWith('.src.css')) {
    console.log(`[build] CSS: ${singleFile}`);
    minifyCSS(singleFile);
  } else if (singleFile.endsWith('.src.js')) {
    console.log(`[build] JS: ${singleFile}`);
    minifyJS(singleFile);
  } else {
    console.log(`[build] Skipping non-source file: ${singleFile}`);
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

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Done in ${elapsed}s.`);
}
