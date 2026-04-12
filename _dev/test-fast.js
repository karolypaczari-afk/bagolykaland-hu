#!/usr/bin/env node
/**
 * Fast test runner — faster than the full suite and Windows-safe.
 *
 * Strategy:
 * - Tests representative pages only when FAST_MODE is enabled
 * - Runs consolidated smoke + static validation suites
 * - Keeps the command portable across Windows/macOS/Linux shells
 */
const { execSync } = require('child_process');

process.env.FAST_MODE = '1';

const args = process.argv.slice(2);
const runAll = args.includes('--all');
const rest = args.filter((arg) => arg !== '--all');

const FAST_FILES = [
  '00-smoke',
  '00-ios-smoke',
  '01-html',
  '02-css',
  '04-images',
  '09-seo',
  '13-global',
  '20-image',
  '23-link',
  '24-css',
  '26-asset',
];

const parts = ['npx', 'playwright', 'test'];

if (!runAll && rest.length === 0) {
  for (const file of FAST_FILES) {
    parts.push(file);
  }
}

parts.push(...rest);

const command = parts.join(' ');

try {
  execSync(command, { stdio: 'inherit', env: process.env });
} catch (error) {
  process.exit(error.status || 1);
}
