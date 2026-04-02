#!/usr/bin/env node
/**
 * BAGOLYKALAND.HU — Image optimization script
 *
 * Converts images in the input folder to WebP, resizes, and outputs to img/
 *
 * Usage:
 *   node _dev/scripts/optimize-images.js          # process all
 *   node _dev/scripts/optimize-images.js --dry-run  # preview without writing
 *
 * Input:  _dev/input/
 * Output: img/
 *
 * Standard sizes:
 *   Service cards:  624 × 416  (3:2)
 *   Hero images:    900 × 600  (3:2)
 *   Blog thumbs:    800 × 450  (16:9)
 *   OG image:      1200 × 630  (social)
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '../..');
const INPUT   = path.join(ROOT, '_dev', 'input');
const OUTPUT  = path.join(ROOT, 'img');
const DRY_RUN = process.argv.includes('--dry-run');

async function run() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('sharp not installed. Run: npm install');
    process.exit(1);
  }

  if (!fs.existsSync(INPUT)) {
    console.log(`Input folder not found: ${INPUT}`);
    console.log('Create _dev/input/ and place source images there.');
    return;
  }

  fs.mkdirSync(OUTPUT, { recursive: true });

  const files = fs.readdirSync(INPUT).filter(f => /\.(jpe?g|png|webp|tiff?)$/i.test(f));

  if (!files.length) {
    console.log('No images found in _dev/input/');
    return;
  }

  console.log(`Processing ${files.length} image(s)${DRY_RUN ? ' [DRY RUN]' : ''}...\n`);

  for (const file of files) {
    const src  = path.join(INPUT, file);
    const base = path.basename(file, path.extname(file)).toLowerCase().replace(/\s+/g, '-');
    const dest = path.join(OUTPUT, `${base}.webp`);

    if (DRY_RUN) {
      console.log(`  would convert: ${file} → img/${base}.webp`);
      continue;
    }

    try {
      await sharp(src)
        .webp({ quality: 80 })
        .toFile(dest);

      const srcSize  = fs.statSync(src).size;
      const destSize = fs.statSync(dest).size;
      const pct      = ((1 - destSize / srcSize) * 100).toFixed(0);
      console.log(`  ✓ ${file} → ${base}.webp  (${srcSize} → ${destSize}, -${pct}%)`);
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }

  console.log('\nDone.');
}

run();
