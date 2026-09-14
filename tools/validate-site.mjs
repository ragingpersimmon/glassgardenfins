import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const pages = [
  { file: 'index.html', expectedPath: '/' },
  { file: path.join('tank', 'index.html'), expectedPath: '/tank/' },
  { file: path.join('journal', 'index.html'), expectedPath: '/journal/' }
];

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function extractAttribute(html, regex, label, file) {
  const match = html.match(regex);
  check(Boolean(match?.[1]), `${file}: missing ${label}`);
  return match?.[1] ?? '';
}

function fileExistsForRootPath(sitePath) {
  if (!sitePath.startsWith('/')) return false;
  const normalized = sitePath.replace(/^\//, '');
  return fs.existsSync(path.join(repoRoot, normalized));
}

const cname = read('CNAME').trim();
check(Boolean(cname), 'CNAME: expected non-empty domain');

for (const page of pages) {
  const html = read(page.file);
  check(/<!DOCTYPE html>/i.test(html), `${page.file}: missing doctype`);
  check(/<html[^>]*\blang="en"/i.test(html), `${page.file}: expected <html lang="en">`);
  check(/<title>[^<]+<\/title>/i.test(html), `${page.file}: missing <title>`);
  check(/<meta\s+name="description"\s+content="[^"]+"\s*\/?>/i.test(html), `${page.file}: missing meta description`);

  const canonical = extractAttribute(
    html,
    /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/i,
    'canonical URL',
    page.file
  );

  const ogUrl = extractAttribute(
    html,
    /<meta\s+property="og:url"\s+content="([^"]+)"\s*\/?>/i,
    'og:url',
    page.file
  );

  const twitterUrl = extractAttribute(
    html,
    /<meta\s+name="twitter:url"\s+content="([^"]+)"\s*\/?>/i,
    'twitter:url',
    page.file
  );

  check(canonical === `https://${cname}${page.expectedPath}`, `${page.file}: canonical should be https://${cname}${page.expectedPath}`);
  check(ogUrl === canonical, `${page.file}: og:url should match canonical`);
  check(twitterUrl === canonical, `${page.file}: twitter:url should match canonical`);

  const styleHref = extractAttribute(
    html,
    /<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/i,
    'stylesheet href',
    page.file
  );
  check(styleHref === '/style.css', `${page.file}: stylesheet href should be /style.css`);
  check(fileExistsForRootPath(styleHref), `${page.file}: stylesheet file not found for ${styleHref}`);

  const scriptSrc = extractAttribute(
    html,
    /<script\s+src="([^"]+)"\s*><\/script>/i,
    'script src',
    page.file
  );
  check(scriptSrc === '/script.js', `${page.file}: script src should be /script.js`);
  check(fileExistsForRootPath(scriptSrc), `${page.file}: script file not found for ${scriptSrc}`);

  const links = [...html.matchAll(/<a\s+[^>]*href="([^"]+)"/gi)].map((m) => m[1]);
  const internalLinks = links.filter((href) => href.startsWith('/'));

  for (const href of internalLinks) {
    const localTarget = href.endsWith('/') ? `${href}index.html` : href;
    const fsTarget = path.join(repoRoot, localTarget.replace(/^\//, ''));
    check(fs.existsSync(fsTarget), `${page.file}: broken internal link ${href}`);
  }
}

const scriptJs = read('script.js');
const scriptTxt = read('script.txt');
check(scriptJs === scriptTxt, 'script.js and script.txt should stay in sync');
check(/prefers-reduced-motion/.test(scriptJs), 'script.js should preserve reduced-motion behavior');
check(/IntersectionObserver/.test(scriptJs), 'script.js should preserve IntersectionObserver fallback');

if (failures.length) {
  console.error('Deterministic validation failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Deterministic validation passed.');
