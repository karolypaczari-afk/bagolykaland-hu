// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.resolve(__dirname, '..', '..', 'assets', 'images');
const MAX_FILE_SIZE = 600 * 1024; // 600 KB per image (PNG/JPG)
const MAX_DIMENSION = 1400; // max width or height in pixels

/**
 * Recursively collect all raster image files from a directory.
 */
function collectImages(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectImages(fullPath));
    } else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

test.describe('16 — Image Optimization', () => {
  const images = collectImages(IMAGES_DIR);

  test('all images are under max file size', () => {
    const oversized = [];
    for (const img of images) {
      const stat = fs.statSync(img);
      const sizeKB = stat.size / 1024;
      if (stat.size > MAX_FILE_SIZE) {
        oversized.push(`${path.relative(IMAGES_DIR, img)} (${Math.round(sizeKB)}KB > ${MAX_FILE_SIZE / 1024}KB)`);
      }
    }
    expect(
      oversized,
      `Oversized images found. Run "npm run optimize:images" to fix:\n${oversized.join('\n')}`
    ).toHaveLength(0);
  });

  test('all PNG/JPG images have a WebP version', () => {
    const rasterImages = images.filter((f) => /\.(png|jpe?g)$/i.test(f));
    const missingWebp = [];
    for (const img of rasterImages) {
      const webpPath = img.replace(/\.(png|jpe?g)$/i, '.webp');
      if (!fs.existsSync(webpPath)) {
        missingWebp.push(path.relative(IMAGES_DIR, img));
      }
    }
    expect(
      missingWebp,
      `Images missing WebP versions. Run "npm run optimize:images" to fix:\n${missingWebp.join('\n')}`
    ).toHaveLength(0);
  });

  test('no excessively large image dimensions', async () => {
    // Use sharp to check dimensions if available, otherwise skip
    let sharp;
    try {
      sharp = require('sharp');
    } catch {
      test.skip(true, 'sharp not installed — skipping dimension check');
      return;
    }

    const oversizedDims = [];
    for (const img of images) {
      if (/\.webp$/i.test(img)) continue; // WebP generated from optimized source, skip
      try {
        const metadata = await sharp(fs.readFileSync(img)).metadata();
        if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
          oversizedDims.push(
            `${path.relative(IMAGES_DIR, img)} (${metadata.width}x${metadata.height} — max ${MAX_DIMENSION}px)`
          );
        }
      } catch {
        // Skip files that can't be read
      }
    }
    expect(
      oversizedDims,
      `Images with excessive dimensions. Run "npm run optimize:images" to fix:\n${oversizedDims.join('\n')}`
    ).toHaveLength(0);
  });
});
