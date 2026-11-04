import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverPublicPages } from './generate-sitemap.mjs';
import { SITE_CONFIG, SITE_ORIGIN } from './site-config.mjs';

// Builds the GitHub Pages artifact: only public files are copied into _site,
// so repository internals (README, package files, tools, tests, config, data)
// are never published.
export const ARTIFACT_DIRECTORY = '_site';
const ROOT_FILE_EXTENSIONS = new Set([
  '.css', '.html', '.ico', '.jpeg', '.jpg', '.js', '.png', '.svg', '.txt', '.webmanifest', '.webp', '.xml'
]);
const SKIPPED_DIRECTORIES = new Set(['node_modules', 'playwright-report', 'test-results', 'tests', 'tools']);
const SKIPPED_FILES = new Set(['Thumbs.db', 'desktop.ini']);
const PRIVATE_PATHS = [
  '.git', '.github', '_data', 'node_modules', 'tests', 'tools',
  'README.md', 'package.json', 'package-lock.json', 'site-config.json'
];
const FOOTER_STAMP = /<time class="site-footer__updated" data-site-updated(?: datetime="[^"]*")?>[^<]*<\/time>/g;

function siteUpdatedAt(repoRoot) {
  const configured = process.env.SITE_UPDATED_AT;
  if (configured) {
    const date = new Date(configured);
    if (Number.isNaN(date.getTime())) throw new Error(`SITE_UPDATED_AT is not a valid date: ${configured}`);
    return date;
  }
  try {
    const committed = execFileSync('git', ['log', '-1', '--format=%cI'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    const date = new Date(committed);
    if (committed && !Number.isNaN(date.getTime())) return date;
  } catch {
    // Not a git checkout; fall through to the current time.
  }
  return new Date();
}

function copyPublicTree(source, target, atRoot) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const { name } = entry;
    if (/^[._]/.test(name) || SKIPPED_FILES.has(name)) continue;
    const from = path.join(source, name);
    const to = path.join(target, name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(name)) copyPublicTree(from, to, false);
    } else if (entry.isFile() && (!atRoot || ROOT_FILE_EXTENSIONS.has(path.extname(name).toLowerCase()))) {
      fs.copyFileSync(from, to);
    }
  }
}

function listFiles(directory, relative = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return listFiles(path.join(directory, entry.name), relativePath);
    return entry.isFile() ? [relativePath] : [];
  });
}

function resolvesInArtifact(outputRoot, reference) {
  let clean = reference.split('#')[0].split('?')[0];
  try {
    clean = decodeURIComponent(clean);
  } catch {
    return false;
  }
  const target = path.join(outputRoot, clean.replace(/^\/+/, ''));
  if (!target.startsWith(outputRoot)) return false;
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return true;
  return fs.existsSync(path.join(target, 'index.html'));
}

function siteReferences(file, text) {
  const references = [];
  const escapedOrigin = SITE_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const match of text.matchAll(new RegExp(`${escapedOrigin}(/[^"'<>\\s)]*)?`, 'g'))) {
    references.push(match[1] || '/');
  }
  if (file.endsWith('.html')) {
    for (const match of text.matchAll(/\b(?:href|src|data-src|poster|content)="(\/(?!\/)[^"]*)"/g)) {
      references.push(match[1]);
    }
  }
  if (file.endsWith('.css')) {
    for (const match of text.matchAll(/url\((['"]?)(\/(?!\/)[^'")]+)\1\)/g)) {
      references.push(match[2]);
    }
  }
  return references;
}

export function buildPagesArtifact(repoRoot, { updatedAt = siteUpdatedAt(repoRoot) } = {}) {
  const root = path.resolve(repoRoot);
  const outputRoot = path.join(root, ARTIFACT_DIRECTORY);
  if (path.dirname(outputRoot) !== root) throw new Error('Refusing to build outside the repository.');
  fs.rmSync(outputRoot, { recursive: true, force: true });
  copyPublicTree(root, outputRoot, true);

  const problems = [];
  const iso = updatedAt.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const stamp = `<time class="site-footer__updated" data-site-updated datetime="${iso}">Updated ${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC</time>`;

  for (const { file } of discoverPublicPages(root)) {
    const target = path.join(outputRoot, file);
    if (!fs.existsSync(target)) {
      problems.push(`missing page ${file}`);
      continue;
    }
    const html = fs.readFileSync(target, 'utf8');
    const stamped = html.replace(FOOTER_STAMP, stamp);
    if (stamped === html && !html.includes(stamp)) problems.push(`${file} has no footer update timestamp`);
    fs.writeFileSync(target, stamped);
  }

  const required = ['index.html', '404.html', 'style.css', 'script.js', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'feed.xml'];
  if (SITE_CONFIG.indexNowKey) required.push(`${SITE_CONFIG.indexNowKey}.txt`);
  for (const file of required) {
    if (!fs.existsSync(path.join(outputRoot, file))) problems.push(`missing required file ${file}`);
  }
  for (const file of PRIVATE_PATHS) {
    if (fs.existsSync(path.join(outputRoot, file))) problems.push(`private path published: ${file}`);
  }

  const files = listFiles(outputRoot);
  for (const file of files.filter((name) => /\.(?:css|html|txt|xml)$/.test(name))) {
    const text = fs.readFileSync(path.join(outputRoot, file), 'utf8');
    for (const reference of new Set(siteReferences(file, text))) {
      if (!resolvesInArtifact(outputRoot, reference)) problems.push(`${file} -> ${reference} does not resolve`);
    }
  }

  if (problems.length) {
    throw new Error(`Pages artifact failed verification:\n  - ${problems.join('\n  - ')}`);
  }
  const bytes = files.reduce((total, file) => total + fs.statSync(path.join(outputRoot, file)).size, 0);
  return { outputRoot, files, bytes, updatedAt: iso };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const { files, bytes, updatedAt } = buildPagesArtifact(process.cwd());
  console.log(`Built ${ARTIFACT_DIRECTORY}/ with ${files.length} files (${(bytes / 1048576).toFixed(1)} MiB), updated ${updatedAt}.`);
}
