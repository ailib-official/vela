#!/usr/bin/env node
/**
 * Copy prebuilt ailib-wasm-browser artifacts into apps/web/public/wasm.
 *
 * Source: ../ailib-wasm-test/static/wasm (after wasm-pack build in that repo).
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const src = process.env.AILIB_WASM_SRC ?? resolve(root, '..', 'ailib-wasm-test', 'static', 'wasm');
const dest = join(root, 'apps', 'web', 'src', 'vendor', 'wasm');

const files = ['ailib_wasm.js', 'ailib_wasm_bg.wasm'];

if (!existsSync(src)) {
  console.error(`FAIL: WASM source not found: ${src}`);
  console.error('Set AILIB_WASM_SRC or build ailib-wasm-test first.');
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
for (const f of files) {
  const from = join(src, f);
  if (!existsSync(from)) {
    console.error(`FAIL: missing ${from}`);
    process.exit(1);
  }
  copyFileSync(from, join(dest, f));
  console.log(`copied ${f}`);
}
