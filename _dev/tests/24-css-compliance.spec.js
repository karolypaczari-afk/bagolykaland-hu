// @ts-check
const { test } = require('@playwright/test');
const { CSS_FILES } = require('./helpers/pages');
const fs = require('fs');
const path = require('path');

const CSS_DIR = path.resolve(__dirname, '..', '..', 'css');

/**
 * Brand palette — hex colors allowed without CSS variables.
 * All values are stored lowercase for comparison.
 */
const ALLOWED_HEX = new Set([
  // Teal family
  '#1a5f6a', '#237a87', '#7bccc8', '#d4efed',
  // Mint
  '#8fd4c8', '#d4f0eb', '#5fb8a8',
  // Lavender
  '#b8a9c9', '#e8e2f0', '#9585aa',
  // Peach
  '#f5b88a', '#fde8d8', '#e89a5f',
  // Pink
  '#f2c4d0', '#fce8ed', '#e5a3b5',
  // Orange
  '#e8945a', '#d47a3f',
  // Cream
  '#fdfcfa', '#f5f2ed', '#fffbf7',
  // Text
  '#2a3f42', '#5a7074', '#5f7c80',
  // Text-on-*
  '#7a3a15', '#0d4a42', '#3d2f52', '#6b2040',
  // Universal
  '#fff', '#ffffff', '#000', '#000000',
  // Dark teal variant
  '#14454d',
]);

/**
 * Strip CSS block comments from source text.
 * Returns an array of { text, startLine } segments representing non-comment code.
 */
function stripComments(source) {
  const segments = [];
  let pos = 0;
  let lineNum = 1;

  while (pos < source.length) {
    const commentStart = source.indexOf('/*', pos);
    if (commentStart === -1) {
      // Rest of the file is code
      segments.push({ text: source.slice(pos), startLine: lineNum });
      break;
    }

    // Code before the comment
    if (commentStart > pos) {
      segments.push({ text: source.slice(pos, commentStart), startLine: lineNum });
    }

    // Count newlines up to the comment start
    for (let i = pos; i < commentStart; i++) {
      if (source[i] === '\n') lineNum++;
    }

    // Find comment end
    const commentEnd = source.indexOf('*/', commentStart + 2);
    if (commentEnd === -1) {
      // Unterminated comment — skip the rest
      break;
    }

    // Count newlines inside the comment
    for (let i = commentStart; i < commentEnd + 2; i++) {
      if (source[i] === '\n') lineNum++;
    }

    pos = commentEnd + 2;
  }

  return segments;
}

/**
 * Find all hex colors in code segments (comments already stripped).
 * Returns array of { color, line }.
 */
function findHexColors(segments) {
  const results = [];
  const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;

  for (const seg of segments) {
    const lines = seg.text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const lineNumber = seg.startLine + i;
      let match;
      hexPattern.lastIndex = 0;
      const lineText = lines[i];
      // Use a fresh regex per line to avoid lastIndex issues
      const re = /#[0-9a-fA-F]{3,8}\b/g;
      while ((match = re.exec(lineText)) !== null) {
        results.push({ color: match[0], line: lineNumber });
      }
    }
  }

  return results;
}

/**
 * Normalise a hex color for palette comparison.
 * - Lowercase
 * - Expand 3-digit shorthand to 6-digit (e.g. #abc → #aabbcc) for matching,
 *   but also check the shorthand form directly.
 */
function isAllowed(hex) {
  const lower = hex.toLowerCase();
  if (ALLOWED_HEX.has(lower)) return true;

  // Expand 3-char shorthand and check
  if (lower.length === 4) {
    const expanded = '#' + lower[1] + lower[1] + lower[2] + lower[2] + lower[3] + lower[3];
    if (ALLOWED_HEX.has(expanded)) return true;
  }

  // Collapse 6-char to 3-char shorthand and check
  if (lower.length === 7) {
    if (lower[1] === lower[2] && lower[3] === lower[4] && lower[5] === lower[6]) {
      const short = '#' + lower[1] + lower[3] + lower[5];
      if (ALLOWED_HEX.has(short)) return true;
    }
  }

  return false;
}

/**
 * Collect all .src.css files from the CSS directory.
 */
function collectSrcCssFiles() {
  if (!fs.existsSync(CSS_DIR)) return [];
  return fs.readdirSync(CSS_DIR)
    .filter((f) => f.endsWith('.src.css'))
    .sort();
}

test.describe('@quality 24 — CSS Variable Compliance', () => {
  const srcFiles = collectSrcCssFiles();

  for (const fileName of srcFiles) {
    test(`${fileName} — non-palette hex colors`, () => {
      const filePath = path.join(CSS_DIR, fileName);
      const content = fs.readFileSync(filePath, 'utf-8');
      const segments = stripComments(content);
      const colors = findHexColors(segments);

      const warnings = [];
      for (const { color, line } of colors) {
        if (!isAllowed(color)) {
          warnings.push({ color, line });
        }
      }

      if (warnings.length > 0) {
        console.warn(`\n⚠ ${fileName}: ${warnings.length} non-palette hex color(s) found:`);
        for (const w of warnings) {
          console.warn(`  Line ${w.line}: ${w.color}`);
        }
      }

      // Test passes — warnings are informational only
    });
  }
});
