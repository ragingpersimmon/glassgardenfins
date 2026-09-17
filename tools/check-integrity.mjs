import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
let failures = 0;
let warnings = 0;

function walkFiles(directory, relative = '') {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const relativePath = path.join(relative, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolutePath, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath.replace(/\\/g, '/'));
    }
  }
  return files;
}

function fail(label, detail) {
  failures += 1;
  console.error(`  - [${label}] ${detail}`);
}

function warn(label, detail) {
  warnings += 1;
  console.warn(`  - [${label}] ${detail}`);
}

function resolvesToFile(reference) {
  const clean = reference.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return true;
  const relativePath = clean.replace(/^\/+/, '');
  const target = path.join(repoRoot, relativePath);
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return true;
  return fs.existsSync(path.join(target, 'index.html'));
}

const allFiles = walkFiles(repoRoot);
const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
const sourceFiles = allFiles.filter((file) => /\.(?:html|css|js|mjs|json|xml)$/.test(file));
const allSourceText = sourceFiles
  .map((file) => fs.readFileSync(path.join(repoRoot, file), 'utf8'))
  .join('\n');

console.log(`Checking ${htmlFiles.length} HTML files...\n`);

for (const relativePath of htmlFiles) {
  const html = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

  for (const match of html.matchAll(/(?:href|src|poster)="(\/[^"]*)"/g)) {
    if (!resolvesToFile(match[1])) {
      fail('broken-reference', `${relativePath} -> ${match[1]}`);
    }
  }

  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      fail('invalid-json-ld', `${relativePath}: ${error.message}`);
    }
  }

  for (const match of html.matchAll(/<video\b[^>]*>/g)) {
    const tag = match[0];
    if (!/\bautoplay\b/.test(tag)) continue;
    for (const requiredAttribute of ['muted', 'loop', 'playsinline']) {
      if (!new RegExp(`\\b${requiredAttribute}\\b`).test(tag)) {
        fail('unsafe-autoplay', `${relativePath}: autoplay video is missing ${requiredAttribute}`);
      }
    }
    if (/\bpreload="auto"/.test(tag)) {
      fail('eager-autoplay', `${relativePath}: autoplay video must not preload the full file`);
    }
  }
}

for (const asset of allFiles.filter((file) => file.startsWith('assets/'))) {
  if (!allSourceText.includes(asset)) {
    warn('orphaned-asset', `${asset} is not referenced by any site source`);
  }
}

const localhostUrl = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i;
for (const relativePath of allFiles.filter((file) =>
  /\.(?:html|css|js|mjs|json|txt|md|yml|yaml)$/.test(file)
)) {
  if (relativePath === 'tools/check-integrity.mjs') continue;
  const text = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const match = text.match(localhostUrl);
  if (match) {
    fail('local-artifact', `${relativePath} references ${match[0]}`);
  }
}

if (warnings) console.warn(`\n${warnings} non-blocking warning(s).`);
if (failures) {
  console.error(`\nIntegrity check failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nWhole-site integrity checks passed.');
